// src/inventory/inventory.service.ts
import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  Repository,
} from 'typeorm';
import {
  InventoryItem,
  InventoryStatus,
  InventoryCondition,
} from '../database/entities/inventory-item.entity';
import {
  InventoryMovement,
  MovementType,
  MovementReason,
  MovementReferenceType,
} from '../database/entities/inventory-movement.entity';
import { CreateInventoryFromFormDto } from './dto/create-inventory-from-form.dto';
import { MarkDamagedDto } from './dto/mark-damaged.dto';
import { MarkLostDto } from './dto/mark-lost.dto';
import { RecoverItemDto } from './dto/recover-item.dto';

export interface ProductInventorySummary {
  productId: string;
  openingStock: number;
  stockIn: number;
  stockOut: number;
  stockBalance: number;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly itemsRepo: Repository<InventoryItem>,
    @InjectRepository(InventoryMovement)
    private readonly movementsRepo: Repository<InventoryMovement>,
    private readonly dataSource: DataSource,
  ) { }

  // ====== HELPERS ======

  private async getProductSummaryInternal(
    productId: string,
  ): Promise<ProductInventorySummary> {
    const raw = await this.movementsRepo
      .createQueryBuilder('m')
      .select('COALESCE(SUM(m.quantity), 0)', 'total')
      .addSelect(
        `
        COALESCE(
          SUM(
            CASE 
              WHEN m.movementType = :inType 
               AND (m.referenceType IS NULL OR m.referenceType != :systemRef)
              THEN m.quantity 
              ELSE 0 
            END
          ),
        0)
      `,
        'inQty',
      )
      .addSelect(
        `
        COALESCE(
          SUM(
            CASE 
              WHEN m.movementType = :outType 
              THEN ABS(m.quantity) 
              ELSE 0 
            END
          ),
        0)
      `,
        'outQty',
      )
      .addSelect(
        `
        COALESCE(
          SUM(
            CASE 
              WHEN m.referenceType = :systemRef 
              THEN m.quantity 
              ELSE 0 
            END
          ),
        0)
      `,
        'openingQty',
      )
      .where('m.productId = :productId', { productId })
      .setParameters({
        inType: MovementType.IN,
        outType: MovementType.OUT,
        systemRef: MovementReferenceType.SYSTEM,
      })
      .getRawOne<{
        total: string | null;
        inQty: string | null;
        outQty: string | null;
        openingQty: string | null;
      }>();

    const total = Number(raw?.total || 0);
    const stockIn = Number(raw?.inQty || 0);
    const stockOut = Number(raw?.outQty || 0);
    const openingStock = Number(raw?.openingQty || 0);

    return {
      productId,
      openingStock,
      stockIn,
      stockOut,
      stockBalance: total,
    };
  }

  // ====== PUBLIC API ======

  async getProductSummary(
    productId: string,
  ): Promise<ProductInventorySummary> {
    return this.getProductSummaryInternal(productId);
  }

  /**
   * Called from React "Add Inventory" form: POST /api/v1/inventories/items
   */
  async createFromForm(
    dto: CreateInventoryFromFormDto,
    userId?: string,
  ): Promise<ProductInventorySummary> {
    const {
      product_id,
      opening_stock,
      stock_in,
      stock_out = 0,
      missing = 0,
      damaged = 0,
    } = dto;

    const productId = product_id;

    const totalOutLike = stock_out + missing + damaged;
    if (totalOutLike > opening_stock) {
      throw new BadRequestException(
        'Total OUT/missing/damaged cannot exceed opening stock.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const movementRepo = manager.getRepository(InventoryMovement);
      const itemRepo = manager.getRepository(InventoryItem);

      // existing balance
      const existing = await movementRepo
        .createQueryBuilder('m')
        .select('SUM(m.quantity)', 'total')
        .where('m.productId = :productId', { productId })
        .getRawOne<{ total: string | null }>();

      const existingBalance = Number(existing?.total || 0);

      let newItemsToCreate = 0;

      // Opening stock (first time only)
      if (existingBalance === 0 && opening_stock > 0) {
        const openingMovement = movementRepo.create({
          productId,
          quantity: opening_stock,
          movementType: MovementType.IN,
          reason: MovementReason.MANUAL,
          referenceType: MovementReferenceType.SYSTEM,
          notes: 'Opening stock',
          createdBy: userId ?? null,
        });
        await movementRepo.save(openingMovement);

        newItemsToCreate += opening_stock;
      }

      // STOCK IN
      if (stock_in > 0) {
        const inMovement = movementRepo.create({
          productId,
          quantity: stock_in,
          movementType: MovementType.IN,
          reason: MovementReason.PURCHASE,
          referenceType: MovementReferenceType.ADJUSTMENT,
          notes: 'Manual stock in',
          createdBy: userId ?? null,
        });
        await movementRepo.save(inMovement);

        newItemsToCreate += stock_in;
      }

      // Create physical InventoryItem rows for any IN quantity
      if (newItemsToCreate > 0) {
        const items: InventoryItem[] = [];
        for (let i = 0; i < newItemsToCreate; i++) {
          const it = itemRepo.create({
            productId,
            status: InventoryStatus.IN_STORE,
            condition: InventoryCondition.GOOD,
            // serialNumber, siteAddress, etc can stay null for now
          });
          items.push(it);
        }
        await itemRepo.save(items);
      }

      // STOCK OUT (bulk)
      if (stock_out > 0) {
        const outMovement = movementRepo.create({
          productId,
          quantity: -stock_out,
          movementType: MovementType.OUT,
          reason: MovementReason.MANUAL,
          referenceType: MovementReferenceType.ADJUSTMENT,
          notes: 'Manual stock out',
          createdBy: userId ?? null,
        });
        await movementRepo.save(outMovement);
      }

      // MISSING (bulk adjustment)
      if (missing > 0) {
        const missingMovement = movementRepo.create({
          productId,
          quantity: -missing,
          movementType: MovementType.ADJUSTMENT,
          reason: MovementReason.LOSS,
          referenceType: MovementReferenceType.ADJUSTMENT,
          notes: 'Missing items',
          createdBy: userId ?? null,
        });
        await movementRepo.save(missingMovement);
      }

      // DAMAGED (bulk adjustment)
      if (damaged > 0) {
        const damagedMovement = movementRepo.create({
          productId,
          quantity: -damaged,
          movementType: MovementType.ADJUSTMENT,
          reason: MovementReason.DAMAGE,
          referenceType: MovementReferenceType.ADJUSTMENT,
          notes: 'Damaged items',
          createdBy: userId ?? null,
        });
        await movementRepo.save(damagedMovement);
      }

      return this.getProductSummaryInternal(productId);
    });
  }

  // Auto-deduct stock when an order is placed
  async reserveForOrder(
    productId: string,
    qty: number,
    orderId: string,
    userId?: string,
  ) {
    if (qty <= 0) return;

    await this.movementsRepo.save(
      this.movementsRepo.create({
        productId,
        quantity: -qty,
        movementType: MovementType.OUT,
        reason: MovementReason.ORDER_RESERVE,
        referenceType: MovementReferenceType.ORDER,
        referenceId: orderId,
        notes: 'Auto deduct on order placement',
        createdBy: userId ?? null,
      }),
    );
  }

  // Auto-add stock when order is completed / items returned
  async releaseFromOrder(
    productId: string,
    qty: number,
    orderId: string,
    userId?: string,
  ) {
    if (qty <= 0) return;

    await this.movementsRepo.save(
      this.movementsRepo.create({
        productId,
        quantity: qty,
        movementType: MovementType.IN,
        reason: MovementReason.ORDER_RELEASE,
        referenceType: MovementReferenceType.ORDER,
        referenceId: orderId,
        notes: 'Auto add back on order completion',
        createdBy: userId ?? null,
      }),
    );
  }

  // Assign a single physical item to an order
  async assignItemToOrder(itemId: string, orderId: string) {
    const item = await this.itemsRepo.findOne({ where: { id: itemId } });
    if (!item) throw new BadRequestException('Inventory item not found.');

    item.status = InventoryStatus.ASSIGNED;
    item.assignedToOrderId = orderId;
    await this.itemsRepo.save(item);
  }

  // Return a physical item from an order
  async returnItemFromOrder(itemId: string) {
    const item = await this.itemsRepo.findOne({ where: { id: itemId } });
    if (!item) throw new BadRequestException('Inventory item not found.');

    item.assignedToOrderId = null;
    item.status = InventoryStatus.IN_STORE;
    await this.itemsRepo.save(item);
  }

  // ========== Loss / Damage low-level methods ==========

  async markItemDamaged(
    itemId: string,
    notes?: string,
    fee?: number,
    userId?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const itemRepo = manager.getRepository(InventoryItem);
      const movementRepo = manager.getRepository(InventoryMovement);

      const item = await itemRepo.findOne({ where: { id: itemId } });
      if (!item) throw new BadRequestException('Item not found.');

      item.status = InventoryStatus.DAMAGED;
      item.condition = InventoryCondition.DAMAGED;
      item.damagedAt = new Date();
      item.damageNotes = notes;
      item.damageFee = fee != null ? String(fee) : undefined;
      await itemRepo.save(item);

      await movementRepo.save(
        movementRepo.create({
          productId: item.productId,
          inventoryItemId: item.id,
          quantity: -1,
          movementType: MovementType.ADJUSTMENT,
          reason: MovementReason.DAMAGE,
          referenceType: MovementReferenceType.ADJUSTMENT,
          notes: notes || 'Item marked damaged',
          createdBy: userId ?? null,
        }),
      );
    });
  }

  async markItemLost(
    itemId: string,
    notes?: string,
    fee?: number,
    userId?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const itemRepo = manager.getRepository(InventoryItem);
      const movementRepo = manager.getRepository(InventoryMovement);

      const item = await itemRepo.findOne({ where: { id: itemId } });
      if (!item) throw new BadRequestException('Item not found.');

      item.status = InventoryStatus.LOST;
      item.condition = InventoryCondition.LOST;
      item.lostAt = new Date();
      item.lostNotes = notes;
      item.lostFee = fee != null ? String(fee) : undefined;
      await itemRepo.save(item);

      await movementRepo.save(
        movementRepo.create({
          productId: item.productId,
          inventoryItemId: item.id,
          quantity: -1,
          movementType: MovementType.ADJUSTMENT,
          reason: MovementReason.LOSS,
          referenceType: MovementReferenceType.ADJUSTMENT,
          notes: notes || 'Item marked lost',
          createdBy: userId ?? null,
        }),
      );
    });
  }

  // ========== Methods used by loss.controller.ts ==========

  async markDamaged(dto: MarkDamagedDto, userId?: string) {
    const { itemId, notes, fee } = dto;
    return this.markItemDamaged(itemId, notes, fee, userId);
  }

  async markLost(dto: MarkLostDto, userId?: string) {
    const { itemId, notes, fee } = dto;
    return this.markItemLost(itemId, notes, fee, userId);
  }

  async recoverItem(dto: RecoverItemDto, userId?: string) {
    const { itemId, notes } = dto;

    return this.dataSource.transaction(async (manager) => {
      const itemRepo = manager.getRepository(InventoryItem);
      const movementRepo = manager.getRepository(InventoryMovement);

      const item = await itemRepo.findOne({ where: { id: itemId } });
      if (!item) throw new BadRequestException('Item not found.');

      item.status = InventoryStatus.IN_STORE;
      item.assignedToOrderId = null;
      await itemRepo.save(item);

      await movementRepo.save(
        movementRepo.create({
          productId: item.productId,
          inventoryItemId: item.id,
          quantity: 1,
          movementType: MovementType.ADJUSTMENT,
          reason: MovementReason.MANUAL,
          referenceType: MovementReferenceType.ADJUSTMENT,
          notes: notes || 'Item recovered',
          createdBy: userId ?? null,
        }),
      );
    });
  }

  async listLostDamaged(params: {
    productId?: string;
    from?: string;
    to?: string;
  }) {
    const { productId, from, to } = params;

    const qb = this.itemsRepo
      .createQueryBuilder('item')
      .where('item.status IN (:...statuses)', {
        statuses: [
          InventoryStatus.DAMAGED,
          InventoryStatus.LOST,
          InventoryStatus.BROKEN,
        ],
      });

    if (productId) {
      qb.andWhere('item.productId = :productId', { productId });
    }

    if (from) {
      qb.andWhere('item.createdAt >= :from', { from });
    }

    if (to) {
      qb.andWhere('item.createdAt <= :to', { to });
    }

    return qb.getMany();
  }

  // ========== Compatibility methods for orders.service.ts ==========

  async assignToOrder(
    params: {
      productId: string;
      orderId: string;
      serialNumbers?: string[];
      quantity: number;
    },
    userId?: string,
  ) {
    const { productId, orderId, quantity } = params;
    return this.reserveForOrder(productId, quantity, orderId, userId);
  }

  async reserveAvailableItems(
    manager: EntityManager,
    productId: string,
    qty: number,
  ): Promise<InventoryItem[]> {
    const repo = manager.getRepository(InventoryItem);

    const items = await repo.find({
      where: {
        productId,
        status: InventoryStatus.IN_STORE,
      },
      order: { createdAt: 'ASC' },
      take: qty,
    });

    if (items.length < qty) {
      throw new BadRequestException('Not enough available items.');
    }

    return items;
  }

  async assignItemsToOrderWithManager(
    manager: EntityManager,
    itemIds: string[],
    orderId: string,
  ) {
    const repo = manager.getRepository(InventoryItem);
    const items = await repo.findByIds(itemIds);

    for (const item of items) {
      item.status = InventoryStatus.ASSIGNED;
      item.assignedToOrderId = orderId;
    }

    await repo.save(items);
  }
}
