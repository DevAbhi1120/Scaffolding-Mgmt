import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ReturnEvent } from './return-event.entity';
import { InventoryItem, InventoryStatus } from '../database/entities/inventory_item.entity';
import { ReturnItemsDto } from './dto/return-items.dto';
import { BillingService } from '../billing/billing.service';
import { NotificationsService } from '../notifications/notification.service';

@Injectable()
export class ReturnsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(ReturnEvent) private returnRepo: Repository<ReturnEvent>,
    @InjectRepository(InventoryItem) private invRepo: Repository<InventoryItem>,
    private billingService: BillingService,
    private notificationsSvc: NotificationsService
  ) {}

  /**
   * Return items API — processes multiple item IDs atomically.
   * For each item:
   *  - create ReturnEvent
   *  - update InventoryItem: assignedToOrderId = null, status = IN_STORE (unless damaged/lost)
   */
  async returnItems(dto: ReturnItemsDto, performedBy?: string) {
    if (!dto || !Array.isArray(dto.itemIds) || dto.itemIds.length === 0) {
      throw new BadRequestException('itemIds required');
    }

    return this.dataSource.transaction(async (manager) => {
      const events: ReturnEvent[] = [];

      for (const id of dto.itemIds) {
        const item = await manager.findOne(InventoryItem, { where: { id } });
        if (!item) throw new NotFoundException(`Inventory item ${id} not found`);

        // create return event
        const ev = manager.create(ReturnEvent, {
          orderId: dto.orderId ?? item.assignedToOrderId ?? null,
          itemId: item.id,
          returnedBy: performedBy ?? null,
          notes: dto.notes ?? null
        } as any);
        const savedEv = await manager.save(ev);
        events.push(savedEv);

        // update inventory item
        // do not override lost/damaged conditions
        if (item.condition === 'LOST') {
          // can't return a lost item; just record event and continue
          continue;
        }

        item.assignedToOrderId = null;
        // if item was DAMAGED, keep status BROKEN; else set to IN_STORE
        item.status = item.condition === 'DAMAGED' ? InventoryStatus.BROKEN : InventoryStatus.IN_STORE;

        await manager.save(item);

        // enqueue notification to admin/builder (optional)
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
        if (adminEmail) {
          const subject = `Item returned: ${item.id}`;
          const body = `Item ${item.id} (product ${item.productId}) returned${dto.orderId ? ` for order ${dto.orderId}` : ''} by ${performedBy ?? 'unknown'}.`;
          try {
            await this.notificationsSvc.enqueueEmailNotification(adminEmail, subject, body, 'return_event', savedEv.id);
          } catch (e) {
            console.warn('Failed to enqueue return notification', (e as any)?.message ?? e);
          }
        }
      }

      return events;
    });
  }

  async getReturnsForOrder(orderId: string) {
    return this.returnRepo.find({ where: { orderId }, order: { returnedAt: 'DESC' } as any });
  }

  /**
   * Called by scheduled job: compute overdue items and invoice late fees:
   * - `overdueItems` is array of InventoryItem rows that still have assignedToOrderId
   * - For each item compute days overdue and apply fee (flat or per day)
   */
  async invoiceLateReturnsForOrder(orderId: string, closeDate: Date) {
    const grace = Number(process.env.LATE_RETURN_GRACE_DAYS ?? 0);
    const feePerDay = Number(process.env.LATE_RETURN_FEE_PER_DAY ?? 20);
    const flatFee = Number(process.env.LATE_RETURN_FLAT_FEE ?? 0);

    const cutoff = new Date(closeDate);
    cutoff.setDate(cutoff.getDate() + grace);

    // find items still assigned to this order
    const items = await this.invRepo.find({ where: { assignedToOrderId: orderId } });

    if (!items || items.length === 0) return [];

    const invoicesCreated = [];

    for (const item of items) {
      // days overdue = max(0, today - cutoff)
      const today = new Date();
      const msPerDay = 1000 * 60 * 60 * 24;
      const overdueDays = Math.max(0, Math.floor((today.getTime() - cutoff.getTime()) / msPerDay));
      let amount = 0;
      if (flatFee > 0) {
        amount = flatFee;
      } else {
        amount = feePerDay * Math.max(1, overdueDays); // at least one day's fee if overdue
      }

      if (amount <= 0) continue;

      // Create invoice fee for this item's builder/order
      try {
        const invoice = await this.billingService.createInvoiceForFee({
          builderId: (item as any).builderId ?? null,
          orderId,
          description: `Late return fee for item ${item.id} (overdue ${overdueDays} day(s))`,
          amount
        });
        invoicesCreated.push({ itemId: item.id, invoiceId: invoice.id, amount });
      } catch (e) {
        console.warn('Failed to create late return fee invoice for item', item.id, e);
      }
    }

    return invoicesCreated;
  }
}
