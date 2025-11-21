declare class CreateInvoiceItemDto {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
}
export declare class CreateInvoiceDto {
    builderId?: string;
    issueDate?: string;
    dueDate?: string;
    items: CreateInvoiceItemDto[];
    invoiceNumber?: string;
}
export {};
