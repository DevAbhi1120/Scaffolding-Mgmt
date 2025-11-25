import { InventoryService } from './inventory.service';
import { MarkDamagedDto } from './dto/mark-damaged.dto';
import { MarkLostDto } from './dto/mark-lost.dto';
import { RecoverItemDto } from './dto/recover-item.dto';
export declare class LossController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    markDamaged(dto: MarkDamagedDto, req: any): Promise<{
        success: boolean;
    }>;
    markLost(dto: MarkLostDto, req: any): Promise<{
        success: boolean;
    }>;
    recoverItem(dto: RecoverItemDto, req: any): Promise<{
        success: boolean;
    }>;
    listLostDamaged(productId?: string, from?: string, to?: string): Promise<{
        success: boolean;
        data: import("../database/entities/inventory-item.entity").InventoryItem[];
    }>;
}
