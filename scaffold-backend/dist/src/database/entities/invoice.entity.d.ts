import { InvoiceItem } from './invoice-item.entity';
export declare enum InvoiceStatus {
    DRAFT = "DRAFT",
    SENT = "SENT",
    PAID = "PAID",
    OPEN = "OPEN",
    PARTIALLY_PAID = "PARTIALLY_PAID",
    CANCELLED = "CANCELLED"
}
export declare class Invoice {
    id: string;
    builderId?: string | null;
    invoiceNumber?: string | null;
    issueDate?: Date;
    dueDate?: Date | null;
    status: InvoiceStatus;
    subtotal: number;
    tax: number;
    total: number;
    items: InvoiceItem[];
    notes?: any;
    createdAt: Date;
    updatedAt: Date;
}
