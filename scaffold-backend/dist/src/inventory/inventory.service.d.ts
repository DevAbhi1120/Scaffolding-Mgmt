import { DataSource, EntityManager, Repository } from 'typeorm';
import { InventoryItem } from '../database/entities/inventory-item.entity';
import { InventoryMovement } from '../database/entities/inventory-movement.entity';
import { InventoryBatch } from '../database/entities/inventory-batch.entity';
import { Product } from '../database/entities/product.entity';
import { CreateInventoryFromFormDto } from './dto/create-inventory-from-form.dto';
import { CreateBatchDto } from './dto/create-batch.dto';
export declare class InventoryService {
    private readonly itemsRepo;
    private readonly movementsRepo;
    private readonly batchesRepo;
    private readonly productRepo;
    private readonly dataSource;
    constructor(itemsRepo: Repository<InventoryItem>, movementsRepo: Repository<InventoryMovement>, batchesRepo: Repository<InventoryBatch>, productRepo: Repository<Product>, dataSource: DataSource);
    private getProductSummaryInternal;
    getItemById(itemId: string): Promise<InventoryItem | null>;
    deleteItemById(itemId: string, userId?: string): Promise<boolean>;
    deleteAllForProduct(productId: string): Promise<boolean>;
    private syncProductStock;
    getProductSummary(productId: string): Promise<{
        productId: string;
        stockBalance: number;
        openingStock: number;
        stockIn: number;
        stockOut: number;
    }>;
    createFromForm(dto: CreateInventoryFromFormDto, userId?: string): Promise<{
        productId: string;
        stockBalance: number;
        openingStock: number;
        stockIn: number;
        stockOut: number;
    }>;
    createBatch(dto: CreateBatchDto, userId?: string): Promise<InventoryBatch[]>;
    getBatch(id: string): Promise<InventoryBatch | null>;
    updateBatch(id: string, patch: Partial<InventoryBatch>): Promise<InventoryBatch>;
    deleteBatch(id: string): Promise<{
        success: boolean;
    }>;
    private consumeFromBatches;
    reserveAvailableItems(managerOrProductId: EntityManager | string, productIdOrQty?: string | number, qtyMaybe?: number): Promise<{
        type: 'batch' | 'item';
        id: string;
        qty: number;
    }[]>;
    applyBatchReservationsToOrder(manager: EntityManager, batchReservations: {
        batchId: string;
        qty: number;
    }[], productId: string, orderId: string): Promise<void>;
    assignItemsToOrderWithManager(managerOrItemIds: EntityManager | string[], itemIdsOrOrderId: string[] | string, orderIdMaybe?: string): Promise<void>;
    assignItemsToOrder(itemIds: string[], orderId: string): Promise<void>;
    markItemDamaged(itemId: string, notes?: string, fee?: number, userId?: string): Promise<void>;
    markItemLost(itemId: string, notes?: string, fee?: number, userId?: string): Promise<void>;
    recoverItem(itemId: string, notes?: string, userId?: string): Promise<void>;
    listLostDamaged(params: {
        productId?: string;
        from?: string;
        to?: string;
    }): Promise<InventoryItem[]>;
    listBatches(productId?: string): Promise<InventoryBatch[]>;
    listItems(productId?: string): Promise<InventoryItem[]>;
}
