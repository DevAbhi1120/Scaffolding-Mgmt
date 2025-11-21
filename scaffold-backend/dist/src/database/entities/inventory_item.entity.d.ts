import { Product } from './product.entity';
import { Order } from './order.entity';
export declare enum InventoryStatus {
    IN_STORE = "IN_STORE",
    ASSIGNED = "ASSIGNED",
    DAMAGED = "DAMAGED",
    LOST = "LOST",
    BROKEN = "BROKEN",
    OUT_FOR_REPAIR = "OUT_FOR_REPAIR"
}
export declare class InventoryItem {
    id: string;
    productId: string;
    product?: Product | null;
    serialNumber?: string | null;
    siteAddress?: string | null;
    codeNo?: string | null;
    expiryDate?: Date | null;
    status: InventoryStatus;
    assignedToOrderId?: string | null;
    assignedToOrder?: Order | null;
    condition?: string | null;
    damagedAt?: Date | null;
    damageNotes?: string | null;
    damageFee?: number | null;
    lostAt?: Date | null;
    lostNotes?: string | null;
    lostFee?: number | null;
    extra?: any;
    createdAt: Date;
    updatedAt: Date;
}
