// src/orders/orders.service.ts
import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Order, OrderStatus } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { InventoryService } from '../inventory/inventory.service';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class OrdersService {
  constructor(
    private dataSource: DataSource,
    private billingService: BillingService,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    private inventoryService: InventoryService,
  ) { }

  // Use transactional create by default to avoid partial state.
  async create(createDto: CreateOrderDto, createdBy?: string) {
    return this.createOrderTransactional(createDto, createdBy);
  }

  async createOrderTransactional(dto: CreateOrderDto, createdBy?: string) {
    if (!dto?.items?.length) throw new BadRequestException('Order must have items');

    return this.dataSource.transaction(async (manager: EntityManager) => {
      const order = manager.create(Order, {
        builderId: dto.builderId ?? null,
        status: OrderStatus.CONFIRMED, // choose initial status (CONFIRMED) — adjust as needed
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        closeDate: dto.closeDate ? new Date(dto.closeDate) : null,
        notes: dto.notes ?? null,
      } as any);

      const savedOrder = await manager.save(order);
      const createdItems: OrderItem[] = [];

      for (const it of dto.items) {
        const productId = it.productId;
        const quantity = Number(it.quantity);
        if (!productId || quantity <= 0) throw new BadRequestException('Invalid order item productId/quantity');

        // Reserve items in inventory (manager-aware if possible)
        let reserved;
        if (typeof this.inventoryService.reserveAvailableItems === 'function') {
          // Prefer manager-aware if available (signature: (manager, productId, quantity))
          try {
            // Try manager-aware call
            reserved = await (this.inventoryService as any).reserveAvailableItems(manager, productId, quantity);
          } catch (err) {

            reserved = await (this.inventoryService as any).reserveAvailableItems(productId, quantity);
          }
        } else {
          throw new InternalServerErrorException('InventoryService.reserveAvailableItems not available');
        }

        if (!Array.isArray(reserved) || reserved.length < quantity) {
          throw new BadRequestException(
            `Insufficient inventory for product ${productId}. Required ${quantity}, available ${Array.isArray(reserved) ? reserved.length : 0}`,
          );
        }

        const itemIds = reserved.map((r) => r.id);

        const orderItem = manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId,
          quantity,
          unitPrice: typeof it.unitPrice !== 'undefined' ? it.unitPrice : null,
          description: it.description ?? null,
          serialNumbers: it.serialNumbers ?? null,
        } as any);

        const savedItem = await manager.save(orderItem);
        createdItems.push(savedItem);

        // Assign reserved items to order (manager-aware if possible)
        if (typeof (this.inventoryService as any).assignItemsToOrderWithManager === 'function') {
          await (this.inventoryService as any).assignItemsToOrderWithManager(manager, itemIds, savedOrder.id, createdBy);
        } else if (typeof (this.inventoryService as any).assignItemsToOrder === 'function') {
          // fallback: non-manager call
          await (this.inventoryService as any).assignItemsToOrder(itemIds, savedOrder.id, createdBy);
        } else {
          throw new InternalServerErrorException('InventoryService assign method not available');
        }
      }

      // Optionally create invoice using manager-aware billing if available
      if ((this.billingService as any).createInvoiceFromOrderWithManager) {
        try {
          const invoice = await (this.billingService as any).createInvoiceFromOrderWithManager(manager, savedOrder.id);
          (savedOrder as any).invoiceId = invoice.id;
          await manager.save(savedOrder);
        } catch (err) {
          // If invoice creation fails, we decide whether to rollback or continue.
          // Here we choose to rollback (throw) so the whole transaction fails.
          throw new BadRequestException(`Failed to create invoice: ${(err as any)?.message ?? err}`);
        }
      }

      return manager.findOne(Order, { where: { id: savedOrder.id }, relations: ['items'] as any });
    });
  }

  async closeOrder(orderId: string, closedBy?: string) {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order as any);
      const order = await orderRepo.findOne({ where: { id: orderId }, relations: ['items'] as any });
      if (!order) throw new NotFoundException('Order not found');

      order.status = OrderStatus.SHIPPED;
      order.closeDate = new Date();
      await manager.save(order);

      if ((this.billingService as any).createInvoiceFromOrderWithManager) {
        const invoice = await (this.billingService as any).createInvoiceFromOrderWithManager(manager, order.id);
        (order as any).invoiceId = invoice.id;
        await manager.save(order);
        return { order, invoice };
      }

      return { order };
    });
  }

  async findOne(id: string) {
    return this.orderRepo.findOne({ where: { id }, relations: ['items'] });
  }

  async findAll(page = 1, limit = 20) {
    const [items, total] = await this.orderRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: [], // return lightweight list; fetch items separately if needed
      order: { createdAt: 'DESC' },
    });
    return { items, total, page, limit };
  }
}
