// src/inventory/inventory.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, In } from 'typeorm';
import { InventoryItem, InventoryStatus, InventoryCondition } from '../database/entities/inventory-item.entity';
import { InventoryMovement, MovementType, MovementReason, MovementReferenceType } from '../database/entities/inventory-movement.entity';
import { InventoryBatch, InventoryBatchStatus } from '../database/entities/inventory-batch.entity';
import { Product } from '../database/entities/product.entity';
import { CreateInventoryFromFormDto } from './dto/create-inventory-from-form.dto';
import { CreateBatchDto } from './dto/create-batch.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem) private readonly itemsRepo: Repository<InventoryItem>,
    @InjectRepository(InventoryMovement) private readonly movementsRepo: Repository<InventoryMovement>,
    @InjectRepository(InventoryBatch) private readonly batchesRepo: Repository<InventoryBatch>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) { }

  // ------------------ helpers ------------------

  private async getProductSummaryInternal(productId: string, manager?: EntityManager) {
    const movRepo = manager ? manager.getRepository(InventoryMovement) : this.movementsRepo;

    const raw = await movRepo
      .createQueryBuilder('m')
      .select('COALESCE(SUM(m.quantity), 0)', 'total')
      .where('m.product_id = :productId', { productId })
      .getRawOne<{ total: string | null }>();

    const total = Number(raw?.total || 0);

    // Additionally compute opening/in/out using more advanced logic if you want,
    // but the movement ledger is authoritative.
    return {
      productId,
      stockBalance: total,
      openingStock: 0,
      stockIn: 0,
      stockOut: 0,
    };
  }

  // paste inside InventoryService class in src/inventory/inventory.service.ts

  /**
   * Get single inventory item (serial-tracked).
   */
  async getItemById(itemId: string) {
    const item = await this.itemsRepo.findOne({ where: { id: itemId } });
    return item || null;
  }

  /**
   * Delete a single serial-tracked inventory item.
   * This will:
   *  - remove the inventory_items row
   *  - create a negative movement (-1) to keep ledger consistent (optional - remove if you want different semantics)
   *  - sync product stockQuantity
   */
  async deleteItemById(itemId: string, userId?: string) {
    return this.dataSource.transaction(async (manager) => {
      const itemRepo = manager.getRepository(InventoryItem);
      const movRepo = manager.getRepository(InventoryMovement);

      const item = await itemRepo.findOne({ where: { id: itemId } });
      if (!item) return false;

      // remove the item row
      await itemRepo.remove(item);

      // append an adjustment movement of -1 to ledger so stockBalance reflects the deletion
      await movRepo.save(
        movRepo.create({
          product_id: item.productId,
          inventory_item_id: item.id,
          quantity: -1,
          movement_type: MovementType.ADJUSTMENT,
          reason: MovementReason.MANUAL,
          reference_type: MovementReferenceType.ADJUSTMENT,
          notes: 'Deleted inventory item (serial) via API',
          created_by: userId ?? null,
        } as any),
      );

      // sync product stockQuantity
      await this.syncProductStock(item.productId, manager);
      return true;
    });
  }

  /**
   * Delete all inventory for a product:
   *  - deletes batches
   *  - deletes serial items
   *  - optionally append a movement to zero the product balance (we recompute from movements so we won't auto-add movement)
   *
   * NOTE: this is destructive. Keep a backup before running in production.
   */
  async deleteAllForProduct(productId: string) {
    return this.dataSource.transaction(async (manager) => {
      const batchRepo = manager.getRepository(InventoryBatch);
      const itemRepo = manager.getRepository(InventoryItem);
      const movRepo = manager.getRepository(InventoryMovement);
      const prodRepo = manager.getRepository(Product);

      // delete batches
      await batchRepo.delete({ productId } as any);

      // find serial items to delete (capture their ids)
      const items = await itemRepo.find({ where: { productId } });
      const itemIds = items.map((i) => i.id);

      if (itemIds.length > 0) {
        await itemRepo.delete(itemIds as any);
      }

      // Option A: leave movement ledger intact (recommended) — product stock is recomputed from movements.
      // Option B: if you want to zero the ledger, add a movement that makes stock zero.
      // I'll recompute and update products.stockQuantity to current ledger total.

      await this.syncProductStock(productId, manager);

      return true;
    });
  }


  // keep products.stockQuantity in sync with movement ledger
  private async syncProductStock(productId: string, manager?: EntityManager) {
    const movRepo = manager ? manager.getRepository(InventoryMovement) : this.movementsRepo;
    const prodRepo = manager ? manager.getRepository(Product) : this.productRepo;

    const raw = await movRepo
      .createQueryBuilder('m')
      .select('COALESCE(SUM(m.quantity), 0)', 'total')
      .where('m.product_id = :productId', { productId })
      .getRawOne<{ total: string | null }>();

    const newBalance = Number(raw?.total || 0);
    await prodRepo.update({ id: productId } as any, { stockQuantity: newBalance } as any);
  }

  // ------------------ public API ------------------

  // Summary used by frontend
  async getProductSummary(productId: string) {
    return this.getProductSummaryInternal(productId);
  }

  // Create inventory (form) - now uses batches for bulk, per-serial for serial numbers
  async createFromForm(dto: CreateInventoryFromFormDto, userId?: string) {
    const { product_id, opening_stock, stock_in = 0, stock_out = 0, missing = 0, damaged = 0, serialNumbers = [] } = dto;
    const productId = product_id;

    if (!productId) throw new BadRequestException('product_id required');

    const totalOutLike = (stock_out || 0) + (missing || 0) + (damaged || 0);
    if (totalOutLike > (opening_stock || 0) + (stock_in || 0)) {
      throw new BadRequestException('Total out/missing/damaged cannot exceed incoming stock for this operation.');
    }

    return this.dataSource.transaction(async (manager) => {
      const movementRepo = manager.getRepository(InventoryMovement);
      const itemRepo = manager.getRepository(InventoryItem);
      const batchRepo = manager.getRepository(InventoryBatch);

      // compute existing logical balance
      const existing = await movementRepo
        .createQueryBuilder('m')
        .select('COALESCE(SUM(m.quantity),0)', 'total')
        .where('m.product_id = :productId', { productId })
        .getRawOne<{ total: string }>();

      const existingBalance = Number(existing?.total || 0);

      let newQuantityToCreate = 0;
      if (existingBalance === 0 && (opening_stock || 0) > 0) {
        // opening stock movement
        const openingMv = movementRepo.create({
          product_id: productId,
          quantity: opening_stock,
          movement_type: MovementType.IN,
          reason: MovementReason.MANUAL,
          reference_type: MovementReferenceType.SYSTEM,
          notes: 'Opening stock',
          created_by: userId ?? null,
        } as any);
        await movementRepo.save(openingMv);
        newQuantityToCreate += opening_stock;
      }

      // stock_in
      if ((stock_in || 0) > 0) {
        await movementRepo.save(
          movementRepo.create({
            product_id: productId,
            quantity: stock_in,
            movement_type: MovementType.IN,
            reason: MovementReason.PURCHASE,
            reference_type: MovementReferenceType.ADJUSTMENT,
            notes: 'Stock in (manual)',
            created_by: userId ?? null,
          } as any),
        );
        newQuantityToCreate += stock_in;
      }

      // If serial numbers are provided -> create inventory_items for each serial.
      // Otherwise create a single batch row for newQuantityToCreate.
      if (newQuantityToCreate > 0) {
        if (Array.isArray(serialNumbers) && serialNumbers.length > 0) {
          const createdItems: InventoryItem[] = [];
          for (const s of serialNumbers) {
            const cand = itemRepo.create({
              productId,
              serialNumber: s,
              status: InventoryStatus.IN_STORE,
              condition: InventoryCondition.GOOD,
            } as any);
            createdItems.push(cand as unknown as InventoryItem);
          }
          await itemRepo.save(createdItems);
        } else {
          const batch = batchRepo.create({
            product_id: productId,
            quantity: newQuantityToCreate,
            status: InventoryBatchStatus.IN_STORE,
            referenceType: 'SYSTEM',
          } as any);
          await batchRepo.save(batch);
        }
      }

      // handle stock_out/missing/damaged as negative movement
      const totalOut = (stock_out || 0) + (missing || 0) + (damaged || 0);
      if (totalOut > 0) {
        await movementRepo.save(
          movementRepo.create({
            product_id: productId,
            quantity: -totalOut,
            movement_type: MovementType.OUT,
            reason: MovementReason.MANUAL,
            reference_type: MovementReferenceType.ADJUSTMENT,
            notes: 'Manual stock out/missing/damaged',
            created_by: userId ?? null,
          } as any),
        );

        // reduce batches/items accordingly
        await this.consumeFromBatches(manager, productId, totalOut);
      }

      await this.syncProductStock(productId, manager);
      return this.getProductSummaryInternal(productId, manager);
    });
  }

  // Create a single batch (CRUD)
  async createBatch(dto: CreateBatchDto, userId?: string) {
    const { productId, quantity, referenceType, referenceId } = dto;
    if (!productId || !quantity || quantity <= 0) throw new BadRequestException('Invalid batch data');

    const batch = this.batchesRepo.create({
      product_id: productId,
      quantity,
      status: InventoryBatchStatus.IN_STORE,
      referenceType: referenceType ?? 'SYSTEM',
      referenceId: referenceId ?? null,
    } as any);
    await this.batchesRepo.save(batch);

    // add movement ledger
    await this.movementsRepo.save(
      this.movementsRepo.create({
        product_id: productId,
        quantity,
        movement_type: MovementType.IN,
        reason: MovementReason.PURCHASE,
        reference_type: MovementReferenceType.PURCHASE_ORDER,
        reference_id: referenceId ?? null,
        notes: 'Batch created via API',
        created_by: userId ?? null,
      } as any),
    );

    await this.syncProductStock(productId);
    return batch;
  }

  async getBatch(id: string) {
    return this.batchesRepo.findOne({ where: { id } });
  }

  async updateBatch(id: string, patch: Partial<InventoryBatch>) {
    const b = await this.batchesRepo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Batch not found');
    Object.assign(b, patch);
    await this.batchesRepo.save(b);
    await this.syncProductStock(b.product_id);
    return b;
  }

  async deleteBatch(id: string) {
    const b = await this.batchesRepo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Batch not found');
    await this.batchesRepo.remove(b);
    await this.syncProductStock(b.product_id);
    return { success: true };
  }

  // ---------------- batch consumption / reservation ----------------

  // consume batches (oldest first) within provided manager tx
  private async consumeFromBatches(manager: EntityManager, productId: string, qty: number) {
    if (qty <= 0) return { taken: 0, details: [] as { batchId: string; before: number; taken: number }[] };

    const batchRepo = manager.getRepository(InventoryBatch);

    // lock candidate rows
    const candidates = await batchRepo
      .createQueryBuilder('b')
      .where('b.product_id = :productId', { productId })
      .andWhere('b.status = :inStore', { inStore: InventoryBatchStatus.IN_STORE })
      .orderBy('b.created_at', 'ASC')
      .setLock('pessimistic_write')
      .getMany();

    let remaining = qty;
    const details: { batchId: string; before: number; taken: number }[] = [];

    for (const b of candidates) {
      if (remaining <= 0) break;
      const take = Math.min(b.quantity, remaining);
      const before = b.quantity;
      b.quantity = b.quantity - take;
      if (b.quantity <= 0) {
        b.status = InventoryBatchStatus.CONSUMED;
      }
      await batchRepo.save(b);
      details.push({ batchId: b.id, before, taken: take });
      remaining -= take;
    }

    const taken = qty - remaining;
    return { taken, details };
  }

  /**
   * reserveAvailableItems - consumes batches first, then per-serial items
   * Returns tokens: { type: 'batch'|'item', id, qty }
   *
   * managerOrProductId can be an EntityManager (manager, productId, qty) or (productId, qty)
   */
  async reserveAvailableItems(
    managerOrProductId: EntityManager | string,
    productIdOrQty?: string | number,
    qtyMaybe?: number,
  ): Promise<{ type: 'batch' | 'item'; id: string; qty: number }[]> {
    let manager: EntityManager;
    let productId: string;
    let qty: number;

    if ((managerOrProductId as any)?.getRepository && typeof (managerOrProductId as any).getRepository === 'function') {
      manager = managerOrProductId as EntityManager;
      productId = productIdOrQty as string;
      qty = Number(qtyMaybe || 0);
    } else {
      manager = this.dataSource.manager;
      productId = managerOrProductId as string;
      qty = Number(productIdOrQty as number) || 0;
    }

    if (!productId || qty <= 0) return [];

    const result: { type: 'batch' | 'item'; id: string; qty: number }[] = [];
    let remaining = qty;

    // consume batches first
    const consumed = await this.consumeFromBatches(manager, productId, remaining);
    for (const d of consumed.details) {
      result.push({ type: 'batch', id: d.batchId, qty: d.taken });
    }
    remaining -= consumed.taken;

    if (remaining <= 0) return result;

    // consume inventory_items
    const itemRepo = manager.getRepository(InventoryItem);
    const items = await itemRepo.find({
      where: { productId, status: InventoryStatus.IN_STORE },
      order: { createdAt: 'ASC' },
      take: remaining,
    });

    if (items.length < remaining) {
      // partial reservations returned — caller should decide fallback
      for (const it of items) result.push({ type: 'item', id: it.id, qty: 1 });
      return result;
    }

    // mark items ASSIGNED (we will set assignedToOrderId later from caller)
    for (const it of items) {
      it.status = InventoryStatus.ASSIGNED;
    }
    await itemRepo.save(items);

    for (const it of items) result.push({ type: 'item', id: it.id, qty: 1 });

    return result;
  }

  // apply batch reservations into movement ledger (manager-aware)
  async applyBatchReservationsToOrder(manager: EntityManager, batchReservations: { batchId: string; qty: number }[], productId: string, orderId: string) {
    if (!batchReservations || batchReservations.length === 0) return;
    const movRepo = manager.getRepository(InventoryMovement);

    for (const br of batchReservations) {
      await movRepo.save(
        movRepo.create({
          product_id: productId,
          inventory_item_id: null,
          quantity: -br.qty,
          movement_type: MovementType.OUT,
          reason: MovementReason.ORDER_RESERVE,
          reference_type: MovementReferenceType.ORDER,
          reference_id: orderId,
          notes: `Reserved ${br.qty} from batch ${br.batchId}`,
        } as any),
      );
    }

    await this.syncProductStock(productId, manager);
  }

  // assign items to order (manager-aware)
  async assignItemsToOrderWithManager(managerOrItemIds: EntityManager | string[], itemIdsOrOrderId: string[] | string, orderIdMaybe?: string) {
    let manager: EntityManager;
    let itemIds: string[];
    let orderId: string;

    if ((managerOrItemIds as any)?.getRepository && typeof (managerOrItemIds as any).getRepository === 'function') {
      manager = managerOrItemIds as EntityManager;
      itemIds = itemIdsOrOrderId as string[];
      orderId = orderIdMaybe as string;
    } else {
      itemIds = managerOrItemIds as string[];
      orderId = itemIdsOrOrderId as string;
      manager = this.dataSource.manager;
    }

    if (!Array.isArray(itemIds) || itemIds.length === 0) return;

    const repo = manager.getRepository(InventoryItem);
    const items = await repo.find({ where: { id: In(itemIds) } });

    for (const item of items) {
      item.status = InventoryStatus.ASSIGNED;
      item.assignedToOrderId = orderId;
    }

    await repo.save(items);

    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    for (const pid of productIds) await this.syncProductStock(pid, manager);
  }

  async assignItemsToOrder(itemIds: string[], orderId: string) {
    if (!Array.isArray(itemIds) || itemIds.length === 0) return;
    await this.assignItemsToOrderWithManager(itemIds, orderId);
  }

  // ---------------- loss/damage/recover ----------------

  async markItemDamaged(itemId: string, notes?: string, fee?: number, userId?: string) {
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
          product_id: item.productId,
          inventory_item_id: item.id,
          quantity: -1,
          movement_type: MovementType.ADJUSTMENT,
          reason: MovementReason.DAMAGE,
          reference_type: MovementReferenceType.ADJUSTMENT,
          notes: notes || 'Item marked damaged',
          created_by: userId ?? null,
        } as any),
      );

      await this.syncProductStock(item.productId, manager);
    });
  }

  async markItemLost(itemId: string, notes?: string, fee?: number, userId?: string) {
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
          product_id: item.productId,
          inventory_item_id: item.id,
          quantity: -1,
          movement_type: MovementType.ADJUSTMENT,
          reason: MovementReason.LOSS,
          reference_type: MovementReferenceType.ADJUSTMENT,
          notes: notes || 'Item marked lost',
          created_by: userId ?? null,
        } as any),
      );

      await this.syncProductStock(item.productId, manager);
    });
  }

  async recoverItem(itemId: string, notes?: string, userId?: string) {
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
          product_id: item.productId,
          inventory_item_id: item.id,
          quantity: 1,
          movement_type: MovementType.ADJUSTMENT,
          reason: MovementReason.MANUAL,
          reference_type: MovementReferenceType.ADJUSTMENT,
          notes: notes || 'Item recovered',
          created_by: userId ?? null,
        } as any),
      );

      await this.syncProductStock(item.productId, manager);
    });
  }

  // list lost/damaged/broken items
  async listLostDamaged(params: { productId?: string; from?: string; to?: string }) {
    const { productId, from, to } = params;
    const qb = this.itemsRepo
      .createQueryBuilder('item')
      .where('item.status IN (:...statuses)', {
        statuses: [InventoryStatus.DAMAGED, InventoryStatus.LOST, InventoryStatus.BROKEN],
      });

    if (productId) qb.andWhere('item.productId = :productId', { productId });
    if (from) qb.andWhere('item.createdAt >= :from', { from });
    if (to) qb.andWhere('item.createdAt <= :to', { to });

    return qb.getMany();
  }

  // simple listing helpers for batches/items
  async listBatches(productId?: string) {
    const qb = this.batchesRepo.createQueryBuilder('b').orderBy('b.created_at', 'DESC');
    if (productId) qb.where('b.product_id = :productId', { productId });
    return qb.getMany();
  }

  async listItems(productId?: string) {
    const qb = this.itemsRepo.createQueryBuilder('i').orderBy('i.created_at', 'DESC');
    if (productId) qb.where('i.product_id = :productId', { productId });
    return qb.getMany();
  }
}
