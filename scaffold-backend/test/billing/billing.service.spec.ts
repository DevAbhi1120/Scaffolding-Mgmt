import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from '../../src/billing/billing.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Invoice } from '../../src/database/entities/invoice.entity';
import { InvoiceItem } from '../../src/database/entities/invoice-item.entity';
import { Payment } from '../../src/database/entities/payment.entity';
import { Repository } from 'typeorm';

describe('BillingService (unit)', () => {
    let service: BillingService;
    let invoiceRepo: Repository<Invoice>;
    let paymentRepo: Repository<Payment>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BillingService,
                { provide: getRepositoryToken(Invoice), useClass: Repository },
                { provide: getRepositoryToken(InvoiceItem), useClass: Repository },
                { provide: getRepositoryToken(Payment), useClass: Repository },
            ],
        }).compile();

        service = module.get<BillingService>(BillingService);
        invoiceRepo = module.get(getRepositoryToken(Invoice));
        paymentRepo = module.get(getRepositoryToken(Payment));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('getCustomerLedger should throw when builderId missing', async () => {
        await expect(service.getCustomerLedger('')).rejects.toBeDefined();
    });
});
