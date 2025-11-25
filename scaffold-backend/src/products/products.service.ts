// src/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Product } from '../database/entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  private s3: S3Client | null = null;

  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    private config: ConfigService,
  ) {
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    const region = this.config.get<string>('AWS_REGION');

    if (accessKeyId && secretAccessKey && region) {
      this.s3 = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });
    }
  }

  private async uploadImage(file: Express.Multer.File): Promise<string> {
    const bucket = this.config.get<string>('AWS_S3_BUCKET');
    const hasAws =
      this.s3 &&
      bucket &&
      this.config.get('AWS_ACCESS_KEY_ID') &&
      this.config.get('AWS_SECRET_ACCESS_KEY');

    const filename = `${Date.now()}-${file.originalname.replace(
      /\s+/g,
      '_',
    )}`;

    if (hasAws) {
      await this.s3!.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: `products/${filename}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
      const region = this.config.get<string>('AWS_REGION');
      return `https://${bucket}.s3.${region}.amazonaws.com/products/${filename}`;
    } else {
      const uploadDir = join(process.cwd(), 'uploads', 'products');
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = join(uploadDir, filename);
      await fs.writeFile(filePath, file.buffer);
      return `/uploads/products/${filename}`;
    }
  }

  async create(dto: CreateProductDto, files?: Express.Multer.File[]) {
    if (!dto.categoryId || !dto.productTypeId) {
      throw new BadRequestException('categoryId and productTypeId are required');
    }

    const product = this.productRepo.create({
      ...dto,
      images: [],
    });

    if (files && files.length > 0) {
      const urls: string[] = [];
      for (const file of files) {
        const url = await this.uploadImage(file);
        urls.push(url);
      }
      product.images = urls;
    }

    return this.productRepo.save(product);
  }

  async findAll(q?: { search?: string; page?: number; limit?: number }) {
    const page = q?.page && q.page > 0 ? q.page : 1;
    const limit = q?.limit && q.limit > 0 ? q.limit : 20;

    const where = q?.search ? { name: ILike(`%${q.search}%`) } : {};

    const [items, total] = await this.productRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    files?: Express.Multer.File[],
  ) {
    const product = await this.findOne(id);

    // Explicitly handle relations (very important)
    if (dto.categoryId) {
      product.categoryId = dto.categoryId;
    }

    if (dto.productTypeId) {
      product.productTypeId = dto.productTypeId;
    }

    // Assign other scalar fields
    Object.assign(product, {
      name: dto.name ?? product.name,
      unit: dto.unit ?? product.unit,
      stockQuantity:
        dto.stockQuantity !== undefined
          ? dto.stockQuantity
          : product.stockQuantity,
      price: dto.price !== undefined ? dto.price : product.price,
      status: dto.status !== undefined ? dto.status : product.status,
      sku: dto.sku ?? product.sku,
      description: dto.description ?? product.description,
      extra: dto.extra ?? product.extra,
    });

    // Handle new images (append)
    if (files && files.length > 0) {
      const newUrls: string[] = [];
      for (const file of files) {
        const url = await this.uploadImage(file);
        newUrls.push(url);
      }

      product.images = [...(product.images || []), ...newUrls];
      // or: product.images = newUrls; // if you want to replace
    }

    return this.productRepo.save(product);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    return this.productRepo.remove(product);
  }
}
