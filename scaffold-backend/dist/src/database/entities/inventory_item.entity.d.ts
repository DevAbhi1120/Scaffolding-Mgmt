import { Product } from './product.entity';
import { InventoryStatus } from '../../inventory/enums/inventory-status.enum';
import { InventoryCondition } from '../../inventory/enums/inventory-condition.enum';
export declare class InventoryItem {
    id: string;
    product: Product;
    productId: string;
    serialNumber?: string;
    status: InventoryStatus;
    condition?: InventoryCondition;
    damagedAt?: Date;
    damageNotes?: string;
    damageFee?: number;
    lostAt?: Date;
    lostNotes?: string;
    lostFee?: number;
    deletedAt?: Date;
    assignedToOrderId?: string | null;
    siteAddress?: string;
    codeNo?: string;
    expiryDate?: Date;
    extra?: any;
    createdAt: Date;
    updatedAt: Date;
}
export { InventoryStatus, InventoryCondition };
