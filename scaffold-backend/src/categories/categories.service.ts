// src/categories/categories.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Category } from '../database/entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class CategoriesService {
  private s3: S3Client | null = null;

  constructor(
    @InjectRepository(Category) private repo: Repository<Category>,
    private config: ConfigService,
  ) {
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    const region = this.config.get<string>('AWS_REGION');

    if (accessKeyId && secretAccessKey && region) {
      this.s3 = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  private async uploadImage(
    file: Express.Multer.File,
  ): Promise<string | undefined> {
    if (!file) return undefined;

    const bucket = this.config.get<string>('AWS_S3_BUCKET');
    const hasAws =
      this.s3 &&
      bucket &&
      this.config.get('AWS_ACCESS_KEY_ID') &&
      this.config.get('AWS_SECRET_ACCESS_KEY');

    const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;

    if (hasAws) {
      // Upload to S3
      await this.s3!.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: `categories/${filename}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      const region = this.config.get<string>('AWS_REGION');
      const url = `https://${bucket}.s3.${region}.amazonaws.com/categories/${filename}`;
      return url;
    } else {
      // Fallback: local uploads
      const uploadDir = join(process.cwd(), 'uploads', 'categories');
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = join(uploadDir, filename);
      await fs.writeFile(filePath, file.buffer);

      // public URL or relative path
      // assuming you serve /uploads as static in main.ts
      const publicPath = `/uploads/categories/${filename}`;
      return publicPath;
    }
  }

  async create(dto: CreateCategoryDto, file?: Express.Multer.File) {
    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing)
      throw new ConflictException('Category with this name already exists');

    let thumbnailImage: string | undefined;
    if (file) {
      thumbnailImage = await this.uploadImage(file);
    }

    const entity = this.repo.create({
      ...dto,
      thumbnailImage,
    });

    return this.repo.save(entity);
  }

  async findAll(q?: { search?: string; page?: number; limit?: number }) {
    const page = q?.page && q.page > 0 ? q.page : 1;
    const limit = q?.limit && q.limit > 0 ? q.limit : 20;
    const where = q?.search ? { name: ILike(`%${q.search}%`) } : {};
    const [items, total] = await this.repo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
    file?: Express.Multer.File,
  ) {
    const cat = await this.findOne(id);

    if (dto.name && dto.name !== cat.name) {
      const existing = await this.repo.findOne({ where: { name: dto.name } });
      if (existing)
        throw new ConflictException('Category with this name already exists');
    }

    let thumbnailImage: string | undefined;
    if (file) {
      thumbnailImage = await this.uploadImage(file);
    }

    Object.assign(cat, dto);
    if (thumbnailImage) {
      cat.thumbnailImage = thumbnailImage;
    }

    return this.repo.save(cat);
  }

  async remove(id: string) {
    const cat = await this.findOne(id);
    return this.repo.remove(cat);
  }
}
