"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_item_entity_1 = require("../database/entities/inventory-item.entity");
const inventory_movement_entity_1 = require("../database/entities/inventory-movement.entity");
const inventory_batch_entity_1 = require("../database/entities/inventory-batch.entity");
const product_entity_1 = require("../database/entities/product.entity");
let InventoryService = class InventoryService {
    constructor(itemsRepo, movementsRepo, batchesRepo, productRepo, dataSource) {
        this.itemsRepo = itemsRepo;
        this.movementsRepo = movementsRepo;
        this.batchesRepo = batchesRepo;
        this.productRepo = productRepo;
        this.dataSource = dataSource;
    }
    async getProductSummaryInternal(productId, manager) {
        const movRepo = manager ? manager.getRepository(inventory_movement_entity_1.InventoryMovement) : this.movementsRepo;
        const raw = await movRepo
            .createQueryBuilder('m')
            .select('COALESCE(SUM(m.quantity), 0)', 'total')
            .where('m.product_id = :productId', { productId })
            .getRawOne();
        const total = Number(raw?.total || 0);
        return {
            productId,
            stockBalance: total,
            openingStock: 0,
            stockIn: 0,
            stockOut: 0,
        };
    }
    async getItemById(itemId) {
        const item = await this.itemsRepo.findOne({ where: { id: itemId } });
        return item || null;
    }
    async deleteItemById(itemId, userId) {
        return this.dataSource.transaction(async (manager) => {
            const itemRepo = manager.getRepository(inventory_item_entity_1.InventoryItem);
            const movRepo = manager.getRepository(inventory_movement_entity_1.InventoryMovement);
            const item = await itemRepo.findOne({ where: { id: itemId } });
            if (!item)
                return false;
            await itemRepo.remove(item);
            await movRepo.save(movRepo.create({
                product_id: item.productId,
                inventory_item_id: item.id,
                quantity: -1,
                movement_type: inventory_movement_entity_1.MovementType.ADJUSTMENT,
                reason: inventory_movement_entity_1.MovementReason.MANUAL,
                reference_type: inventory_movement_entity_1.MovementReferenceType.ADJUSTMENT,
                notes: 'Deleted inventory item (serial) via API',
                created_by: userId ?? null,
            }));
            await this.syncProductStock(item.productId, manager);
            return true;
        });
    }
    async deleteAllForProduct(productId) {
        return this.dataSource.transaction(async (manager) => {
            const batchRepo = manager.getRepository(inventory_batch_entity_1.InventoryBatch);
            const itemRepo = manager.getRepository(inventory_item_entity_1.InventoryItem);
            const movRepo = manager.getRepository(inventory_movement_entity_1.InventoryMovement);
            const prodRepo = manager.getRepository(product_entity_1.Product);
            await batchRepo.delete({ productId });
            const items = await itemRepo.find({ where: { productId } });
            const itemIds = items.map((i) => i.id);
            if (itemIds.length > 0) {
                await itemRepo.delete(itemIds);
            }
            await this.syncProductStock(productId, manager);
            return true;
        });
    }
    async syncProductStock(productId, manager) {
        const movRepo = manager ? manager.getRepository(inventory_movement_entity_1.InventoryMovement) : this.movementsRepo;
        const prodRepo = manager ? manager.getRepository(product_entity_1.Product) : this.productRepo;
        const raw = await movRepo
            .createQueryBuilder('m')
            .select('COALESCE(SUM(m.quantity), 0)', 'total')
            .where('m.product_id = :productId', { productId })
            .getRawOne();
        const newBalance = Number(raw?.total || 0);
        await prodRepo.update({ id: productId }, { stockQuantity: newBalance });
    }
    async getProductSummary(productId) {
        return this.getProductSummaryInternal(productId);
    }
    async createFromForm(dto, userId) {
        const { product_id, opening_stock, stock_in = 0, stock_out = 0, missing = 0, damaged = 0, serialNumbers = [] } = dto;
        const productId = product_id;
        if (!productId)
            throw new common_1.BadRequestException('product_id required');
        const totalOutLike = (stock_out || 0) + (missing || 0) + (damaged || 0);
        if (totalOutLike > (opening_stock || 0) + (stock_in || 0)) {
            throw new common_1.BadRequestException('Total out/missing/damaged cannot exceed incoming stock for this operation.');
        }
        return this.dataSource.transaction(async (manager) => {
            const movementRepo = manager.getRepository(inventory_movement_entity_1.InventoryMovement);
            const itemRepo = manager.getRepository(inventory_item_entity_1.InventoryItem);
            const batchRepo = manager.getRepository(inventory_batch_entity_1.InventoryBatch);
            const existing = await movementRepo
                .createQueryBuilder('m')
                .select('COALESCE(SUM(m.quantity),0)', 'total')
                .where('m.product_id = :productId', { productId })
                .getRawOne();
            const existingBalance = Number(existing?.total || 0);
            let newQuantityToCreate = 0;
            if (existingBalance === 0 && (opening_stock || 0) > 0) {
                const openingMv = movementRepo.create({
                    product_id: productId,
                    quantity: opening_stock,
                    movement_type: inventory_movement_entity_1.MovementType.IN,
                    reason: inventory_movement_entity_1.MovementReason.MANUAL,
                    reference_type: inventory_movement_entity_1.MovementReferenceType.SYSTEM,
                    notes: 'Opening stock',
                    created_by: userId ?? null,
                });
                await movementRepo.save(openingMv);
                newQuantityToCreate += opening_stock;
            }
            if ((stock_in || 0) > 0) {
                await movementRepo.save(movementRepo.create({
                    product_id: productId,
                    quantity: stock_in,
                    movement_type: inventory_movement_entity_1.MovementType.IN,
                    reason: inventory_movement_entity_1.MovementReason.PURCHASE,
                    reference_type: inventory_movement_entity_1.MovementReferenceType.ADJUSTMENT,
                    notes: 'Stock in (manual)',
                    created_by: userId ?? null,
                }));
                newQuantityToCreate += stock_in;
            }
            if (newQuantityToCreate > 0) {
                if (Array.isArray(serialNumbers) && serialNumbers.length > 0) {
                    const createdItems = [];
                    for (const s of serialNumbers) {
                        const cand = itemRepo.create({
                            productId,
                            serialNumber: s,
                            status: inventory_item_entity_1.InventoryStatus.IN_STORE,
                            condition: inventory_item_entity_1.InventoryCondition.GOOD,
                        });
                        createdItems.push(cand);
                    }
                    await itemRepo.save(createdItems);
                }
                else {
                    const batch = batchRepo.create({
                        product_id: productId,
                        quantity: newQuantityToCreate,
                        status: inventory_batch_entity_1.InventoryBatchStatus.IN_STORE,
                        referenceType: 'SYSTEM',
                    });
                    await batchRepo.save(batch);
                }
            }
            const totalOut = (stock_out || 0) + (missing || 0) + (damaged || 0);
            if (totalOut > 0) {
                await movementRepo.save(movementRepo.create({
                    product_id: productId,
                    quantity: -totalOut,
                    movement_type: inventory_movement_entity_1.MovementType.OUT,
                    reason: inventory_movement_entity_1.MovementReason.MANUAL,
                    reference_type: inventory_movement_entity_1.MovementReferenceType.ADJUSTMENT,
                    notes: 'Manual stock out/missing/damaged',
                    created_by: userId ?? null,
                }));
                await this.consumeFromBatches(manager, productId, totalOut);
            }
            await this.syncProductStock(productId, manager);
            return this.getProductSummaryInternal(productId, manager);
        });
    }
    async createBatch(dto, userId) {
        const { productId, quantity, referenceType, referenceId } = dto;
        if (!productId || !quantity || quantity <= 0)
            throw new common_1.BadRequestException('Invalid batch data');
        const batch = this.batchesRepo.create({
            product_id: productId,
            quantity,
            status: inventory_batch_entity_1.InventoryBatchStatus.IN_STORE,
            referenceType: referenceType ?? 'SYSTEM',
            referenceId: referenceId ?? null,
        });
        await this.batchesRepo.save(batch);
        await this.movementsRepo.save(this.movementsRepo.create({
            product_id: productId,
            quantity,
            movement_type: inventory_movement_entity_1.MovementType.IN,
            reason: inventory_movement_entity_1.MovementReason.PURCHASE,
            reference_type: inventory_movement_entity_1.MovementReferenceType.PURCHASE_ORDER,
            reference_id: referenceId ?? null,
            notes: 'Batch created via API',
            created_by: userId ?? null,
        }));
        await this.syncProductStock(productId);
        return batch;
    }
    async getBatch(id) {
        return this.batchesRepo.findOne({ where: { id } });
    }
    async updateBatch(id, patch) {
        const b = await this.batchesRepo.findOne({ where: { id } });
        if (!b)
            throw new common_1.NotFoundException('Batch not found');
        Object.assign(b, patch);
        await this.batchesRepo.save(b);
        await this.syncProductStock(b.product_id);
        return b;
    }
    async deleteBatch(id) {
        const b = await this.batchesRepo.findOne({ where: { id } });
        if (!b)
            throw new common_1.NotFoundException('Batch not found');
        await this.batchesRepo.remove(b);
        await this.syncProductStock(b.product_id);
        return { success: true };
    }
    async consumeFromBatches(manager, productId, qty) {
        if (qty <= 0)
            return { taken: 0, details: [] };
        const batchRepo = manager.getRepository(inventory_batch_entity_1.InventoryBatch);
        const candidates = await batchRepo
            .createQueryBuilder('b')
            .where('b.product_id = :productId', { productId })
            .andWhere('b.status = :inStore', { inStore: inventory_batch_entity_1.InventoryBatchStatus.IN_STORE })
            .orderBy('b.created_at', 'ASC')
            .setLock('pessimistic_write')
            .getMany();
        let remaining = qty;
        const details = [];
        for (const b of candidates) {
            if (remaining <= 0)
                break;
            const take = Math.min(b.quantity, remaining);
            const before = b.quantity;
            b.quantity = b.quantity - take;
            if (b.quantity <= 0) {
                b.status = inventory_batch_entity_1.InventoryBatchStatus.CONSUMED;
            }
            await batchRepo.save(b);
            details.push({ batchId: b.id, before, taken: take });
            remaining -= take;
        }
        const taken = qty - remaining;
        return { taken, details };
    }
    async reserveAvailableItems(managerOrProductId, productIdOrQty, qtyMaybe) {
        let manager;
        let productId;
        let qty;
        if (managerOrProductId?.getRepository && typeof managerOrProductId.getRepository === 'function') {
            manager = managerOrProductId;
            productId = productIdOrQty;
            qty = Number(qtyMaybe || 0);
        }
        else {
            manager = this.dataSource.manager;
            productId = managerOrProductId;
            qty = Number(productIdOrQty) || 0;
        }
        if (!productId || qty <= 0)
            return [];
        const result = [];
        let remaining = qty;
        const consumed = await this.consumeFromBatches(manager, productId, remaining);
        for (const d of consumed.details) {
            result.push({ type: 'batch', id: d.batchId, qty: d.taken });
        }
        remaining -= consumed.taken;
        if (remaining <= 0)
            return result;
        const itemRepo = manager.getRepository(inventory_item_entity_1.InventoryItem);
        const items = await itemRepo.find({
            where: { productId, status: inventory_item_entity_1.InventoryStatus.IN_STORE },
            order: { createdAt: 'ASC' },
            take: remaining,
        });
        if (items.length < remaining) {
            for (const it of items)
                result.push({ type: 'item', id: it.id, qty: 1 });
            return result;
        }
        for (const it of items) {
            it.status = inventory_item_entity_1.InventoryStatus.ASSIGNED;
        }
        await itemRepo.save(items);
        for (const it of items)
            result.push({ type: 'item', id: it.id, qty: 1 });
        return result;
    }
    async applyBatchReservationsToOrder(manager, batchReservations, productId, orderId) {
        if (!batchReservations || batchReservations.length === 0)
            return;
        const movRepo = manager.getRepository(inventory_movement_entity_1.InventoryMovement);
        for (const br of batchReservations) {
            await movRepo.save(movRepo.create({
                product_id: productId,
                inventory_item_id: null,
                quantity: -br.qty,
                movement_type: inventory_movement_entity_1.MovementType.OUT,
                reason: inventory_movement_entity_1.MovementReason.ORDER_RESERVE,
                reference_type: inventory_movement_entity_1.MovementReferenceType.ORDER,
                reference_id: orderId,
                notes: `Reserved ${br.qty} from batch ${br.batchId}`,
            }));
        }
        await this.syncProductStock(productId, manager);
    }
    async assignItemsToOrderWithManager(managerOrItemIds, itemIdsOrOrderId, orderIdMaybe) {
        let manager;
        let itemIds;
        let orderId;
        if (managerOrItemIds?.getRepository && typeof managerOrItemIds.getRepository === 'function') {
            manager = managerOrItemIds;
            itemIds = itemIdsOrOrderId;
            orderId = orderIdMaybe;
        }
        else {
            itemIds = managerOrItemIds;
            orderId = itemIdsOrOrderId;
            manager = this.dataSource.manager;
        }
        if (!Array.isArray(itemIds) || itemIds.length === 0)
            return;
        const repo = manager.getRepository(inventory_item_entity_1.InventoryItem);
        const items = await repo.find({ where: { id: (0, typeorm_2.In)(itemIds) } });
        for (const item of items) {
            item.status = inventory_item_entity_1.InventoryStatus.ASSIGNED;
            item.assignedToOrderId = orderId;
        }
        await repo.save(items);
        const productIds = Array.from(new Set(items.map((i) => i.productId)));
        for (const pid of productIds)
            await this.syncProductStock(pid, manager);
    }
    async assignItemsToOrder(itemIds, orderId) {
        if (!Array.isArray(itemIds) || itemIds.length === 0)
            return;
        await this.assignItemsToOrderWithManager(itemIds, orderId);
    }
    async markItemDamaged(itemId, notes, fee, userId) {
        return this.dataSource.transaction(async (manager) => {
            const itemRepo = manager.getRepository(inventory_item_entity_1.InventoryItem);
            const movementRepo = manager.getRepository(inventory_movement_entity_1.InventoryMovement);
            const item = await itemRepo.findOne({ where: { id: itemId } });
            if (!item)
                throw new common_1.BadRequestException('Item not found.');
            item.status = inventory_item_entity_1.InventoryStatus.DAMAGED;
            item.condition = inventory_item_entity_1.InventoryCondition.DAMAGED;
            item.damagedAt = new Date();
            item.damageNotes = notes;
            item.damageFee = fee != null ? String(fee) : undefined;
            await itemRepo.save(item);
            await movementRepo.save(movementRepo.create({
                product_id: item.productId,
                inventory_item_id: item.id,
                quantity: -1,
                movement_type: inventory_movement_entity_1.MovementType.ADJUSTMENT,
                reason: inventory_movement_entity_1.MovementReason.DAMAGE,
                reference_type: inventory_movement_entity_1.MovementReferenceType.ADJUSTMENT,
                notes: notes || 'Item marked damaged',
                created_by: userId ?? null,
            }));
            await this.syncProductStock(item.productId, manager);
        });
    }
    async markItemLost(itemId, notes, fee, userId) {
        return this.dataSource.transaction(async (manager) => {
            const itemRepo = manager.getRepository(inventory_item_entity_1.InventoryItem);
            const movementRepo = manager.getRepository(inventory_movement_entity_1.InventoryMovement);
            const item = await itemRepo.findOne({ where: { id: itemId } });
            if (!item)
                throw new common_1.BadRequestException('Item not found.');
            item.status = inventory_item_entity_1.InventoryStatus.LOST;
            item.condition = inventory_item_entity_1.InventoryCondition.LOST;
            item.lostAt = new Date();
            item.lostNotes = notes;
            item.lostFee = fee != null ? String(fee) : undefined;
            await itemRepo.save(item);
            await movementRepo.save(movementRepo.create({
                product_id: item.productId,
                inventory_item_id: item.id,
                quantity: -1,
                movement_type: inventory_movement_entity_1.MovementType.ADJUSTMENT,
                reason: inventory_movement_entity_1.MovementReason.LOSS,
                reference_type: inventory_movement_entity_1.MovementReferenceType.ADJUSTMENT,
                notes: notes || 'Item marked lost',
                created_by: userId ?? null,
            }));
            await this.syncProductStock(item.productId, manager);
        });
    }
    async recoverItem(itemId, notes, userId) {
        return this.dataSource.transaction(async (manager) => {
            const itemRepo = manager.getRepository(inventory_item_entity_1.InventoryItem);
            const movementRepo = manager.getRepository(inventory_movement_entity_1.InventoryMovement);
            const item = await itemRepo.findOne({ where: { id: itemId } });
            if (!item)
                throw new common_1.BadRequestException('Item not found.');
            item.status = inventory_item_entity_1.InventoryStatus.IN_STORE;
            item.assignedToOrderId = null;
            await itemRepo.save(item);
            await movementRepo.save(movementRepo.create({
                product_id: item.productId,
                inventory_item_id: item.id,
                quantity: 1,
                movement_type: inventory_movement_entity_1.MovementType.ADJUSTMENT,
                reason: inventory_movement_entity_1.MovementReason.MANUAL,
                reference_type: inventory_movement_entity_1.MovementReferenceType.ADJUSTMENT,
                notes: notes || 'Item recovered',
                created_by: userId ?? null,
            }));
            await this.syncProductStock(item.productId, manager);
        });
    }
    async listLostDamaged(params) {
        const { productId, from, to } = params;
        const qb = this.itemsRepo
            .createQueryBuilder('item')
            .where('item.status IN (:...statuses)', {
            statuses: [inventory_item_entity_1.InventoryStatus.DAMAGED, inventory_item_entity_1.InventoryStatus.LOST, inventory_item_entity_1.InventoryStatus.BROKEN],
        });
        if (productId)
            qb.andWhere('item.productId = :productId', { productId });
        if (from)
            qb.andWhere('item.createdAt >= :from', { from });
        if (to)
            qb.andWhere('item.createdAt <= :to', { to });
        return qb.getMany();
    }
    async listBatches(productId) {
        const qb = this.batchesRepo.createQueryBuilder('b').orderBy('b.created_at', 'DESC');
        if (productId)
            qb.where('b.product_id = :productId', { productId });
        return qb.getMany();
    }
    async listItems(productId) {
        const qb = this.itemsRepo.createQueryBuilder('i').orderBy('i.created_at', 'DESC');
        if (productId)
            qb.where('i.product_id = :productId', { productId });
        return qb.getMany();
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_item_entity_1.InventoryItem)),
    __param(1, (0, typeorm_1.InjectRepository)(inventory_movement_entity_1.InventoryMovement)),
    __param(2, (0, typeorm_1.InjectRepository)(inventory_batch_entity_1.InventoryBatch)),
    __param(3, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map