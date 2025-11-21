import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsController {
    private svc;
    constructor(svc: ProductsService);
    create(dto: CreateProductDto): Promise<import("../database/entities/product.entity").Product[]>;
    list(search?: string, categoryId?: string, page?: number, limit?: number): Promise<{
        items: import("../database/entities/product.entity").Product[];
        total: number;
        page: number;
        limit: number;
    }>;
    get(id: string): Promise<import("../database/entities/product.entity").Product>;
    update(id: string, dto: UpdateProductDto): Promise<import("../database/entities/product.entity").Product>;
    remove(id: string): Promise<import("../database/entities/product.entity").Product>;
}
