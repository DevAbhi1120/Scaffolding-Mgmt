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
var ExpiryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpiryService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const notification_service_1 = require("../notifications/notification.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const void_entity_1 = require("../voids/void.entity");
const inventory_item_entity_1 = require("../database/entities/inventory_item.entity");
let ExpiryService = ExpiryService_1 = class ExpiryService {
    constructor(notificationsSvc, voidRepo, invRepo) {
        this.notificationsSvc = notificationsSvc;
        this.voidRepo = voidRepo;
        this.invRepo = invRepo;
        this.logger = new common_1.Logger(ExpiryService_1.name);
    }
    async dailyExpiryCheck() {
        const days = Number(process.env.EXPIRY_ALERT_DAYS ?? 14);
        this.logger.log(`Running expiry check (next ${days} days)`);
        const now = new Date();
        const target = new Date(now);
        target.setDate(now.getDate() + days);
        const targetStr = target.toISOString().slice(0, 10);
        const voids = await this.voidRepo
            .createQueryBuilder('v')
            .where('v.expiryDate IS NOT NULL')
            .andWhere('DATE(v.expiryDate) <= :target', { target: targetStr })
            .orderBy('v.expiryDate', 'ASC')
            .getMany();
        for (const v of voids) {
            try {
                const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
                if (adminEmail) {
                    const subj = `VOID protection expiring soon: ${v.id}`;
                    const body = `VOID protection ${v.id} (type: ${v.type}) for order ${v.orderId ?? 'N/A'} expires on ${v.expiryDate}`;
                    await this.notificationsSvc.enqueueEmailNotification(adminEmail, subj, body, 'void', v.id);
                }
            }
            catch (e) {
                this.logger.warn('Failed to enqueue void expiry notification: ' + String(e));
            }
        }
        const inv = await this.invRepo
            .createQueryBuilder('i')
            .where('i.expiryDate IS NOT NULL')
            .andWhere('DATE(i.expiryDate) <= :target', { target: targetStr })
            .orderBy('i.expiryDate', 'ASC')
            .getMany();
        for (const item of inv) {
            try {
                const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
                if (adminEmail) {
                    const subj = `Inventory item expiring soon: ${item.id}`;
                    const body = `Inventory item ${item.id} (product: ${item.productId}) at site ${item.siteAddress ?? ''} expires on ${item.expiryDate}`;
                    await this.notificationsSvc.enqueueEmailNotification(adminEmail, subj, body, 'inventory_item', item.id);
                }
            }
            catch (e) {
                this.logger.warn('Failed to enqueue inventory expiry notification: ' + String(e));
            }
        }
    }
};
exports.ExpiryService = ExpiryService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExpiryService.prototype, "dailyExpiryCheck", null);
exports.ExpiryService = ExpiryService = ExpiryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(void_entity_1.VoidProtection)),
    __param(2, (0, typeorm_1.InjectRepository)(inventory_item_entity_1.InventoryItem)),
    __metadata("design:paramtypes", [notification_service_1.NotificationsService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ExpiryService);
//# sourceMappingURL=expiry.service.js.map