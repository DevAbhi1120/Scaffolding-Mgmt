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
const inventory_item_entity_1 = require("../database/entities/inventory_item.entity");
const inventory_movement_entity_1 = require("../database/entities/inventory_movement.entity");
const product_entity_1 = require("../database/entities/product.entity");
const billing_service_1 = require("../billing/billing.service");
let InventoryService = class InventoryService {
    constructor(dataSource, itemRepo, movRepo, productRepo, billingService) {
        this.dataSource = dataSource;
        this.itemRepo = itemRepo;
        this.movRepo = movRepo;
        this.productRepo = productRepo;
        this.billingService = billingService;
    }
    async reserveAvailableItems(manager, productId, qty) {
        if (!productId)
            throw new common_1.BadRequestException('productId required');
        if (!qty || qty <= 0)
            throw new common_1.BadRequestException('qty must be > 0');
        const qb = manager.createQueryBuilder(inventory_item_entity_1.InventoryItem, 'i')
            .setLock('pessimistic_write')
            .where('i.productId = :productId', { productId })
            .andWhere('i.status = :status', { status: inventory_item_entity_1.InventoryStatus.IN_STORE })
            .orderBy('i.createdAt', 'ASC')
            .limit(qty);
        return await qb.getMany();
    }
    async assignItemsToOrderWithManager(manager, itemIds, orderId) {
        if (!itemIds || itemIds.length === 0)
            throw new common_1.BadRequestException('No items provided to assign');
        await manager
            .createQueryBuilder()
            .update(inventory_item_entity_1.InventoryItem)
            .set({ assignedToOrderId: orderId, status: inventory_item_entity_1.InventoryStatus.ASSIGNED })
            .whereInIds(itemIds)
            .execute();
        return manager.findByIds(inventory_item_entity_1.InventoryItem, itemIds);
    }
    async releaseItemsToStoreWithManager(manager, itemIds) {
        if (!itemIds || itemIds.length === 0)
            return;
        await manager
            .createQueryBuilder()
            .update(inventory_item_entity_1.InventoryItem)
            .set({ assignedToOrderId: null, status: inventory_item_entity_1.InventoryStatus.IN_STORE })
            .whereInIds(itemIds)
            .execute();
    }
    async createItem(dto, createdBy) {
        const prod = await this.productRepo.findOne({ where: { id: dto.productId } });
        if (!prod)
            throw new common_1.BadRequestException('Product not found');
        const item = this.itemRepo.create({ ...dto });
        return this.itemRepo.save(item);
    }
    async listItems(q) {
        const page = q?.page && q.page > 0 ? q.page : 1;
        const limit = q?.limit && q.limit > 0 ? q.limit : 20;
        const where = {};
        if (q?.productId)
            where.productId = q.productId;
        if (q?.status)
            where.status = q.status;
        const [items, total] = await this.itemRepo.findAndCount({
            where,
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        });
        return { items, total, page, limit };
    }
    async createMovement(dto, userId) {
        const prod = await this.productRepo.findOne({ where: { id: dto.productId } });
        if (!prod)
            throw new common_1.BadRequestException('Product not found');
        if (dto.movementType === inventory_movement_entity_1.MovementType.OUT) {
            const current = await this.getAvailableQuantity(dto.productId);
            if (current < dto.quantity) {
                throw new common_1.ConflictException(`Insufficient stock. Available: ${current}, requested: ${dto.quantity}`);
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
    async assignToOrder(dto, userId) {
        return this.dataSource.transaction(async (manager) => {
            const prod = await manager.findOne(product_entity_1.Product, { where: { id: dto.productId } });
            if (!prod)
                throw new common_1.BadRequestException('Product not found');
            if (dto.serialNumbers?.length) {
                const items = await manager.find(inventory_item_entity_1.InventoryItem, {
                    where: { productId: dto.productId, serialNumber: (0, typeorm_2.In)(dto.serialNumbers), status: inventory_item_entity_1.InventoryStatus.IN_STORE },
                });
                if (items.length !== dto.serialNumbers.length)
                    throw new common_1.ConflictException('One or more serial numbers not available');
                for (const item of items) {
                    item.status = inventory_item_entity_1.InventoryStatus.ASSIGNED;
                    item.assignedToOrderId = dto.orderId;
                    await manager.save(item);
                    const m = manager.create(inventory_movement_entity_1.InventoryMovement, {
                        productId: dto.productId,
                        quantity: 1,
                        movementType: inventory_movement_entity_1.MovementType.OUT,
                        referenceId: dto.orderId,
                        notes: `Assigned serial ${item.serialNumber}`,
                        createdBy: userId,
                    });
                    await manager.save(m);
                }
                return { assigned: items.length, serials: dto.serialNumbers };
            }
            if (!dto.quantity || dto.quantity < 1)
                throw new common_1.BadRequestException('quantity required when serialNumbers not provided');
            const available = await this.getAvailableQuantity(dto.productId);
            if (available < dto.quantity)
                throw new common_1.ConflictException(`Insufficient stock. Available: ${available}`);
            const movement = manager.create(inventory_movement_entity_1.InventoryMovement, {
                productId: dto.productId,
                quantity: dto.quantity,
                movementType: inventory_movement_entity_1.MovementType.OUT,
                referenceId: dto.orderId,
                notes: 'Assigned to order',
                createdBy: userId,
            });
            await manager.save(movement);
            return { assigned: dto.quantity };
        });
    }
    async returnFromOrder(dto, userId) {
        return this.dataSource.transaction(async (manager) => {
            if (dto.serialNumbers?.length) {
                const items = await manager.find(inventory_item_entity_1.InventoryItem, {
                    where: { productId: dto.productId, serialNumber: (0, typeorm_2.In)(dto.serialNumbers), assignedToOrderId: dto.orderId },
                });
                if (items.length !== dto.serialNumbers.length)
                    throw new common_1.ConflictException('One or more serial numbers not assigned to the order');
                for (const item of items) {
                    item.status = inventory_item_entity_1.InventoryStatus.IN_STORE;
                    item.assignedToOrderId = null;
                    await manager.save(item);
                    const m = manager.create(inventory_movement_entity_1.InventoryMovement, {
                        productId: dto.productId,
                        quantity: 1,
                        movementType: inventory_movement_entity_1.MovementType.IN,
                        referenceId: dto.orderId,
                        notes: `Returned serial ${item.serialNumber}`,
                        createdBy: userId,
                    });
                    await manager.save(m);
                }
                return { returned: items.length, serials: dto.serialNumbers };
            }
            if (!dto.quantity || dto.quantity < 1)
                throw new common_1.BadRequestException('quantity required for return');
            const movement = manager.create(inventory_movement_entity_1.InventoryMovement, {
                productId: dto.productId,
                quantity: dto.quantity,
                movementType: inventory_movement_entity_1.MovementType.IN,
                referenceId: dto.orderId,
                notes: 'Returned from order',
                createdBy: userId,
            });
            await manager.save(movement);
            return { returned: dto.quantity };
        });
    }
    async getAvailableQuantity(productId) {
        const itemCount = await this.itemRepo.count({ where: { productId } });
        if (itemCount > 0) {
            return this.itemRepo.count({ where: { productId, status: inventory_item_entity_1.InventoryStatus.IN_STORE } });
        }
        const qb = this.movRepo.createQueryBuilder('m')
            .select("SUM(CASE WHEN m.movementType = 'IN' THEN m.quantity WHEN m.movementType = 'OUT' THEN -m.quantity ELSE m.quantity END)", 'balance')
            .where('m.productId = :productId', { productId });
        const res = await qb.getRawOne();
        return Number(res?.balance ?? 0);
    }
    async movementsForProduct(productId, page = 1, limit = 50) {
        const [items, total] = await this.movRepo.findAndCount({
            where: { productId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, limit };
    }
    async markDamaged(dto, performedBy) {
        const item = await this.itemRepo.findOne({ where: { id: dto.itemId } });
        if (!item)
            throw new common_1.NotFoundException('Inventory item not found');
        if (item.condition === 'LOST')
            throw new common_1.BadRequestException('Item already marked lost');
        item.condition = 'DAMAGED';
        item.damagedAt = new Date();
        item.damageNotes = dto.notes ?? null;
        item.damageFee = dto.fee ?? null;
        item.status = inventory_item_entity_1.InventoryStatus.BROKEN;
        const saved = await this.itemRepo.save(item);
        if (dto.fee && dto.fee > 0) {
            try {
                const targetOrderId = item.assignedToOrderId ?? null;
                await this.billingService.createInvoiceForFee({
                    builderId: item.builderId ?? null,
                    orderId: targetOrderId,
                    description: `Damage fee for item ${item.id} (${item.serialNumber ?? ''})`,
                    amount: dto.fee,
                });
            }
            catch (e) {
                console.warn('Failed to create damage fee invoice:', e?.message ?? e);
            }
        }
        return saved;
    }
    async markLost(dto, performedBy) {
        const item = await this.itemRepo.findOne({ where: { id: dto.itemId } });
        if (!item)
            throw new common_1.NotFoundException('Inventory item not found');
        if (item.condition === 'LOST')
            throw new common_1.BadRequestException('Item already marked lost');
        item.condition = 'LOST';
        item.lostAt = new Date();
        item.lostNotes = dto.notes ?? null;
        item.lostFee = dto.fee ?? null;
        item.status = inventory_item_entity_1.InventoryStatus.OUT_FOR_REPAIR;
        item.assignedToOrderId = null;
        const saved = await this.itemRepo.save(item);
        if (dto.fee && dto.fee > 0) {
            try {
                await this.billingService.createInvoiceForFee({
                    builderId: item.builderId ?? null,
                    orderId: null,
                    description: `Lost item fee for item ${item.id} (${item.serialNumber ?? ''})`,
                    amount: dto.fee,
                });
            }
            catch (e) {
                console.warn('Failed to create lost fee invoice:', e?.message ?? e);
            }
        }
        return saved;
    }
    async recoverItem(dto, performedBy) {
        const item = await this.itemRepo.findOne({ where: { id: dto.itemId } });
        if (!item)
            throw new common_1.NotFoundException('Inventory item not found');
        item.condition = 'REPAIRED';
        item.damagedAt = null;
        item.damageNotes = null;
        item.damageFee = null;
        item.lostAt = null;
        item.lostNotes = null;
        item.lostFee = null;
        item.status = inventory_item_entity_1.InventoryStatus.IN_STORE;
        return this.itemRepo.save(item);
    }
    async listLostDamaged(filters) {
        const qb = this.itemRepo.createQueryBuilder('i');
        if (filters.productId)
            qb.andWhere('i.productId = :productId', { productId: filters.productId });
        if (filters.from)
            qb.andWhere('i.createdAt >= :from', { from: filters.from });
        if (filters.to)
            qb.andWhere('i.createdAt <= :to', { to: filters.to });
        qb.andWhere('(i.condition = :damaged OR i.condition = :lost)', { damaged: 'DAMAGED', lost: 'LOST' });
        qb.orderBy('i.createdAt', 'DESC');
        return qb.getMany();
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(inventory_item_entity_1.InventoryItem)),
    __param(2, (0, typeorm_1.InjectRepository)(inventory_movement_entity_1.InventoryMovement)),
    __param(3, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        billing_service_1.BillingService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map