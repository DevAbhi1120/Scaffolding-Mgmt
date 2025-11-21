import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-item.dto';
import { InventoryMovementDto } from './dto/movement.dto';
import { AssignItemsDto } from './dto/assign-items.dto';
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
}
