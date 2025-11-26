export declare class CreateBatchDto {
    productId: string;
    quantity: number;
    referenceType?: 'SYSTEM' | 'PURCHASE' | 'ORDER';
    referenceId?: string;
}
