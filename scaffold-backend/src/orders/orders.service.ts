import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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

  // -------------------- simple create + assign --------------------
  async create(createDto: CreateOrderDto, createdBy?: string) {
    const orderToCreate = this.orderRepo.create({
      builderId: createDto.builderId ?? null,
      startDate: createDto.startDate ? new Date(createDto.startDate) : undefined,
      closeDate: createDto.closeDate ? new Date(createDto.closeDate) : undefined,
      notes: createDto.notes ?? null,
      items: createDto.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice ?? null,
        serialNumbers: it.serialNumbers ?? null,
        description: it.description ?? null,
      })),
    } as any);

    const savedRaw = await this.orderRepo.save(orderToCreate);
    const saved: Order = Array.isArray(savedRaw) ? (savedRaw[0] as Order) : (savedRaw as Order);

    if (!saved?.id) throw new BadRequestException('Failed to create order');

    const orderWithItems = await this.orderRepo.findOne({ where: { id: saved.id }, relations: ['items'] });
    if (!orderWithItems) throw new BadRequestException('Failed to load created order items');

    for (const item of orderWithItems.items) {
      try {
        await this.inventoryService.assignToOrder(
          {
            productId: item.productId,
            orderId: saved.id,
            serialNumbers: item.serialNumbers ?? undefined,
            quantity: item.quantity,
          },
          createdBy,
        );
      } catch (err) {
        throw new BadRequestException(`Failed to assign inventory for product ${item.productId}: ${(err as any)?.message ?? String(err)}`);
      }
    }

    return this.orderRepo.findOne({ where: { id: saved.id }, relations: ['items'] });
  }

  async closeOrder(orderId: string, closedBy?: string) {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order as any);
      const order = await orderRepo.findOne({ where: { id: orderId }, relations: ['items'] });
      if (!order) throw new NotFoundException('Order not found');

      order.status = OrderStatus.CLOSED;
      order.closeDate = new Date();
      await manager.save(order);

      if (this.billingService.createInvoiceFromOrder) {
        const invoice = await this.billingService.createInvoiceFromOrder(order.id);
        (order as any).invoiceId = invoice.id;
        await manager.save(order);
        return { order, invoice };
      }

      return { order };
    });
  }

  // -------------------- manager-aware transactional create --------------------
  async createOrderTransactional(dto: CreateOrderDto) {
    if (!dto?.items?.length) throw new BadRequestException('Order must have items');

    return this.dataSource.transaction(async (manager: EntityManager) => {
      const order = manager.create(Order, {
        builderId: dto.builderId ?? null,
        status: OrderStatus.OPEN,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        closeDate: dto.closeDate ? new Date(dto.closeDate) : null,
        notes: dto.notes ?? null,
      } as any);

      const savedOrder = await manager.save(order);
      const createdItems: OrderItem[] = [];
      const allAssignedItemIds: string[] = [];

      for (const it of dto.items) {
        const productId = it.productId;
        const quantity = Number(it.quantity);
        if (!productId || quantity <= 0) throw new BadRequestException('Invalid order item productId/quantity');

        const reserved = await this.inventoryService.reserveAvailableItems(manager, productId, quantity);
        if (reserved.length < quantity) {
          throw new BadRequestException(`Insufficient inventory for product ${productId}. Required ${quantity}, available ${reserved.length}`);
        }

        const itemIds = reserved.map((r) => r.id);
        allAssignedItemIds.push(...itemIds);

        const orderItem = manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId,
          quantity,
          unitPrice: it.unitPrice ?? 0,
          description: it.description ?? null,
        } as any);

        createdItems.push(await manager.save(orderItem));
        await this.inventoryService.assignItemsToOrderWithManager(manager, itemIds, savedOrder.id);
      }

      return manager.findOne(Order, { where: { id: savedOrder.id }, relations: ['items'] as any });
    });
  }

  async closeOrderTransactional(orderId: string) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, { where: { id: orderId }, relations: ['items'] as any });
      if (!order) throw new NotFoundException('Order not found');

      order.status = OrderStatus.CLOSED;
      order.closeDate = new Date();
      await manager.save(order);

      // Optional: manager-aware invoice creation
      // await this.billingService.createInvoiceFromOrderWithManager(manager, order);

      return order;
    });
  }

  // -------------------- Simple finders --------------------
  async findOne(id: string) {
    return this.orderRepo.findOne({ where: { id }, relations: ['items'] });
  }

  async findAll(page = 1, limit = 20) {
    const [items, total] = await this.orderRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
    return { items, total, page, limit };
  }
}
