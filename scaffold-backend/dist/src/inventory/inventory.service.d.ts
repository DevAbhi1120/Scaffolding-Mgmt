import { Repository, EntityManager, DataSource } from 'typeorm';
import { InventoryItem, InventoryStatus } from '../database/entities/inventory_item.entity';
import { InventoryMovement } from '../database/entities/inventory_movement.entity';
import { Product } from '../database/entities/product.entity';
import { CreateInventoryItemDto } from './dto/create-item.dto';
import { InventoryMovementDto } from './dto/movement.dto';
import { AssignItemsDto } from './dto/assign-items.dto';
import { MarkDamagedDto } from './dto/mark-damaged.dto';
import { MarkLostDto } from './dto/mark-lost.dto';
import { RecoverItemDto } from './dto/recover-item.dto';
import { BillingService } from '../billing/billing.service';
export declare class InventoryService {
    private dataSource;
    private itemRepo;
    private movRepo;
    private productRepo;
    private billingService;
    constructor(dataSource: DataSource, itemRepo: Repository<InventoryItem>, movRepo: Repository<InventoryMovement>, productRepo: Repository<Product>, billingService: BillingService);
    reserveAvailableItems(manager: EntityManager, productId: string, qty: number): Promise<InventoryItem[]>;
    assignItemsToOrderWithManager(manager: EntityManager, itemIds: string[], orderId: string): Promise<InventoryItem[]>;
    releaseItemsToStoreWithManager(manager: EntityManager, itemIds: string[]): Promise<void>;
    createItem(dto: CreateInventoryItemDto, createdBy?: string): Promise<InventoryItem>;
    listItems(q?: {
        productId?: string;
        status?: InventoryStatus;
        page?: number;
        limit?: number;
    }): Promise<{
        items: InventoryItem[];
        total: number;
        page: number;
        limit: number;
    }>;
    createMovement(dto: InventoryMovementDto, userId?: string): Promise<InventoryMovement>;
    assignToOrder(dto: AssignItemsDto, userId?: string): Promise<{
        assigned: number;
        serials: string[];
    } | {
        assigned: number;
        serials?: undefined;
    }>;
    returnFromOrder(dto: AssignItemsDto, userId?: string): Promise<{
        returned: number;
        serials: string[];
    } | {
        returned: number;
        serials?: undefined;
    }>;
    getAvailableQuantity(productId: string): Promise<number>;
    movementsForProduct(productId: string, page?: number, limit?: number): Promise<{
        items: InventoryMovement[];
        total: number;
        page: number;
        limit: number;
    }>;
    markDamaged(dto: MarkDamagedDto, performedBy?: string): Promise<InventoryItem>;
    markLost(dto: MarkLostDto, performedBy?: string): Promise<InventoryItem>;
    recoverItem(dto: RecoverItemDto, performedBy?: string): Promise<InventoryItem>;
    listLostDamaged(filters: {
        productId?: string;
        builderId?: string;
        from?: string;
        to?: string;
    }): Promise<InventoryItem[]>;
}
