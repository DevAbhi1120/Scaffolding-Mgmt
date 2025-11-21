import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../database/entities/invoice.entity';
import { InvoiceItem } from '../database/entities/invoice-item.entity';
import { Payment } from '../database/entities/payment.entity';
import { PaymentAudit } from '../database/entities/payment-audit.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceItem, Payment, PaymentAudit])],
  providers: [BillingService],
  controllers: [BillingController],
  exports: [BillingService]
})
export class BillingModule {}
