import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, DataSource, In } from 'typeorm';
import { InventoryItem, InventoryStatus } from '../database/entities/inventory_item.entity';
import { InventoryMovement, MovementType } from '../database/entities/inventory_movement.entity';
import { Product } from '../database/entities/product.entity';
import { CreateInventoryItemDto } from './dto/create-item.dto';
import { InventoryMovementDto } from './dto/movement.dto';
import { AssignItemsDto } from './dto/assign-items.dto';
import { MarkDamagedDto } from './dto/mark-damaged.dto';
import { MarkLostDto } from './dto/mark-lost.dto';
import { RecoverItemDto } from './dto/recover-item.dto';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class InventoryService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(InventoryItem)
    private itemRepo: Repository<InventoryItem>,
    @InjectRepository(InventoryMovement)
    private movRepo: Repository<InventoryMovement>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    private billingService: BillingService, // ensure BillingModule imported or use forwardRef
  ) { }

  // -------------------- Core Inventory Management --------------------

  async reserveAvailableItems(manager: EntityManager, productId: string, qty: number): Promise<InventoryItem[]> {
    if (!productId) throw new BadRequestException('productId required');
    if (!qty || qty <= 0) throw new BadRequestException('qty must be > 0');

    const qb = manager.createQueryBuilder(InventoryItem, 'i')
      .setLock('pessimistic_write') // FOR UPDATE
      .where('i.productId = :productId', { productId })
      .andWhere('i.status = :status', { status: InventoryStatus.IN_STORE })
      .orderBy('i.createdAt', 'ASC')
      .limit(qty);

    return await qb.getMany();
  }

  async assignItemsToOrderWithManager(manager: EntityManager, itemIds: string[], orderId: string) {
    if (!itemIds || itemIds.length === 0) throw new BadRequestException('No items provided to assign');

    await manager
      .createQueryBuilder()
      .update(InventoryItem)
      .set({ assignedToOrderId: orderId, status: InventoryStatus.ASSIGNED })
      .whereInIds(itemIds)
      .execute();

    return manager.findByIds(InventoryItem, itemIds);
  }

  async releaseItemsToStoreWithManager(manager: EntityManager, itemIds: string[]) {
    if (!itemIds || itemIds.length === 0) return;

    await manager
      .createQueryBuilder()
      .update(InventoryItem)
      .set({ assignedToOrderId: null, status: InventoryStatus.IN_STORE })
      .whereInIds(itemIds)
      .execute();
  }

  async createItem(dto: CreateInventoryItemDto, createdBy?: string) {
    const prod = await this.productRepo.findOne({ where: { id: dto.productId } });
    if (!prod) throw new BadRequestException('Product not found');

    const item = this.itemRepo.create({ ...dto });
    return this.itemRepo.save(item);
  }

  async listItems(q?: { productId?: string; status?: InventoryStatus; page?: number; limit?: number }) {
    const page = q?.page && q.page > 0 ? q.page : 1;
    const limit = q?.limit && q.limit > 0 ? q.limit : 20;
    const where: any = {};
    if (q?.productId) where.productId = q.productId;
    if (q?.status) where.status = q.status;
    const [items, total] = await this.itemRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { items, total, page, limit };
  }

  async createMovement(dto: InventoryMovementDto, userId?: string) {
    const prod = await this.productRepo.findOne({ where: { id: dto.productId } });
    if (!prod) throw new BadRequestException('Product not found');

    if (dto.movementType === MovementType.OUT) {
      const current = await this.getAvailableQuantity(dto.productId);
      if (current < dto.quantity) {
        throw new ConflictException(`Insufficient stock. Available: ${current}, requested: ${dto.quantity}`);
      }
    }

    const movement = this.movRepo.create({
      productId: dto.productId,
      quantity: dto.quantity,
      movementType: dto.movementType,
      referenceId: dto.referenceId,
      notes: dto.notes,
      createdBy: userId,
    });
    return this.movRepo.save(movement);
  }

  async assignToOrder(dto: AssignItemsDto, userId?: string) {
    return this.dataSource.transaction(async (manager) => {
      const prod = await manager.findOne(Product, { where: { id: dto.productId } });
      if (!prod) throw new BadRequestException('Product not found');

      if (dto.serialNumbers?.length) {
        const items = await manager.find(InventoryItem, {
          where: { productId: dto.productId, serialNumber: In(dto.serialNumbers), status: InventoryStatus.IN_STORE },
        });
        if (items.length !== dto.serialNumbers.length) throw new ConflictException('One or more serial numbers not available');

        for (const item of items) {
          item.status = InventoryStatus.ASSIGNED;
          item.assignedToOrderId = dto.orderId;
          await manager.save(item);

          const m = manager.create(InventoryMovement, {
            productId: dto.productId,
            quantity: 1,
            movementType: MovementType.OUT,
            referenceId: dto.orderId,
            notes: `Assigned serial ${item.serialNumber}`,
            createdBy: userId,
          });
          await manager.save(m);
        }
        return { assigned: items.length, serials: dto.serialNumbers };
      }

      if (!dto.quantity || dto.quantity < 1) throw new BadRequestException('quantity required when serialNumbers not provided');

      const available = await this.getAvailableQuantity(dto.productId);
      if (available < dto.quantity) throw new ConflictException(`Insufficient stock. Available: ${available}`);

      const movement = manager.create(InventoryMovement, {
        productId: dto.productId,
        quantity: dto.quantity,
        movementType: MovementType.OUT,
        referenceId: dto.orderId,
        notes: 'Assigned to order',
        createdBy: userId,
      });
      await manager.save(movement);
      return { assigned: dto.quantity };
    });
  }

  async returnFromOrder(dto: AssignItemsDto, userId?: string) {
    return this.dataSource.transaction(async (manager) => {
      if (dto.serialNumbers?.length) {
        const items = await manager.find(InventoryItem, {
          where: { productId: dto.productId, serialNumber: In(dto.serialNumbers), assignedToOrderId: dto.orderId },
        });
        if (items.length !== dto.serialNumbers.length) throw new ConflictException('One or more serial numbers not assigned to the order');

        for (const item of items) {
          item.status = InventoryStatus.IN_STORE;
          item.assignedToOrderId = null;
          await manager.save(item);

          const m = manager.create(InventoryMovement, {
            productId: dto.productId,
            quantity: 1,
            movementType: MovementType.IN,
            referenceId: dto.orderId,
            notes: `Returned serial ${item.serialNumber}`,
            createdBy: userId,
          });
          await manager.save(m);
        }
        return { returned: items.length, serials: dto.serialNumbers };
      }

      if (!dto.quantity || dto.quantity < 1) throw new BadRequestException('quantity required for return');

      const movement = manager.create(InventoryMovement, {
        productId: dto.productId,
        quantity: dto.quantity,
        movementType: MovementType.IN,
        referenceId: dto.orderId,
        notes: 'Returned from order',
        createdBy: userId,
      });
      await manager.save(movement);
      return { returned: dto.quantity };
    });
  }

  async getAvailableQuantity(productId: string): Promise<number> {
    const itemCount = await this.itemRepo.count({ where: { productId } });
    if (itemCount > 0) {
      return this.itemRepo.count({ where: { productId, status: InventoryStatus.IN_STORE } });
    }
    const qb = this.movRepo.createQueryBuilder('m')
      .select("SUM(CASE WHEN m.movementType = 'IN' THEN m.quantity WHEN m.movementType = 'OUT' THEN -m.quantity ELSE m.quantity END)", 'balance')
      .where('m.productId = :productId', { productId });
    const res = await qb.getRawOne();
    return Number(res?.balance ?? 0);
  }

  async movementsForProduct(productId: string, page = 1, limit = 50) {
    const [items, total] = await this.movRepo.findAndCount({
      where: { productId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  // -------------------- Damaged / Lost / Recovery --------------------

  async markDamaged(dto: MarkDamagedDto, performedBy?: string) {
    const item = await this.itemRepo.findOne({ where: { id: dto.itemId } });
    if (!item) throw new NotFoundException('Inventory item not found');

    if (item.condition === 'LOST') throw new BadRequestException('Item already marked lost');

    item.condition = 'DAMAGED';
    item.damagedAt = new Date();
    item.damageNotes = dto.notes ?? null;
    item.damageFee = dto.fee ?? null;
    item.status = InventoryStatus.BROKEN;

    const saved = await this.itemRepo.save(item);

    if (dto.fee && dto.fee > 0) {
      try {
        const targetOrderId = item.assignedToOrderId ?? null;
        await this.billingService.createInvoiceForFee({
          builderId: (item as any).builderId ?? null,
          orderId: targetOrderId,
          description: `Damage fee for item ${item.id} (${item.serialNumber ?? ''})`,
          amount: dto.fee,
        });
      } catch (e) {
        console.warn('Failed to create damage fee invoice:', (e as any)?.message ?? e);
      }
    }
    return saved;
  }

  async markLost(dto: MarkLostDto, performedBy?: string) {
    const item = await this.itemRepo.findOne({ where: { id: dto.itemId } });
    if (!item) throw new NotFoundException('Inventory item not found');

    if (item.condition === 'LOST') throw new BadRequestException('Item already marked lost');

    item.condition = 'LOST';
    item.lostAt = new Date();
    item.lostNotes = dto.notes ?? null;
    item.lostFee = dto.fee ?? null;
    item.status = InventoryStatus.OUT_FOR_REPAIR;
    item.assignedToOrderId = null;

    const saved = await this.itemRepo.save(item);

    if (dto.fee && dto.fee > 0) {
      try {
        await this.billingService.createInvoiceForFee({
          builderId: (item as any).builderId ?? null,
          orderId: null,
          description: `Lost item fee for item ${item.id} (${item.serialNumber ?? ''})`,
          amount: dto.fee,
        });
      } catch (e) {
        console.warn('Failed to create lost fee invoice:', (e as any)?.message ?? e);
      }
    }

    return saved;
  }

  async recoverItem(dto: RecoverItemDto, performedBy?: string) {
    const item = await this.itemRepo.findOne({ where: { id: dto.itemId } });
    if (!item) throw new NotFoundException('Inventory item not found');

    item.condition = 'REPAIRED';
    item.damagedAt = null;
    item.damageNotes = null;
    item.damageFee = null;
    item.lostAt = null;
    item.lostNotes = null;
    item.lostFee = null;
    item.status = InventoryStatus.IN_STORE;

    return this.itemRepo.save(item);
  }

  async listLostDamaged(filters: { productId?: string; builderId?: string; from?: string; to?: string }) {
    const qb = this.itemRepo.createQueryBuilder('i');

    if (filters.productId) qb.andWhere('i.productId = :productId', { productId: filters.productId });
    if (filters.from) qb.andWhere('i.createdAt >= :from', { from: filters.from });
    if (filters.to) qb.andWhere('i.createdAt <= :to', { to: filters.to });

    qb.andWhere('(i.condition = :damaged OR i.condition = :lost)', { damaged: 'DAMAGED', lost: 'LOST' });
    qb.orderBy('i.createdAt', 'DESC');

    return qb.getMany();
  }
}
