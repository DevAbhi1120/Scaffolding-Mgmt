import { Repository } from 'typeorm';
import { Product } from '../database/entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Category } from '../database/entities/category.entity';
export declare class ProductsService {
    private repo;
    private categoryRepo;
    constructor(repo: Repository<Product>, categoryRepo: Repository<Category>);
    create(dto: CreateProductDto): Promise<Product[]>;
    findAll(q?: {
        search?: string;
        categoryId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: Product[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Product>;
    update(id: string, dto: UpdateProductDto): Promise<Product>;
    remove(id: string): Promise<Product>;
}
