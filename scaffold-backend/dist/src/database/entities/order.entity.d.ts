import { OrderItem } from './order-item.entity';
export declare enum OrderStatus {
    DRAFT = "DRAFT",
    CONFIRMED = "CONFIRMED",
    SHIPPED = "SHIPPED",
    CANCELLED = "CANCELLED"
}
export declare class Order {
    id: string;
    builderId?: string | null;
    status: OrderStatus;
    startDate?: Date | null;
    closeDate?: Date | null;
    extendedUntil?: Date | null;
    notes?: string | null;
    items: OrderItem[];
    createdAt: Date;
    updatedAt: Date;
}
