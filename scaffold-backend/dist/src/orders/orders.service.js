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
        return this.createOrderTransactional(createDto, createdBy);
    }
    async createOrderTransactional(dto, createdBy) {
        if (!dto?.items?.length)
            throw new common_1.BadRequestException('Order must have items');
        return this.dataSource.transaction(async (manager) => {
            const order = manager.create(order_entity_1.Order, {
                builderId: dto.builderId ?? null,
                status: order_entity_1.OrderStatus.CONFIRMED,
                startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
                closeDate: dto.closeDate ? new Date(dto.closeDate) : null,
                notes: dto.notes ?? null,
            });
            const savedOrder = await manager.save(order);
            const createdItems = [];
            for (const it of dto.items) {
                const productId = it.productId;
                const quantity = Number(it.quantity);
                if (!productId || quantity <= 0)
                    throw new common_1.BadRequestException('Invalid order item productId/quantity');
                let reserved;
                if (typeof this.inventoryService.reserveAvailableItems === 'function') {
                    try {
                        reserved = await this.inventoryService.reserveAvailableItems(manager, productId, quantity);
                    }
                    catch (err) {
                        reserved = await this.inventoryService.reserveAvailableItems(productId, quantity);
                    }
                }
                else {
                    throw new common_1.InternalServerErrorException('InventoryService.reserveAvailableItems not available');
                }
                if (!Array.isArray(reserved) || reserved.length < quantity) {
                    throw new common_1.BadRequestException(`Insufficient inventory for product ${productId}. Required ${quantity}, available ${Array.isArray(reserved) ? reserved.length : 0}`);
                }
                const itemIds = reserved.map((r) => r.id);
                const orderItem = manager.create(order_item_entity_1.OrderItem, {
                    orderId: savedOrder.id,
                    productId,
                    quantity,
                    unitPrice: typeof it.unitPrice !== 'undefined' ? it.unitPrice : null,
                    description: it.description ?? null,
                    serialNumbers: it.serialNumbers ?? null,
                });
                const savedItem = await manager.save(orderItem);
                createdItems.push(savedItem);
                if (typeof this.inventoryService.assignItemsToOrderWithManager === 'function') {
                    await this.inventoryService.assignItemsToOrderWithManager(manager, itemIds, savedOrder.id, createdBy);
                }
                else if (typeof this.inventoryService.assignItemsToOrder === 'function') {
                    await this.inventoryService.assignItemsToOrder(itemIds, savedOrder.id, createdBy);
                }
                else {
                    throw new common_1.InternalServerErrorException('InventoryService assign method not available');
                }
            }
            if (this.billingService.createInvoiceFromOrderWithManager) {
                try {
                    const invoice = await this.billingService.createInvoiceFromOrderWithManager(manager, savedOrder.id);
                    savedOrder.invoiceId = invoice.id;
                    await manager.save(savedOrder);
                }
                catch (err) {
                    throw new common_1.BadRequestException(`Failed to create invoice: ${err?.message ?? err}`);
                }
            }
            return manager.findOne(order_entity_1.Order, { where: { id: savedOrder.id }, relations: ['items'] });
        });
    }
    async closeOrder(orderId, closedBy) {
        return this.dataSource.transaction(async (manager) => {
            const orderRepo = manager.getRepository(order_entity_1.Order);
            const order = await orderRepo.findOne({ where: { id: orderId }, relations: ['items'] });
            if (!order)
                throw new common_1.NotFoundException('Order not found');
            order.status = order_entity_1.OrderStatus.SHIPPED;
            order.closeDate = new Date();
            await manager.save(order);
            if (this.billingService.createInvoiceFromOrderWithManager) {
                const invoice = await this.billingService.createInvoiceFromOrderWithManager(manager, order.id);
                order.invoiceId = invoice.id;
                await manager.save(order);
                return { order, invoice };
            }
            return { order };
        });
    }
    async findOne(id) {
        return this.orderRepo.findOne({ where: { id }, relations: ['items'] });
    }
    async findAll(page = 1, limit = 20) {
        const [items, total] = await this.orderRepo.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            relations: [],
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