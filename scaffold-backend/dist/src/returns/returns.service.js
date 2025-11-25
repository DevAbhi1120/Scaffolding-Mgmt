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
exports.ReturnsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const return_event_entity_1 = require("./return-event.entity");
const inventory_item_entity_1 = require("../database/entities/inventory-item.entity");
const billing_service_1 = require("../billing/billing.service");
const notification_service_1 = require("../notifications/notification.service");
let ReturnsService = class ReturnsService {
    constructor(dataSource, returnRepo, invRepo, billingService, notificationsSvc) {
        this.dataSource = dataSource;
        this.returnRepo = returnRepo;
        this.invRepo = invRepo;
        this.billingService = billingService;
        this.notificationsSvc = notificationsSvc;
    }
    async returnItems(dto, performedBy) {
        if (!dto || !Array.isArray(dto.itemIds) || dto.itemIds.length === 0) {
            throw new common_1.BadRequestException('itemIds required');
        }
        return this.dataSource.transaction(async (manager) => {
            const events = [];
            for (const id of dto.itemIds) {
                const item = await manager.findOne(inventory_item_entity_1.InventoryItem, { where: { id } });
                if (!item)
                    throw new common_1.NotFoundException(`Inventory item ${id} not found`);
                const ev = manager.create(return_event_entity_1.ReturnEvent, {
                    orderId: dto.orderId ?? item.assignedToOrderId ?? null,
                    itemId: item.id,
                    returnedBy: performedBy ?? null,
                    notes: dto.notes ?? null
                });
                const savedEv = await manager.save(ev);
                events.push(savedEv);
                if (item.condition === 'LOST') {
                    continue;
                }
                item.assignedToOrderId = null;
                item.status = item.condition === 'DAMAGED' ? inventory_item_entity_1.InventoryStatus.BROKEN : inventory_item_entity_1.InventoryStatus.IN_STORE;
                await manager.save(item);
                const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
                if (adminEmail) {
                    const subject = `Item returned: ${item.id}`;
                    const body = `Item ${item.id} (product ${item.productId}) returned${dto.orderId ? ` for order ${dto.orderId}` : ''} by ${performedBy ?? 'unknown'}.`;
                    try {
                        await this.notificationsSvc.enqueueEmailNotification(adminEmail, subject, body, 'return_event', savedEv.id);
                    }
                    catch (e) {
                        console.warn('Failed to enqueue return notification', e?.message ?? e);
                    }
                }
            }
            return events;
        });
    }
    async getReturnsForOrder(orderId) {
        return this.returnRepo.find({ where: { orderId }, order: { returnedAt: 'DESC' } });
    }
    async invoiceLateReturnsForOrder(orderId, closeDate) {
        const grace = Number(process.env.LATE_RETURN_GRACE_DAYS ?? 0);
        const feePerDay = Number(process.env.LATE_RETURN_FEE_PER_DAY ?? 20);
        const flatFee = Number(process.env.LATE_RETURN_FLAT_FEE ?? 0);
        const cutoff = new Date(closeDate);
        cutoff.setDate(cutoff.getDate() + grace);
        const items = await this.invRepo.find({ where: { assignedToOrderId: orderId } });
        if (!items || items.length === 0)
            return [];
        const invoicesCreated = [];
        for (const item of items) {
            const today = new Date();
            const msPerDay = 1000 * 60 * 60 * 24;
            const overdueDays = Math.max(0, Math.floor((today.getTime() - cutoff.getTime()) / msPerDay));
            let amount = 0;
            if (flatFee > 0) {
                amount = flatFee;
            }
            else {
                amount = feePerDay * Math.max(1, overdueDays);
            }
            if (amount <= 0)
                continue;
            try {
                const invoice = await this.billingService.createInvoiceForFee({
                    builderId: item.builderId ?? null,
                    orderId,
                    description: `Late return fee for item ${item.id} (overdue ${overdueDays} day(s))`,
                    amount
                });
                invoicesCreated.push({ itemId: item.id, invoiceId: invoice.id, amount });
            }
            catch (e) {
                console.warn('Failed to create late return fee invoice for item', item.id, e);
            }
        }
        return invoicesCreated;
    }
};
exports.ReturnsService = ReturnsService;
exports.ReturnsService = ReturnsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(return_event_entity_1.ReturnEvent)),
    __param(2, (0, typeorm_1.InjectRepository)(inventory_item_entity_1.InventoryItem)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.Repository,
        typeorm_2.Repository,
        billing_service_1.BillingService,
        notification_service_1.NotificationsService])
], ReturnsService);
//# sourceMappingURL=returns.service.js.map