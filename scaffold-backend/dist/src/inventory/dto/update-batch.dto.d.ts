export declare class UpdateBatchDto {
    quantity?: number;
    status?: 'IN_STORE' | 'RESERVED' | 'CONSUMED' | 'DAMAGED';
    referenceType?: 'SYSTEM' | 'PURCHASE' | 'ORDER';
    referenceId?: string | null;
}
