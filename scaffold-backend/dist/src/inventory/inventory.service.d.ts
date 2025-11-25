import { DataSource, EntityManager, Repository } from 'typeorm';
import { InventoryItem } from '../database/entities/inventory-item.entity';
import { InventoryMovement } from '../database/entities/inventory-movement.entity';
import { CreateInventoryFromFormDto } from './dto/create-inventory-from-form.dto';
import { MarkDamagedDto } from './dto/mark-damaged.dto';
import { MarkLostDto } from './dto/mark-lost.dto';
import { RecoverItemDto } from './dto/recover-item.dto';
export interface ProductInventorySummary {
    productId: string;
    openingStock: number;
    stockIn: number;
    stockOut: number;
    stockBalance: number;
}
export declare class InventoryService {
    private readonly itemsRepo;
    private readonly movementsRepo;
    private readonly dataSource;
    constructor(itemsRepo: Repository<InventoryItem>, movementsRepo: Repository<InventoryMovement>, dataSource: DataSource);
    private getProductSummaryInternal;
    getProductSummary(productId: string): Promise<ProductInventorySummary>;
    createFromForm(dto: CreateInventoryFromFormDto, userId?: string): Promise<ProductInventorySummary>;
    reserveForOrder(productId: string, qty: number, orderId: string, userId?: string): Promise<void>;
    releaseFromOrder(productId: string, qty: number, orderId: string, userId?: string): Promise<void>;
    assignItemToOrder(itemId: string, orderId: string): Promise<void>;
    returnItemFromOrder(itemId: string): Promise<void>;
    markItemDamaged(itemId: string, notes?: string, fee?: number, userId?: string): Promise<void>;
    markItemLost(itemId: string, notes?: string, fee?: number, userId?: string): Promise<void>;
    markDamaged(dto: MarkDamagedDto, userId?: string): Promise<void>;
    markLost(dto: MarkLostDto, userId?: string): Promise<void>;
    recoverItem(dto: RecoverItemDto, userId?: string): Promise<void>;
    listLostDamaged(params: {
        productId?: string;
        from?: string;
        to?: string;
    }): Promise<InventoryItem[]>;
    assignToOrder(params: {
        productId: string;
        orderId: string;
        serialNumbers?: string[];
        quantity: number;
    }, userId?: string): Promise<void>;
    reserveAvailableItems(manager: EntityManager, productId: string, qty: number): Promise<InventoryItem[]>;
    assignItemsToOrderWithManager(manager: EntityManager, itemIds: string[], orderId: string): Promise<void>;
}
