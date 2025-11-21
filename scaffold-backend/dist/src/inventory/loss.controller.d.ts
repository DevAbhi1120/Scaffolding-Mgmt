import { InventoryService } from './inventory.service';
import { MarkDamagedDto } from './dto/mark-damaged.dto';
import { MarkLostDto } from './dto/mark-lost.dto';
import { RecoverItemDto } from './dto/recover-item.dto';
import { Request } from 'express';
export declare class InventoryLossController {
    private inventoryService;
    constructor(inventoryService: InventoryService);
    markDamaged(dto: MarkDamagedDto, req: Request): Promise<import("../database/entities/inventory_item.entity").InventoryItem>;
    markLost(dto: MarkLostDto, req: Request): Promise<import("../database/entities/inventory_item.entity").InventoryItem>;
    recover(dto: RecoverItemDto, req: Request): Promise<import("../database/entities/inventory_item.entity").InventoryItem>;
    list(productId?: string, from?: string, to?: string): Promise<import("../database/entities/inventory_item.entity").InventoryItem[]>;
}
