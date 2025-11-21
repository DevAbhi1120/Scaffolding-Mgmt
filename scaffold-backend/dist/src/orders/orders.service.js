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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("../database/entities/order.entity");
const order_item_entity_1 = require("../database/entities/order-item.entity");
const inventory_service_1 = require("../inventory/inventory.service");
const billing_service_1 = require("../billing/billing.service");
let OrdersService = class OrdersService {
    constructor(dataSource, billingService, orderRepo, orderItemRepo, inventoryService) {
        this.dataSource = dataSource;
        this.billingService = billingService;
        this.orderRepo = orderRepo;
        this.orderItemRepo = orderItemRepo;
        this.inventoryService = inventoryService;
    }
    async create(createDto, createdBy) {
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
        });
        const savedRaw = await this.orderRepo.save(orderToCreate);
        const saved = Array.isArray(savedRaw) ? savedRaw[0] : savedRaw;
        if (!saved?.id)
            throw new common_1.BadRequestException('Failed to create order');
        const orderWithItems = await this.orderRepo.findOne({ where: { id: saved.id }, relations: ['items'] });
        if (!orderWithItems)
            throw new common_1.BadRequestException('Failed to load created order items');
        for (const item of orderWithItems.items) {
            try {
                await this.inventoryService.assignToOrder({
                    productId: item.productId,
                    orderId: saved.id,
                    serialNumbers: item.serialNumbers ?? undefined,
                    quantity: item.quantity,
                }, createdBy);
            }
            catch (err) {
                throw new common_1.BadRequestException(`Failed to assign inventory for product ${item.productId}: ${err?.message ?? String(err)}`);
            }
        }
        return this.orderRepo.findOne({ where: { id: saved.id }, relations: ['items'] });
    }
    async closeOrder(orderId, closedBy) {
        return this.dataSource.transaction(async (manager) => {
            const orderRepo = manager.getRepository(order_entity_1.Order);
            const order = await orderRepo.findOne({ where: { id: orderId }, relations: ['items'] });
            if (!order)
                throw new common_1.NotFoundException('Order not found');
            order.status = order_entity_1.OrderStatus.CLOSED;
            order.closeDate = new Date();
            await manager.save(order);
            if (this.billingService.createInvoiceFromOrder) {
                const invoice = await this.billingService.createInvoiceFromOrder(order.id);
                order.invoiceId = invoice.id;
                await manager.save(order);
                return { order, invoice };
            }
            return { order };
        });
    }
    async createOrderTransactional(dto) {
        if (!dto?.items?.length)
            throw new common_1.BadRequestException('Order must have items');
        return this.dataSource.transaction(async (manager) => {
            const order = manager.create(order_entity_1.Order, {
                builderId: dto.builderId ?? null,
                status: order_entity_1.OrderStatus.OPEN,
                startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
                closeDate: dto.closeDate ? new Date(dto.closeDate) : null,
                notes: dto.notes ?? null,
            });
            const savedOrder = await manager.save(order);
            const createdItems = [];
            const allAssignedItemIds = [];
            for (const it of dto.items) {
                const productId = it.productId;
                const quantity = Number(it.quantity);
                if (!productId || quantity <= 0)
                    throw new common_1.BadRequestException('Invalid order item productId/quantity');
                const reserved = await this.inventoryService.reserveAvailableItems(manager, productId, quantity);
                if (reserved.length < quantity) {
                    throw new common_1.BadRequestException(`Insufficient inventory for product ${productId}. Required ${quantity}, available ${reserved.length}`);
                }
                const itemIds = reserved.map((r) => r.id);
                allAssignedItemIds.push(...itemIds);
                const orderItem = manager.create(order_item_entity_1.OrderItem, {
                    orderId: savedOrder.id,
                    productId,
                    quantity,
                    unitPrice: it.unitPrice ?? 0,
                    description: it.description ?? null,
                });
                createdItems.push(await manager.save(orderItem));
                await this.inventoryService.assignItemsToOrderWithManager(manager, itemIds, savedOrder.id);
            }
            return manager.findOne(order_entity_1.Order, { where: { id: savedOrder.id }, relations: ['items'] });
        });
    }
    async closeOrderTransactional(orderId) {
        return this.dataSource.transaction(async (manager) => {
            const order = await manager.findOne(order_entity_1.Order, { where: { id: orderId }, relations: ['items'] });
            if (!order)
                throw new common_1.NotFoundException('Order not found');
            order.status = order_entity_1.OrderStatus.CLOSED;
            order.closeDate = new Date();
            await manager.save(order);
            return order;
        });
    }
    async findOne(id) {
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
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(3, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        billing_service_1.BillingService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        inventory_service_1.InventoryService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map