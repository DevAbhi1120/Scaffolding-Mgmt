import { Product } from './product.entity';
export declare enum InventoryStatus {
    IN_STORE = "IN_STORE",
    ASSIGNED = "ASSIGNED",
    DAMAGED = "DAMAGED",
    LOST = "LOST",
    BROKEN = "BROKEN"
}
export declare enum InventoryCondition {
    GOOD = "GOOD",
    DAMAGED = "DAMAGED",
    LOST = "LOST",
    REPAIRED = "REPAIRED"
}
export declare class InventoryItem {
    id: string;
    product: Product;
    productId: string;
    serialNumber?: string | null;
    status: InventoryStatus;
    condition: InventoryCondition;
    damagedAt?: Date | null;
    damageNotes?: string | null;
    damageFee?: string | null;
    lostAt?: Date | null;
    lostNotes?: string | null;
    lostFee?: string | null;
    deletedAt?: Date | null;
    assignedToOrderId?: string | null;
    siteAddress?: string | null;
    codeNo?: string | null;
    expiryDate?: Date | null;
    extra?: any;
    createdAt: Date;
    updatedAt: Date;
}
