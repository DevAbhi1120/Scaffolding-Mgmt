import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from '../notifications/notification.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { VoidProtection } from '../voids/void.entity';
import { InventoryItem } from '../database/entities/inventory-item.entity';

@Injectable()
export class ExpiryService {
  private readonly logger = new Logger(ExpiryService.name);
  constructor(
    private notificationsSvc: NotificationsService,
    @InjectRepository(VoidProtection) private voidRepo: Repository<VoidProtection>,
    @InjectRepository(InventoryItem) private invRepo: Repository<InventoryItem>
  ) { }

  // run daily at 02:00
  // run daily at 02:00
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async dailyExpiryCheck() {
    const days = Number(process.env.EXPIRY_ALERT_DAYS ?? 14);
    this.logger.log(`Running expiry check (next ${days} days)`);

    const now = new Date();
    const target = new Date(now);
    target.setDate(now.getDate() + days);
    const targetStr = target.toISOString().slice(0, 10);

    // VOID protections expiring
    const voids = await this.voidRepo
      .createQueryBuilder('v')
      .where('v.expiryDate IS NOT NULL')
      .andWhere('DATE(v.expiryDate) <= :target', { target: targetStr })
      .orderBy('v.expiryDate', 'ASC')
      .getMany();

    for (const v of voids) {
      try {
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
        if (adminEmail) {
          const subj = `VOID protection expiring soon: ${v.id}`;
          const body = `VOID protection ${v.id} (type: ${v.type}) for order ${v.orderId ?? 'N/A'} expires on ${v.expiryDate}`;
          await this.notificationsSvc.enqueueEmailNotification(adminEmail, subj, body, 'void', v.id);
        }
      } catch (e) {
        this.logger.warn('Failed to enqueue void expiry notification: ' + String(e));
      }
    }

    // Inventory items with expiry
    const inv = await this.invRepo
      .createQueryBuilder('i')
      .where('i.expiryDate IS NOT NULL')
      .andWhere('DATE(i.expiryDate) <= :target', { target: targetStr })
      .orderBy('i.expiryDate', 'ASC')
      .getMany();

    for (const item of inv) {
      try {
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
        if (adminEmail) {
          const subj = `Inventory item expiring soon: ${item.id}`;
          const body = `Inventory item ${item.id} (product: ${item.productId}) at site ${item.siteAddress ?? ''} expires on ${item.expiryDate}`;
          await this.notificationsSvc.enqueueEmailNotification(adminEmail, subj, body, 'inventory_item', item.id);
        }
      } catch (e) {
        this.logger.warn('Failed to enqueue inventory expiry notification: ' + String(e));
      }
    }
  }

}
