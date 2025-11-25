import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-item.dto';
import { InventoryMovementDto } from './dto/movement.dto';
import { AssignItemsDto } from './dto/assign-items.dto';
import { MarkDamagedDto } from './dto/mark-damaged.dto';
import { MarkLostDto } from './dto/mark-lost.dto';
import { RecoverItemDto } from './dto/recover-item.dto';
export declare class InventoryController {
    private svc;
    constructor(svc: InventoryService);
    createItem(dto: CreateInventoryItemDto): Promise<import("../database/entities/inventory_item.entity").InventoryItem>;
    listItems(productId?: string, status?: any, page?: number, limit?: number): Promise<{
        items: import("../database/entities/inventory_item.entity").InventoryItem[];
        total: number;
        page: number;
        limit: number;
    }>;
    movement(dto: InventoryMovementDto): Promise<import("../database/entities/inventory_movement.entity").InventoryMovement>;
    getAvailable(id: string): Promise<{
        productId: string;
        available: number;
    }>;
    movements(id: string, page?: number, limit?: number): Promise<{
        items: import("../database/entities/inventory_movement.entity").InventoryMovement[];
        total: number;
        page: number;
        limit: number;
    }>;
    assign(dto: AssignItemsDto): Promise<{
        assigned: number;
        serials: string[];
    } | {
        assigned: number;
        serials?: undefined;
    }>;
    return(dto: AssignItemsDto): Promise<{
        returned: number;
        serials: string[];
    } | {
        returned: number;
        serials?: undefined;
    }>;
    markDamaged(dto: MarkDamagedDto): Promise<import("../database/entities/inventory_item.entity").InventoryItem>;
    markLost(dto: MarkLostDto): Promise<import("../database/entities/inventory_item.entity").InventoryItem>;
    recoverItem(dto: RecoverItemDto): Promise<import("../database/entities/inventory_item.entity").InventoryItem>;
    listLostDamaged(productId?: string, builderId?: string, from?: string, to?: string): Promise<import("../database/entities/inventory_item.entity").InventoryItem[]>;
}
