// src/swms/swms.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Swms } from '../database/entities/swms.entity';
import { Repository } from 'typeorm';
import { CreateSwmsDto } from './dto/create-swms.dto';
import { UpdateSwmsDto } from './dto/update-swms.dto';
import { NotificationsService } from '../notifications/notification.service';

import { v4 as uuidv4 } from 'uuid';
import { extname, join } from 'path';
import { promises as fs } from 'fs';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class SwmsService {
  private s3: S3Client | null = null;
  private bucket: string | null = null;
  private isS3Enabled = false;

  constructor(
    @InjectRepository(Swms) private repo: Repository<Swms>,
    private notificationsSvc: NotificationsService,
  ) {
    // Properly handle string | undefined → string | null
    const accessKey = process.env.AWS_ACCESS_KEY_ID?.trim() || null;
    const secretKey = process.env.AWS_SECRET_ACCESS_KEY?.trim() || null;
    const region = process.env.AWS_REGION?.trim() || null;
    const bucket = process.env.AWS_S3_BUCKET?.trim() || null;

    if (accessKey && secretKey && region && bucket) {
      this.s3 = new S3Client({
        region,
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      });
      this.bucket = bucket;
      this.isS3Enabled = true;
      console.log('SWMS: S3 uploads enabled →', this.bucket);
    } else {
      this.bucket = null;
      console.log('SWMS: No AWS credentials → using local /uploads folder');
      this.ensureUploadsFolder();
    }
  }

  private async ensureUploadsFolder() {
    const dir = join(process.cwd(), 'uploads');
    await fs.mkdir(dir, { recursive: true });
  }

  private async uploadFile(file: Express.Multer.File): Promise<string> {
    const ext = extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const key = `swms/${filename}`;

    if (this.isS3Enabled && this.s3 && this.bucket) {
      try {
        await this.s3.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          }),
        );
        return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      } catch (err) {
        console.error('S3 upload failed, falling back to local', err);
      }
    }

    // Local fallback
    const filepath = join(process.cwd(), 'uploads', filename);
    await fs.writeFile(filepath, file.buffer);
    return `/uploads/${filename}`;
  }

  private async deleteFile(url: string): Promise<void> {
    if (!url) return;

    if (this.isS3Enabled && url.includes('amazonaws.com') && this.bucket) {
      try {
        const key = url.split('.com/')[1];
        await this.s3!.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
          }),
        );
        console.log('Deleted from S3:', key);
      } catch (err) {
        console.warn('Failed to delete from S3:', url);
      }
    } else if (url.startsWith('/uploads/')) {
      try {
        const filepath = join(process.cwd(), url);
        await fs.unlink(filepath);
        console.log('Deleted local file:', filepath);
      } catch (err) {
        console.warn('Local file not found (already deleted):', url);
      }
    }
  }

  async create(dto: CreateSwmsDto & { files?: Express.Multer.File[] }) {
    if (!dto.formData) throw new BadRequestException('formData is required');
    if (!dto.tasks || !Array.isArray(dto.tasks))
      throw new BadRequestException('tasks must be an array');

    const uploadedUrls: string[] = [];
    if (dto.files && dto.files.length > 0) {
      for (const file of dto.files) {
        const url = await this.uploadFile(file);
        uploadedUrls.push(url);
      }
    }

    const ent = this.repo.create({
      orderId: dto.orderId ?? null,
      submittedBy: dto.submittedBy ?? null,
      swmsData: dto.formData,
      highRiskTasks: dto.tasks,
      attachments: [...(dto.attachments || []), ...uploadedUrls],
      editableByAdmin: true,
    });

    const saved = await this.repo.save(ent);

    // Notification
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      const subject = `SWMS submitted (Order: ${dto.orderId ?? 'N/A'})`;
      const text = `SWMS id: ${saved.id}`;
      try {
        await this.notificationsSvc.enqueueEmailNotification(adminEmail, subject, text, 'swms', saved.id);
      } catch (e) {
        console.warn('Notification failed:', e);
      }
    }

    return saved;
  }

  async update(id: string, dto: UpdateSwmsDto & { newFiles?: Express.Multer.File[] }, isAdmin = false) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('SWMS not found');
    if (!existing.editableByAdmin && !isAdmin)
      throw new ForbiddenException('Only admin can edit');

    const newUrls: string[] = [];
    if (dto.newFiles && dto.newFiles.length > 0) {
      for (const file of dto.newFiles) {
        const url = await this.uploadFile(file);
        newUrls.push(url);
      }
    }

    const finalAttachments = [
      ...(dto.attachments || existing.attachments || []),
      ...newUrls,
    ];

    if (dto.orderId !== undefined) existing.orderId = dto.orderId || null;
    if (dto.submittedBy !== undefined) existing.submittedBy = dto.submittedBy || null;
    if (dto.formData !== undefined) {
      existing.swmsData = { ...existing.swmsData, ...dto.formData };
    }
    if (dto.tasks !== undefined) {
      existing.highRiskTasks = dto.tasks;
    }
    existing.attachments = finalAttachments;
    existing.editableByAdmin = true;

    return await this.repo.save(existing);
  }

  async get(id: string) {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('SWMS not found');
    return ent;
  }

  async listAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findByOrder(orderId: string) {
    return this.repo.find({ where: { orderId }, order: { createdAt: 'DESC' } });
  }

  async delete(id: string) {
    const ent = await this.get(id);

    if (ent.attachments && ent.attachments.length > 0) {
      for (const url of ent.attachments) {
        await this.deleteFile(url);
      }
    }

    await this.repo.remove(ent);
    return { message: 'SWMS and all attachments deleted successfully' };
  }
}