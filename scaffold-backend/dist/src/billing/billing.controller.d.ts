import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Response } from 'express';
export declare class BillingController {
    private svc;
    constructor(svc: BillingService);
    private sendHtmlOrPdf;
    createInvoice(dto: CreateInvoiceDto): Promise<import("../database/entities/invoice.entity").Invoice>;
    getInvoice(id: string): Promise<{
        invoice: import("../database/entities/invoice.entity").Invoice;
        payments: import("../database/entities/payment.entity").Payment[];
        paid: number;
        balance: number;
    }>;
    printInvoice(id: string, format: string, res: Response): Promise<Response<any, Record<string, any>>>;
    invoiceVoucher(id: string, format: string, res: Response): Promise<Response<any, Record<string, any>>>;
    invoiceReceipt(id: string, format: string, res: Response): Promise<Response<any, Record<string, any>>>;
    createPayment(dto: CreatePaymentDto): Promise<import("../database/entities/payment.entity").Payment>;
    updatePayment(id: string, dto: UpdatePaymentDto): Promise<import("../database/entities/payment.entity").Payment>;
    paymentsForBuilder(builderId: string, page?: number, limit?: number): Promise<{
        items: import("../database/entities/payment.entity").Payment[];
        total: number;
        page: number;
        limit: number;
    }>;
    createAdvancePayment(body: any): Promise<import("../database/entities/payment.entity").Payment[]>;
    applyPayment(invoiceId: string, body: {
        amount: number;
        paymentMethod?: string;
        reference?: string;
        receivedBy?: string;
    }): Promise<import("../database/entities/payment.entity").Payment[]>;
    getLedger(builderId: string): Promise<{
        builderId: string;
        totalInvoices: number;
        totalPayments: number;
        balance: number;
        ledger: any[];
    }>;
    getLedgerPdf(builderId: string, res: Response, format?: string): Promise<Response<any, Record<string, any>>>;
}
