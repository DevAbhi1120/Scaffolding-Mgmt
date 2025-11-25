import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesController {
    private svc;
    constructor(svc: CategoriesService);
    create(dto: CreateCategoryDto, file?: Express.Multer.File): Promise<import("../database/entities/category.entity").Category>;
    list(search?: string, page?: number, limit?: number): Promise<{
        items: import("../database/entities/category.entity").Category[];
        total: number;
        page: number;
        limit: number;
    }>;
    get(id: string): Promise<import("../database/entities/category.entity").Category>;
    update(id: string, dto: UpdateCategoryDto, file?: Express.Multer.File): Promise<import("../database/entities/category.entity").Category>;
    remove(id: string): Promise<import("../database/entities/category.entity").Category>;
}
