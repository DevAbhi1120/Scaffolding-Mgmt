import { Product } from './product.entity';
export declare enum MovementType {
    IN = "IN",
    OUT = "OUT",
    ADJUSTMENT = "ADJUSTMENT"
}
export declare enum MovementReason {
    PURCHASE = "PURCHASE",
    SALE = "SALE",
    ORDER_RESERVE = "ORDER_RESERVE",
    ORDER_RELEASE = "ORDER_RELEASE",
    DAMAGE = "DAMAGE",
    LOSS = "LOSS",
    MANUAL = "MANUAL"
}
export declare enum MovementReferenceType {
    ORDER = "ORDER",
    JOB = "JOB",
    PURCHASE_ORDER = "PURCHASE_ORDER",
    ADJUSTMENT = "ADJUSTMENT",
    SYSTEM = "SYSTEM"
}
export declare class InventoryMovement {
    id: string;
    product: Product;
    productId: string;
    inventoryItemId?: string | null;
    quantity: number;
    movementType: MovementType;
    reason: MovementReason;
    referenceType?: MovementReferenceType | null;
    referenceId?: string | null;
    notes?: string | null;
    createdBy?: string | null;
    createdAt: Date;
}
