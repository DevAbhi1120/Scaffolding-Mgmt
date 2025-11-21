import { Product } from './product.entity';
import { User } from './user.entity';
export declare enum MovementType {
    IN = "IN",
    OUT = "OUT",
    ADJUSTMENT = "ADJUSTMENT"
}
export declare class InventoryMovement {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    movementType: MovementType;
    referenceId?: string;
    notes?: string;
    createdBy?: string;
    user?: User;
    createdAt: Date;
}
