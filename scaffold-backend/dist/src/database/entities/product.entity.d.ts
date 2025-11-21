import { Category } from './category.entity';
import { ProductType } from './product-type.enum';
export declare class Product {
    id: string;
    categoryId: string;
    category: Category;
    name: string;
    sku?: string;
    unit?: string;
    defaultCost?: number;
    productType?: ProductType;
    extra?: any;
    createdAt: Date;
    updatedAt: Date;
}
