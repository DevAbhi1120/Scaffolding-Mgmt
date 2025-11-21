export declare class CreateOrderItemDto {
    productId: string;
    quantity: number;
    unitPrice?: number;
    description?: string;
    serialNumbers?: string[];
}
export declare class CreateOrderDto {
    builderId?: string;
    startDate?: string;
    closeDate?: string;
    notes?: string;
    items: CreateOrderItemDto[];
}
