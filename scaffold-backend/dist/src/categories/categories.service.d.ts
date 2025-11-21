import { Repository } from 'typeorm';
import { Category } from '../database/entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesService {
    private repo;
    constructor(repo: Repository<Category>);
    create(dto: CreateCategoryDto): Promise<Category>;
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
    update(id: string, dto: UpdateCategoryDto): Promise<Category>;
    remove(id: string): Promise<Category>;
}
