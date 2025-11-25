import { NotificationsService } from '../notifications/notification.service';
import { Repository } from 'typeorm';
import { VoidProtection } from '../voids/void.entity';
import { InventoryItem } from '../database/entities/inventory-item.entity';
export declare class ExpiryService {
    private notificationsSvc;
    private voidRepo;
    private invRepo;
    private readonly logger;
    constructor(notificationsSvc: NotificationsService, voidRepo: Repository<VoidProtection>, invRepo: Repository<InventoryItem>);
    dailyExpiryCheck(): Promise<void>;
}
