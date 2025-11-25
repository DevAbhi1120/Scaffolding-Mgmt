import { Repository } from 'typeorm';
import { Category } from '../database/entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ConfigService } from '@nestjs/config';
export declare class CategoriesService {
    private repo;
    private config;
    private s3;
    constructor(repo: Repository<Category>, config: ConfigService);
    private uploadImage;
    create(dto: CreateCategoryDto, file?: Express.Multer.File): Promise<Category>;
    findAll(q?: {
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: Category[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Category>;
    update(id: string, dto: UpdateCategoryDto, file?: Express.Multer.File): Promise<Category>;
    remove(id: string): Promise<Category>;
}
