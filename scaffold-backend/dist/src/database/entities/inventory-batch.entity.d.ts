export declare enum InventoryBatchStatus {
    IN_STORE = "IN_STORE",
    RESERVED = "RESERVED",
    CONSUMED = "CONSUMED",
    DAMAGED = "DAMAGED"
}
export declare class InventoryBatch {
    id: string;
    product_id: string;
    quantity: number;
    status: InventoryBatchStatus;
    referenceType?: 'SYSTEM' | 'PURCHASE' | 'ORDER';
    referenceId?: string | null;
    meta?: any;
    createdAt: Date;
    updatedAt: Date;
}
