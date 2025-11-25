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
let InventoryService = class InventoryService {
    constructor(itemsRepo, movementsRepo, dataSource) {
        this.itemsRepo = itemsRepo;
        this.movementsRepo = movementsRepo;
        this.dataSource = dataSource;
    }
    async getProductSummaryInternal(productId) {
        const raw = await this.movementsRepo
            .createQueryBuilder('m')
            .select('COALESCE(SUM(m.quantity), 0)', 'total')
            .addSelect(`
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
      `, 'inQty')
            .addSelect(`
        COALESCE(
          SUM(
            CASE 
              WHEN m.movementType = :outType 
              THEN ABS(m.quantity) 
              ELSE 0 
            END
          ),
        0)
      `, 'outQty')
            .addSelect(`
        COALESCE(
          SUM(
            CASE 
              WHEN m.referenceType = :systemRef 
              THEN m.quantity 
              ELSE 0 
            END
          ),
        0)
      `, 'openingQty')
            .where('m.productId = :productId', { productId })
            .setParameters({
            inType: inventory_movement_entity_1.MovementType.IN,
            outType: inventory_movement_entity_1.MovementType.OUT,
            systemRef: inventory_movement_entity_1.MovementReferenceType.SYSTEM,
        })
            .getRawOne();
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
    async getProductSummary(productId) {
        return this.getProductSummaryInternal(productId);
    }
    async createFromForm(dto, userId) {
        const { product_id, opening_stock, stock_in, stock_out = 0, missing = 0, damaged = 0, } = dto;
        const productId = product_id;
        const totalOutLike = stock_out + missing + damaged;
        if (totalOutLike > opening_stock) {
            throw new common_1.BadRequestException('Total OUT/missing/damaged cannot exceed opening stock.');
        }
        return this.dataSource.transaction(async (manager) => {
            const movementRepo = manager.getRepository(inventory_movement_entity_1.InventoryMovement);
            const itemRepo = manager.getRepository(inventory_item_entity_1.InventoryItem);
            const existing = await movementRepo
                .createQueryBuilder('m')
                .select('SUM(m.quantity)', 'total')
                .where('m.productId = :productId', { productId })
                .getRawOne();
            const existingBalance = Number(existing?.total || 0);
            let newItemsToCreate = 0;
            if (existingBalance === 0 && opening_stock > 0) {
                const openingMovement = movementRepo.create({
                    productId,
                    quantity: opening_stock,
                    movementType: inventory_movement_entity_1.MovementType.IN,
                    reason: inventory_movement_entity_1.MovementReason.MANUAL,
                    referenceType: inventory_movement_entity_1.MovementReferenceType.SYSTEM,
                    notes: 'Opening stock',
                    createdBy: userId ?? null,
                });
                await movementRepo.save(openingMovement);
                newItemsToCreate += opening_stock;
            }
            if (stock_in > 0) {
                const inMovement = movementRepo.create({
                    productId,
                    quantity: stock_in,
                    movementType: inventory_movement_entity_1.MovementType.IN,
                    reason: inventory_movement_entity_1.MovementReason.PURCHASE,
                    referenceType: inventory_movement_entity_1.MovementReferenceType.ADJUSTMENT,
                    notes: 'Manual stock in',
                    createdBy: userId ?? null,
                });
                await movementRepo.save(inMovement);
                newItemsToCreate += stock_in;
            }
            if (newItemsToCreate > 0) {
                const items = [];
                for (let i = 0; i < newItemsToCreate; i++) {
                    const it = itemRepo.create({
                        productId,
                        status: inventory_item_entity_1.InventoryStatus.IN_STORE,
                        condition: inventory_item_entity_1.InventoryCondition.GOOD,
                    });
                    items.push(it);
                }
                await itemRepo.save(items);
            }
            if (stock_out > 0) {
                const outMovement = movementRepo.create({
                    productId,
                    quantity: -stock_out,
                    movementType: inventory_movement_entity_1.MovementType.OUT,
                    reason: inventory_movement_entity_1.MovementReason.MANUAL,
                    referenceType: inventory_movement_entity_1.MovementReferenceType.ADJUSTMENT,
                    notes: 'Manual stock out',
                    createdBy: userId ?? null,
                });
                await movementRepo.save(outMovement);
            }
            if (missing > 0) {
                const missingMovement = movementRepo.create({
                    productId,
                    quantity: -missing,
                    movementType: inventory_movement_entity_1.MovementType.ADJUSTMENT,
                    reason: inventory_movement_entity_1.MovementReason.LOSS,
                    referenceType: inventory_movement_entity_1.MovementReferenceType.ADJUSTMENT,
                    notes: 'Missing items',
                    createdBy: userId ?? null,
                });
                await movementRepo.save(missingMovement);
            }
            if (damaged > 0) {
                const damagedMovement = movementRepo.create({
                    productId,
                    quantity: -damaged,
                    movementType: inventory_movement_entity_1.MovementType.ADJUSTMENT,
                    reason: inventory_movement_entity_1.MovementReason.DAMAGE,
                    referenceType: inventory_movement_entity_1.MovementReferenceType.ADJUSTMENT,
                    notes: 'Damaged items',
                    createdBy: userId ?? null,
                });
                await movementRepo.save(damagedMovement);
            }
            return this.getProductSummaryInternal(productId);
        });
    }
    async reserveForOrder(productId, qty, orderId, userId) {
        if (qty <= 0)
            return;
        await this.movementsRepo.save(this.movementsRepo.create({
            productId,
            quantity: -qty,
            movementType: inventory_movement_entity_1.MovementType.OUT,
            reason: inventory_movement_entity_1.MovementReason.ORDER_RESERVE,
            referenceType: inventory_movement_entity_1.MovementReferenceType.ORDER,
            referenceId: orderId,
            notes: 'Auto deduct on order placement',
            createdBy: userId ?? null,
        }));
    }
    async releaseFromOrder(productId, qty, orderId, userId) {
        if (qty <= 0)
            return;
        await this.movementsRepo.save(this.movementsRepo.create({
            productId,
            quantity: qty,
            movementType: inventory_movement_entity_1.MovementType.IN,
            reason: inventory_movement_entity_1.MovementReason.ORDER_RELEASE,
            referenceType: inventory_movement_entity_1.MovementReferenceType.ORDER,
            referenceId: orderId,
            notes: 'Auto add back on order completion',
            createdBy: userId ?? null,
        }));
    }
    async assignItemToOrder(itemId, orderId) {
        const item = await this.itemsRepo.findOne({ where: { id: itemId } });
        if (!item)
            throw new common_1.BadRequestException('Inventory item not found.');
        item.status = inventory_item_entity_1.InventoryStatus.ASSIGNED;
        item.assignedToOrderId = orderId;
        await this.itemsRepo.save(item);
    }
    async returnItemFromOrder(itemId) {
        const item = await this.itemsRepo.findOne({ where: { id: itemId } });
        if (!item)
            throw new common_1.BadRequestException('Inventory item not found.');
        item.assignedToOrderId = null;
        item.status = inventory_item_entity_1.InventoryStatus.IN_STORE;
        await this.itemsRepo.save(item);
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
                productId: item.productId,
                inventoryItemId: item.id,
                quantity: -1,
                movementType: inventory_movement_entity_1.MovementType.ADJUSTMENT,
                reason: inventory_movement_entity_1.MovementReason.DAMAGE,
                referenceType: inventory_movement_entity_1.MovementReferenceType.ADJUSTMENT,
                notes: notes || 'Item marked damaged',
                createdBy: userId ?? null,
            }));
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
                productId: item.productId,
                inventoryItemId: item.id,
                quantity: -1,
                movementType: inventory_movement_entity_1.MovementType.ADJUSTMENT,
                reason: inventory_movement_entity_1.MovementReason.LOSS,
                referenceType: inventory_movement_entity_1.MovementReferenceType.ADJUSTMENT,
                notes: notes || 'Item marked lost',
                createdBy: userId ?? null,
            }));
        });
    }
    async markDamaged(dto, userId) {
        const { itemId, notes, fee } = dto;
        return this.markItemDamaged(itemId, notes, fee, userId);
    }
    async markLost(dto, userId) {
        const { itemId, notes, fee } = dto;
        return this.markItemLost(itemId, notes, fee, userId);
    }
    async recoverItem(dto, userId) {
        const { itemId, notes } = dto;
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
                productId: item.productId,
                inventoryItemId: item.id,
                quantity: 1,
                movementType: inventory_movement_entity_1.MovementType.ADJUSTMENT,
                reason: inventory_movement_entity_1.MovementReason.MANUAL,
                referenceType: inventory_movement_entity_1.MovementReferenceType.ADJUSTMENT,
                notes: notes || 'Item recovered',
                createdBy: userId ?? null,
            }));
        });
    }
    async listLostDamaged(params) {
        const { productId, from, to } = params;
        const qb = this.itemsRepo
            .createQueryBuilder('item')
            .where('item.status IN (:...statuses)', {
            statuses: [
                inventory_item_entity_1.InventoryStatus.DAMAGED,
                inventory_item_entity_1.InventoryStatus.LOST,
                inventory_item_entity_1.InventoryStatus.BROKEN,
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
    async assignToOrder(params, userId) {
        const { productId, orderId, quantity } = params;
        return this.reserveForOrder(productId, quantity, orderId, userId);
    }
    async reserveAvailableItems(manager, productId, qty) {
        const repo = manager.getRepository(inventory_item_entity_1.InventoryItem);
        const items = await repo.find({
            where: {
                productId,
                status: inventory_item_entity_1.InventoryStatus.IN_STORE,
            },
            order: { createdAt: 'ASC' },
            take: qty,
        });
        if (items.length < qty) {
            throw new common_1.BadRequestException('Not enough available items.');
        }
        return items;
    }
    async assignItemsToOrderWithManager(manager, itemIds, orderId) {
        const repo = manager.getRepository(inventory_item_entity_1.InventoryItem);
        const items = await repo.findByIds(itemIds);
        for (const item of items) {
            item.status = inventory_item_entity_1.InventoryStatus.ASSIGNED;
            item.assignedToOrderId = orderId;
        }
        await repo.save(items);
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_item_entity_1.InventoryItem)),
    __param(1, (0, typeorm_1.InjectRepository)(inventory_movement_entity_1.InventoryMovement)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map