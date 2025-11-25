import { Category } from './category.entity';
import { ProductType } from './product-type.entity';
import { InventoryItem } from './inventory-item.entity';
import { InventoryMovement } from './inventory-movement.entity';
export declare class Product {
    id: string;
    inventoryItems: InventoryItem[];
    inventoryMovements: InventoryMovement[];
    category: Category;
    categoryId: string;
    productType: ProductType;
    productTypeId: string;
    name: string;
    sku?: string;
    unit: string;
    stockQuantity: number;
    price: number;
    status: number;
    description?: string;
    extra?: any;
    images?: string[];
    createdAt: Date;
    updatedAt: Date;
}
