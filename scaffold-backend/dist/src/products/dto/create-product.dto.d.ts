import { ProductType } from '../../database/entities/product-type.enum';
export declare class CreateProductDto {
    categoryId: string;
    name: string;
    sku?: string;
    unit?: string;
    defaultCost?: number;
    productType?: ProductType;
    extra?: any;
}
