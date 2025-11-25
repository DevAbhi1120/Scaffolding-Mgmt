// src/product-types/product-types.service.ts
import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ProductType } from '../database/entities/product-type.entity';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class ProductTypesService {
    private s3: S3Client | null = null;

    constructor(
        @InjectRepository(ProductType) private repo: Repository<ProductType>,
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
        file?: Express.Multer.File,
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
            // upload to S3
            await this.s3!.send(
                new PutObjectCommand({
                    Bucket: bucket,
                    Key: `product-types/${filename}`,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                }),
            );

            const region = this.config.get<string>('AWS_REGION');
            return `https://${bucket}.s3.${region}.amazonaws.com/product-types/${filename}`;
        } else {
            // local upload
            const uploadDir = join(process.cwd(), 'uploads', 'product-types');
            await fs.mkdir(uploadDir, { recursive: true });

            const filePath = join(uploadDir, filename);
            await fs.writeFile(filePath, file.buffer);

            // assuming /uploads is served statically in main.ts
            return `/uploads/product-types/${filename}`;
        }
    }

    async create(dto: CreateProductTypeDto, file?: Express.Multer.File) {
        const existing = await this.repo.findOne({ where: { name: dto.name } });
        if (existing) {
            throw new ConflictException('Product type with this name already exists');
        }

        const image = await this.uploadImage(file);

        const entity = this.repo.create({
            ...dto,
            image,
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
        const pt = await this.repo.findOne({ where: { id } });
        if (!pt) throw new NotFoundException('Product type not found');
        return pt;
    }

    async update(
        id: string,
        dto: UpdateProductTypeDto,
        file?: Express.Multer.File,
    ) {
        const pt = await this.findOne(id);

        if (dto.name && dto.name !== pt.name) {
            const existing = await this.repo.findOne({ where: { name: dto.name } });
            if (existing) {
                throw new ConflictException(
                    'Product type with this name already exists',
                );
            }
        }

        let image: string | undefined;
        if (file) {
            image = await this.uploadImage(file);
        }

        Object.assign(pt, dto);
        if (image) pt.image = image;

        return this.repo.save(pt);
    }

    async remove(id: string) {
        const pt = await this.findOne(id);
        return this.repo.remove(pt);
    }
}
