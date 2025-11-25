import { ProductTypesService } from './product-types.service';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';
export declare class ProductTypesController {
    private svc;
    constructor(svc: ProductTypesService);
    create(dto: CreateProductTypeDto, file?: Express.Multer.File): Promise<import("../database/entities/product-type.entity").ProductType>;
    list(search?: string, page?: number, limit?: number): Promise<{
        items: import("../database/entities/product-type.entity").ProductType[];
        total: number;
        page: number;
        limit: number;
    }>;
    get(id: string): Promise<import("../database/entities/product-type.entity").ProductType>;
    update(id: string, dto: UpdateProductTypeDto, file?: Express.Multer.File): Promise<import("../database/entities/product-type.entity").ProductType>;
    remove(id: string): Promise<import("../database/entities/product-type.entity").ProductType>;
}
