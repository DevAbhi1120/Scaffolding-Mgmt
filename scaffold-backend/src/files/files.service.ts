// src/files/files.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { FileEntity } from './file.entity';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { Express } from 'express';

const UPLOAD_ROOT = 'uploads';

interface UploadOptions {
  relatedEntityType?: string;
  relatedEntityId?: string;
  uploadedBy: string;
  category?: string;
}

interface UpdateOptions {
  relatedEntityType?: string;
  relatedEntityId?: string;
  category?: string;
  uploadedBy: string;
  keepKeys?: string[]; // 👈 keys to keep on update
  removeKeys?: string[]; // 👈 keys to remove on update
}

@Injectable()
export class FilesService {
  private bucket: string;
  private region: string;
  private accessKeyId?: string;
  private secretAccessKey?: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(FileEntity) private repo: Repository<FileEntity>,
  ) {
    this.bucket =
      this.configService.get<string>('S3_BUCKET') ||
      process.env.S3_BUCKET ||
      '';

    this.region =
      this.configService.get<string>('S3_REGION') ||
      process.env.S3_REGION ||
      'us-east-1';

    this.accessKeyId =
      this.configService.get<string>('S3_ACCESS_KEY_ID') ||
      process.env.S3_ACCESS_KEY_ID;

    this.secretAccessKey =
      this.configService.get<string>('S3_SECRET_ACCESS_KEY') ||
      process.env.S3_SECRET_ACCESS_KEY;
  }

  // ---------- Helpers ----------

  private isS3Enabled(): boolean {
    return !!(this.accessKeyId && this.secretAccessKey && this.bucket);
  }

  private buildS3Client() {
    return new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId!,
        secretAccessKey: this.secretAccessKey!,
      },
    });
  }

  private resolveFolder(opts: { category?: string; relatedEntityType?: string }) {
    if (opts.category) return opts.category.toLowerCase();
    const type = (opts.relatedEntityType || '').toUpperCase();
    if (type === 'PRODUCT' || type === 'PRODUCTS') return 'products';
    if (type === 'CATEGORY' || type === 'CATEGORIES') return 'categories';
    if (type === 'BUILDER' || type === 'BUILDERS') return 'builders';
    return 'misc';
  }

  private buildKey(
    filename: string,
    opts: { category?: string; relatedEntityType?: string },
  ) {
    const ext = filename.includes('.') ? filename.split('.').pop()! : 'file';
    const folder = this.resolveFolder(opts);
    const date = new Date().toISOString().split('T')[0];
    const id = uuidv4();
    return `${UPLOAD_ROOT}/${folder}/${date}/${id}.${ext}`;
  }

  private getBaseUrl(): string {
    return (
      this.configService.get<string>('APP_URL') ||
      process.env.APP_URL ||
      'http://localhost:3000'
    );
  }

  // ---------- 1. Upload (single / multiple) ----------

  async uploadFiles(
    files: Express.Multer.File[],
    opts: UploadOptions,
  ): Promise<{
    record: FileEntity;
    keys: string[];
    urls: string[];
  }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    if (!opts.relatedEntityId || !opts.relatedEntityType) {
      throw new BadRequestException(
        'relatedEntityType and relatedEntityId are required for uploads',
      );
    }

    const baseUrl = this.getBaseUrl();
    const useS3 = this.isS3Enabled();
    const s3 = useS3 ? this.buildS3Client() : null;

    let entity = await this.repo.findOne({
      where: {
        relatedEntityType: opts.relatedEntityType,
        relatedEntityId: opts.relatedEntityId,
      },
    });

    if (!entity) {
      entity = this.repo.create({
        relatedEntityType: opts.relatedEntityType,
        relatedEntityId: opts.relatedEntityId,
        uploadedBy: opts.uploadedBy,
        keys: [],
      });
    }

    const keys = Array.isArray(entity.keys) ? [...entity.keys] : [];

    for (const file of files) {
      const key = this.buildKey(file.originalname, {
        category: opts.category,
        relatedEntityType: opts.relatedEntityType,
      });

      if (useS3 && s3) {
        await s3.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          }),
        );
      } else {
        const filePath = path.join(process.cwd(), key);
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        await fs.promises.writeFile(filePath, file.buffer);
      }

      keys.push(key);
    }

    entity.keys = keys;
    entity.uploadedBy = opts.uploadedBy;
    const saved = await this.repo.save(entity);

    const urls = saved.keys.map((k) => `${baseUrl}/${k}`);

    return { record: saved, keys: saved.keys, urls };
  }

  // ---------- 2. List records (searchable by relatedEntityId) ----------

  async listFiles(opts: {
    page?: number;
    limit?: number;
    entityType?: string;
    entityId?: string;
  }) {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = opts.limit && opts.limit > 0 ? opts.limit : 20;

    const where: FindOptionsWhere<FileEntity> = {};
    if (opts.entityType) where.relatedEntityType = opts.entityType;
    if (opts.entityId) where.relatedEntityId = opts.entityId;

    const [items, total] = await this.repo.findAndCount({
      where: Object.keys(where).length ? where : undefined,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const baseUrl = this.getBaseUrl();

    const data = items.map((f) => ({
      ...f,
      urls: (f.keys || []).map((k) => `${baseUrl}/${k}`),
    }));

    return {
      items: data,
      total,
      page,
      limit,
    };
  }

  // ---------- 3. Get file location for viewing (by index) ----------

  async getFileLocation(
    id: string,
    index = 0,
  ): Promise<
    | { type: 'local'; key: string; file: FileEntity; filePath: string }
    | { type: 's3'; key: string; file: FileEntity; url: string }
  > {
    const file = await this.repo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('File record not found');

    if (!file.keys || file.keys.length === 0) {
      throw new NotFoundException('No files stored for this record');
    }

    if (index < 0 || index >= file.keys.length) {
      throw new NotFoundException(`No file at index ${index}`);
    }

    const key = file.keys[index];

    if (this.isS3Enabled()) {
      const s3 = this.buildS3Client();
      const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });
      return { type: 's3', key, file, url };
    }

    const filePath = path.join(process.cwd(), key);
    return { type: 'local', key, file, filePath };
  }

  // ---------- 4. Update record (metadata + keepKeys + append files) ----------

  async updateFile(
    id: string,
    files: Express.Multer.File[] | undefined,
    opts: UpdateOptions,
  ): Promise<{
    record: FileEntity;
    keys: string[];
    urls: string[];
  }> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('File record not found');

    const baseUrl = this.getBaseUrl();
    const useS3 = this.isS3Enabled();
    const s3 = useS3 ? this.buildS3Client() : null;

    // metadata
    if (opts.relatedEntityType !== undefined) {
      entity.relatedEntityType = opts.relatedEntityType;
    }
    if (opts.relatedEntityId !== undefined) {
      entity.relatedEntityId = opts.relatedEntityId;
    }
    entity.uploadedBy = opts.uploadedBy;

    const currentKeys = Array.isArray(entity.keys) ? entity.keys : [];

    const keepKeys = Array.isArray(opts.keepKeys)
      ? opts.keepKeys.filter((k) => typeof k === 'string' && k.trim())
      : undefined;

    const removeKeys = Array.isArray(opts.removeKeys)
      ? opts.removeKeys.filter((k) => typeof k === 'string' && k.trim())
      : undefined;

    let keys: string[] = [];
    let keysToRemove: string[] = [];

    if (keepKeys && keepKeys.length > 0) {
      // Mode 1: keepKeys wins (full control)
      keysToRemove = currentKeys.filter((k) => !keepKeys.includes(k));
      keys = [...keepKeys];
    } else if (removeKeys && removeKeys.length > 0) {
      // Mode 2: remove only these keys
      keysToRemove = currentKeys.filter((k) => removeKeys.includes(k));
      keys = currentKeys.filter((k) => !removeKeys.includes(k));
    } else {
      // Mode 3: no keep/remove -> keep everything
      keys = [...currentKeys];
    }

    // Physically delete files for keysToRemove
    for (const key of keysToRemove) {
      if (useS3 && s3) {
        try {
          await s3.send(
            new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
          );
        } catch {
          // ignore
        }
      } else {
        const filePath = path.join(process.cwd(), key);
        try {
          await fs.promises.unlink(filePath);
        } catch {
          // ignore
        }
      }
    }

    // append new files (if any)
    if (files && files.length > 0) {
      for (const file of files) {
        const effectiveRelatedType: string | undefined =
          opts.relatedEntityType ?? (entity.relatedEntityType ?? undefined);

        const key = this.buildKey(file.originalname, {
          category: opts.category,
          relatedEntityType: effectiveRelatedType,
        });

        if (useS3 && s3) {
          await s3.send(
            new PutObjectCommand({
              Bucket: this.bucket,
              Key: key,
              Body: file.buffer,
              ContentType: file.mimetype,
            }),
          );
        } else {
          const filePath = path.join(process.cwd(), key);
          await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
          await fs.promises.writeFile(filePath, file.buffer);
        }

        keys.push(key);
      }
    }

    entity.keys = keys;
    const saved = await this.repo.save(entity);
    const urls = saved.keys.map((k) => `${baseUrl}/${k}`);

    return { record: saved, keys: saved.keys, urls };
  }


  // ---------- 5. Delete record + all its files ----------

  async deleteFile(id: string): Promise<{ success: true }> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('File record not found');

    const useS3 = this.isS3Enabled();
    const s3 = useS3 ? this.buildS3Client() : null;
    const keys = entity.keys || [];

    for (const key of keys) {
      if (useS3 && s3) {
        try {
          await s3.send(
            new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
          );
        } catch {
          // ignore
        }
      } else {
        const filePath = path.join(process.cwd(), key);
        try {
          await fs.promises.unlink(filePath);
        } catch {
          // ignore
        }
      }
    }

    await this.repo.delete(entity.id);
    return { success: true };
  }

  // ---------- 6. Delete by relatedEntity (cascade) ----------

  async deleteFilesForEntity(
    entityType: string,
    entityId: string,
  ): Promise<{ deletedCount: number }> {
    const records = await this.repo.find({
      where: { relatedEntityType: entityType, relatedEntityId: entityId },
    });

    if (!records.length) return { deletedCount: 0 };

    const useS3 = this.isS3Enabled();
    const s3 = useS3 ? this.buildS3Client() : null;

    for (const rec of records) {
      const keys = rec.keys || [];
      for (const key of keys) {
        if (useS3 && s3) {
          try {
            await s3.send(
              new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
            );
          } catch {
            // ignore
          }
        } else {
          const filePath = path.join(process.cwd(), key);
          try {
            await fs.promises.unlink(filePath);
          } catch {
            // ignore
          }
        }
      }
    }

    await this.repo.delete({
      relatedEntityType: entityType,
      relatedEntityId: entityId,
    });

    return { deletedCount: records.length };
  }
}
