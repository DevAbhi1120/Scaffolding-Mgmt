import { Order } from '../database/entities/order.entity';
export declare enum VoidType {
    PRE = "PRE",
    POST = "POST"
}
export declare enum VoidStatus {
    OPEN = "OPEN",
    COMPLETED = "COMPLETED",
    EXPIRED = "EXPIRED"
}
export declare class VoidProtection {
    id: string;
    orderId?: string | null;
    order?: Order | null;
    type: VoidType;
    installer?: string | null;
    installedOn?: Date | null;
    expiryDate?: Date | null;
    notes?: string | null;
    attachments?: string[];
    status: VoidStatus;
    createdAt: Date;
}
