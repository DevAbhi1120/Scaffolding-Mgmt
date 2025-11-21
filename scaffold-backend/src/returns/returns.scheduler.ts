import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { ReturnsService } from './returns.service';

@Injectable()
export class ReturnsScheduler {
  private readonly logger = new Logger(ReturnsScheduler.name);
  constructor(private ds: DataSource, private returnsService: ReturnsService) {}

  // run daily at 03:00
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async dailyLateReturnCheck() {
    this.logger.log('Running late return check');

    // find orders that have closeDate in the past (and not archived) and that still have assigned items
    const rows = await this.ds
      .createQueryBuilder()
      .select('o.id', 'orderId')
      .addSelect('o.closeDate', 'closeDate')
      .from('orders', 'o')
      .where('o.closeDate IS NOT NULL')
      .andWhere('o.closeDate < NOW()')
      .getRawMany();

    for (const row of rows) {
      const orderId = row.orderId;
      const closeDate = new Date(row.closeDate);
      try {
        const invoices = await this.returnsService.invoiceLateReturnsForOrder(orderId, closeDate);
        if (invoices && invoices.length > 0) {
          this.logger.log(`Created ${invoices.length} late-return invoices for order ${orderId}`);
        }
      } catch (e) {
        this.logger.warn(`Failed to process late returns for order ${orderId}: ${String(e)}`);
      }
    }
  }
}
