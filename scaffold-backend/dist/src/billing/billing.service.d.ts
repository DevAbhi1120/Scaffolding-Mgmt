import { DataSource, Repository } from 'typeorm';
import { Invoice } from '../database/entities/invoice.entity';
import { InvoiceItem } from '../database/entities/invoice-item.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Payment } from '../database/entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentAudit } from '../database/entities/payment-audit.entity';
export declare class BillingService {
    private dataSource;
    private invoiceRepo;
    private invoiceItemRepo;
    private paymentRepo;
    private auditRepo;
    constructor(dataSource: DataSource, invoiceRepo: Repository<Invoice>, invoiceItemRepo: Repository<InvoiceItem>, paymentRepo: Repository<Payment>, auditRepo: Repository<PaymentAudit>);
    private generateInvoiceNumber;
    createAdvancePayment({ builderId, amount, paymentMethod, reference, note, appliedInvoiceId, receivedBy }: {
        builderId: string;
        amount: number;
        paymentMethod?: string;
        reference?: string | null;
        note?: string | null;
        appliedInvoiceId?: string | null;
        receivedBy?: string | null;
    }): Promise<Payment[]>;
    applyPaymentToInvoice(invoiceId: string, { amount, paymentMethod, reference, receivedBy }: {
        amount: number;
        paymentMethod?: string;
        reference?: string | null;
        receivedBy?: string | null;
    }): Promise<Payment[]>;
    getCustomerLedger(builderId: string): Promise<{
        builderId: string;
        totalInvoices: number;
        totalPayments: number;
        balance: number;
        ledger: any[];
    }>;
    ledgerPrintHtml(builderId: string): Promise<string>;
    ledgerPrintPdf(builderId: string): Promise<any>;
    createInvoiceForFee({ builderId, orderId, description, amount, }: {
        builderId?: string | null;
        orderId?: string | null;
        description: string;
        amount: number;
    }): Promise<Invoice>;
    createInvoiceFromOrder(orderId: string): Promise<Invoice>;
    createInvoice(dto: CreateInvoiceDto): Promise<Invoice>;
    getInvoice(invoiceId: string): Promise<{
        invoice: Invoice;
        payments: Payment[];
        paid: number;
        balance: number;
    }>;
    createPayment(dto: CreatePaymentDto): Promise<Payment>;
    updatePayment(paymentId: string, dto: Partial<CreatePaymentDto>, changedBy?: string): Promise<Payment>;
    paymentsForBuilder(builderId: string, page?: number, limit?: number): Promise<{
        items: Payment[];
        total: number;
        page: number;
        limit: number;
    }>;
    invoicePrintHtml(invoiceId: string): Promise<string>;
}
