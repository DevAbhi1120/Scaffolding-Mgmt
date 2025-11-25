import { InventoryItem } from '../database/entities/inventory-item.entity';
import { Order } from '../database/entities/order.entity';
export declare class ReturnEvent {
    id: string;
    orderId?: string | null;
    order?: Order | null;
    itemId: string;
    item: InventoryItem;
    returnedBy?: string | null;
    returnedAt: Date;
    notes?: string | null;
}
