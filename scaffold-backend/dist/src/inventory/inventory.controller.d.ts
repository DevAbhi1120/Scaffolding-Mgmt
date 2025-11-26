import { InventoryService } from './inventory.service';
import { CreateInventoryFromFormDto } from './dto/create-inventory-from-form.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { MarkDamagedDto } from './dto/mark-damaged.dto';
import { MarkLostDto } from './dto/mark-lost.dto';
import { RecoverItemDto } from './dto/recover-item.dto';
export declare class InventoryController {
    private readonly svc;
    constructor(svc: InventoryService);
    createFromForm(dto: CreateInventoryFromFormDto): Promise<{
        productId: string;
        stockBalance: number;
        openingStock: number;
        stockIn: number;
        stockOut: number;
    }>;
    listItems(productId?: string): Promise<import("../database/entities/inventory-item.entity").InventoryItem[]>;
    getItem(id: string): Promise<import("../database/entities/inventory-item.entity").InventoryItem>;
    deleteItem(id: string): Promise<{
        success: boolean;
    }>;
    deleteProductInventory(productId: string): Promise<{
        success: boolean;
    }>;
    createBatch(dto: CreateBatchDto): Promise<import("../database/entities/inventory-batch.entity").InventoryBatch[]>;
    listBatches(productId?: string): Promise<import("../database/entities/inventory-batch.entity").InventoryBatch[]>;
    getBatch(id: string): Promise<import("../database/entities/inventory-batch.entity").InventoryBatch | null>;
    updateBatch(id: string, dto: UpdateBatchDto): Promise<import("../database/entities/inventory-batch.entity").InventoryBatch>;
    deleteBatch(id: string): Promise<{
        success: boolean;
    }>;
    getSummary(productId: string): Promise<{
        productId: string;
        availablePhysical: number;
        stockBalance: number;
        openingStock: number;
        stockIn: number;
        stockOut: number;
    }>;
    markDamaged(dto: MarkDamagedDto): Promise<void>;
    markLost(dto: MarkLostDto): Promise<void>;
    recover(dto: RecoverItemDto): Promise<void>;
    listLostDamaged(productId?: string, from?: string, to?: string): Promise<import("../database/entities/inventory-item.entity").InventoryItem[]>;
}
