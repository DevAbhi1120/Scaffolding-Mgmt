import { Invoice } from './invoice.entity';
export declare class InvoiceItem {
    id: string;
    invoiceId: string;
    invoice: Invoice;
    productId?: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}
