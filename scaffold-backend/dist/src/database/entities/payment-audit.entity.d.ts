export declare class PaymentAudit {
    id: string;
    paymentId: string;
    oldValue: string;
    newValue?: string;
    changedBy?: string | null;
    createdAt: Date;
}
