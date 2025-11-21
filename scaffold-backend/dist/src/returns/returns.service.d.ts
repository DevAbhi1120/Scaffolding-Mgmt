import { Repository, DataSource } from 'typeorm';
import { ReturnEvent } from './return-event.entity';
import { InventoryItem } from '../database/entities/inventory_item.entity';
import { ReturnItemsDto } from './dto/return-items.dto';
import { BillingService } from '../billing/billing.service';
import { NotificationsService } from '../notifications/notification.service';
export declare class ReturnsService {
    private dataSource;
    private returnRepo;
    private invRepo;
    private billingService;
    private notificationsSvc;
    constructor(dataSource: DataSource, returnRepo: Repository<ReturnEvent>, invRepo: Repository<InventoryItem>, billingService: BillingService, notificationsSvc: NotificationsService);
    returnItems(dto: ReturnItemsDto, performedBy?: string): Promise<ReturnEvent[]>;
    getReturnsForOrder(orderId: string): Promise<ReturnEvent[]>;
    invoiceLateReturnsForOrder(orderId: string, closeDate: Date): Promise<{
        itemId: string;
        invoiceId: string;
        amount: number;
    }[]>;
}
