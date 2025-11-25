import { InventoryStatus } from '../../database/entities/inventory-item.entity';
export declare class CreateInventoryItemDto {
    productId: string;
    serialNumber?: string;
    status?: InventoryStatus;
    siteAddress?: string;
    codeNo?: string;
    expiryDate?: string;
    extra?: any;
}
