import { Repository, DataSource } from 'typeorm';
import { Order } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { InventoryService } from '../inventory/inventory.service';
import { BillingService } from '../billing/billing.service';
export declare class OrdersService {
    private dataSource;
    private billingService;
    private orderRepo;
    private orderItemRepo;
    private inventoryService;
    constructor(dataSource: DataSource, billingService: BillingService, orderRepo: Repository<Order>, orderItemRepo: Repository<OrderItem>, inventoryService: InventoryService);
    create(createDto: CreateOrderDto, createdBy?: string): Promise<Order | null>;
    createOrderTransactional(dto: CreateOrderDto, createdBy?: string): Promise<Order | null>;
    closeOrder(orderId: string, closedBy?: string): Promise<{
        order: import("typeorm").ObjectLiteral;
        invoice: any;
    } | {
        order: import("typeorm").ObjectLiteral;
        invoice?: undefined;
    }>;
    findOne(id: string): Promise<Order | null>;
    findAll(page?: number, limit?: number): Promise<{
        items: Order[];
        total: number;
        page: number;
        limit: number;
    }>;
}
