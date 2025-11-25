import { Repository } from 'typeorm';
import { ProductType } from '../database/entities/product-type.entity';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';
import { ConfigService } from '@nestjs/config';
export declare class ProductTypesService {
    private repo;
    private config;
    private s3;
    constructor(repo: Repository<ProductType>, config: ConfigService);
    private uploadImage;
    create(dto: CreateProductTypeDto, file?: Express.Multer.File): Promise<ProductType>;
    findAll(q?: {
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: ProductType[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<ProductType>;
    update(id: string, dto: UpdateProductTypeDto, file?: Express.Multer.File): Promise<ProductType>;
    remove(id: string): Promise<ProductType>;
}
