import { Product } from './product.entity';
export declare class Category {
    id: string;
    name: string;
    description?: string;
    thumbnailImage?: string;
    products: Product[];
    createdAt: Date;
    updatedAt: Date;
}
