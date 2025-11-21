export declare enum PaymentMethod {
    CASH = "CASH",
    BANK_TRANSFER = "BANK_TRANSFER",
    CARD = "CARD",
    CHEQUE = "CHEQUE",
    OTHER = "OTHER"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    REVERSED = "REVERSED"
}
export declare class Payment {
    id: string;
    invoiceId?: string | null;
    builderId?: string | null;
    amount: number;
    method: PaymentMethod;
    reference?: string | null;
    status: PaymentStatus;
    notes?: string;
    recordedBy?: string | null;
    createdAt: Date;
}
