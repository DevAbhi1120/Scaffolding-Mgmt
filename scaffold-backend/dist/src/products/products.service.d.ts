import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Product } from '../database/entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsService {
    private productRepo;
    private config;
    private s3;
    constructor(productRepo: Repository<Product>, config: ConfigService);
    private uploadImage;
    create(dto: CreateProductDto, files?: Express.Multer.File[]): Promise<Product>;
    findAll(q?: {
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: Product[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Product>;
    update(id: string, dto: UpdateProductDto, files?: Express.Multer.File[]): Promise<Product>;
    remove(id: string): Promise<Product>;
}
