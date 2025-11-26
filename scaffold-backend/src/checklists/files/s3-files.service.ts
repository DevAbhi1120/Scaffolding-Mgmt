import { Injectable } from '@nestjs/common';
import { IFilesService, UploadResult } from './files.interface';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3FilesService implements IFilesService {
  private client: S3Client;
  private bucket: string;
  private prefix: string;

  constructor() {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
    this.bucket = process.env.AWS_S3_BUCKET as string;
    this.prefix = process.env.AWS_S3_PREFIX ?? 'checklists';
    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  private getKey(filename: string) {
    const ext = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : '';
    return `${this.prefix}/${uuidv4()}${ext}`;
  }

  async uploadMany(files: any[]) {
    const results: UploadResult[] = [];
    for (const f of files) {
      // support memory buffers or multer file
      const originalName = f.originalname ?? f.filename ?? 'file';
      const key = this.getKey(originalName);
      const body = f.buffer ? f.buffer : (f.path ? require('fs').createReadStream(f.path) : f);
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: f.mimetype ?? 'application/octet-stream',
        }),
      );
      results.push({
        key,
        url: `s3://${this.bucket}/${key}`,
        originalName,
        mime: f.mimetype,
        size: f.size,
      });
    }
    return results;
  }

  async getDownloadUrl(key: string, expiresSeconds = 60 * 10) {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, cmd, { expiresIn: expiresSeconds });
  }

  async streamFile(key: string) {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    // res.Body is a stream
    return res.Body as any;
  }

  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  
}
