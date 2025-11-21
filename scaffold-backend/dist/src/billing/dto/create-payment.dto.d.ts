import { PaymentMethod } from '../../database/entities/payment.entity';
export declare class CreatePaymentDto {
    invoiceId?: string;
    builderId?: string;
    amount: number;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
    recordedBy?: string;
}
