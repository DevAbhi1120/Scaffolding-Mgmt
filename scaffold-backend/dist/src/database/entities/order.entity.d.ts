import { OrderItem } from './order-item.entity';
export declare enum OrderStatus {
    OPEN = "OPEN",
    CLOSED = "CLOSED"
}
export declare class Order {
    id: string;
    builderId?: string | null;
    status: OrderStatus;
    startDate?: Date;
    closeDate?: Date;
    extendedUntil?: Date | null;
    notes?: string | null;
    items: OrderItem[];
    createdAt: Date;
    updatedAt: Date;
}
