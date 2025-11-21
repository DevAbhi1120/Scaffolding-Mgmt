// src/files/files.service.ts
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from './file.entity';
import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '../database/entities/role.enum';

@Injectable()
export class FilesService {
  private bucket: string;
  private region: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(FileEntity) private repo: Repository<FileEntity>,
  ) {
    this.bucket =
      this.configService.get<string>('S3_BUCKET') || process.env.S3_BUCKET!;
    this.region =
      this.configService.get<string>('S3_REGION') ||
      process.env.S3_REGION ||
      'us-east-1';
  }

  /**
   * Build S3 v3 client
   */
  private buildS3Client() {
    const accessKeyId =
      this.configService.get('S3_ACCESS_KEY_ID') ||
      process.env.S3_ACCESS_KEY_ID;

    const secretAccessKey =
      this.configService.get('S3_SECRET_ACCESS_KEY') ||
      process.env.S3_SECRET_ACCESS_KEY;

    const region =
      this.configService.get('S3_REGION') ||
      process.env.S3_REGION ||
      'us-east-1';

    // Build config object
    const config: any = { region };

    // Only add credentials if BOTH keys exist
    if (accessKeyId && secretAccessKey) {
      config.credentials = { accessKeyId, secretAccessKey };
    }

    return new S3Client(config);
  }

  /**
   * Create a presigned PUT URL for uploading
   */
  async presign(filename: string, contentType?: string) {
    try {
      const ext = filename.includes('.')
        ? filename.substring(filename.lastIndexOf('.'))
        : '';

      const key = `uploads/${new Date()
        .toISOString()
        .slice(0, 10)}/${uuidv4()}${ext}`;

      const s3 = this.buildS3Client();

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType || 'application/octet-stream',
      });

      const uploadUrl = await getSignedUrl(s3, command, {
        expiresIn: 60 * 10, // 10 minutes
      });

      const fileUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${encodeURIComponent(
        key,
      )}`;

      return { uploadUrl, key, fileUrl };
    } catch (err) {
      throw new InternalServerErrorException('Failed to create presigned URL');
    }
  }

  /**
   * Save metadata to DB
   */
  async saveMetadata(data: {
    key: string;
    filename: string;
    originalName?: string;
    mimeType?: string;
    size?: number;
    relatedEntityType?: string;
    relatedEntityId?: string;
    uploadedBy?: string;
  }) {
    const ent = this.repo.create(data as any);
    return this.repo.save(ent);
  }

  /**
   * Create presigned GET URL by file ID
   */
  async getSignedGetUrl(fileId: string, expiresSeconds = 60) {
    const file = await this.repo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');

    const s3 = this.buildS3Client();
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: file.key,
    });

    const url = await getSignedUrl(s3, cmd, { expiresIn: expiresSeconds });
    return { url, file };
  }

  /**
   * List files belonging to a related entity
   */
  async listFilesForEntity(entityType: string, entityId: string) {
    return this.repo.find({
      where: {
        relatedEntityType: entityType,
        relatedEntityId: entityId,
      },
      order: { createdAt: 'DESC' } as any,
    });
  }

  /**
   * Delete file from S3 & DB with permissions
   */
  async deleteFile(
    fileId: string,
    requestingUser: { id: string; role?: string },
  ) {
    const file = await this.repo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');

    const isOwner =
      file.relatedEntityId && file.relatedEntityId === requestingUser.id;

    const isAdmin =
      requestingUser?.role === Role.ADMIN ||
      requestingUser?.role === Role.SUPER_ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Not allowed to delete this file');
    }

    const s3 = this.buildS3Client();

    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: file.key,
        }),
      );
    } catch (err) {
      console.warn(
        'S3 delete failed (continuing anyway):',
        (err as any)?.message ?? err,
      );
    }

    await this.repo.delete(file.id);
    return { ok: true };
  }
}
