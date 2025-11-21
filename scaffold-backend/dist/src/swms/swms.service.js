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
exports.SwmsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const swms_entity_1 = require("../database/entities/swms.entity");
const typeorm_2 = require("typeorm");
const notification_service_1 = require("../notifications/notification.service");
let SwmsService = class SwmsService {
    constructor(repo, notificationsSvc) {
        this.repo = repo;
        this.notificationsSvc = notificationsSvc;
    }
    async create(dto) {
        if (!dto.swmsData || !dto.highRiskTasks)
            throw new common_1.BadRequestException('swmsData and highRiskTasks are required');
        const ent = this.repo.create({
            orderId: dto.orderId ?? null,
            submittedBy: dto.submittedBy ?? null,
            swmsData: dto.swmsData,
            highRiskTasks: dto.highRiskTasks,
            attachments: dto.attachments ?? [],
            editableByAdmin: true
        });
        const saved = await this.repo.save(ent);
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
        if (adminEmail) {
            const subject = `SWMS submitted (Order: ${dto.orderId ?? 'N/A'})`;
            const text = `A SWMS was submitted${dto.orderId ? ` for order ${dto.orderId}` : ''}. SWMS id: ${saved.id}.`;
            try {
                await this.notificationsSvc.enqueueEmailNotification(adminEmail, subject, text, 'swms', saved.id);
            }
            catch (e) {
                console.warn('Failed to enqueue admin notification for SWMS:', e?.message ?? e);
            }
        }
        return saved;
    }
    async findByOrder(orderId) {
        return this.repo.find({ where: { orderId }, order: { createdAt: 'DESC' } });
    }
    async get(id) {
        const ent = await this.repo.findOne({ where: { id } });
        if (!ent)
            throw new common_1.NotFoundException('SWMS not found');
        return ent;
    }
    async update(id, dto, isAdmin = false) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('SWMS not found');
        if (!existing.editableByAdmin && !isAdmin) {
            throw new common_1.ForbiddenException('Only admin can edit this SWMS');
        }
        Object.assign(existing, dto);
        existing.editableByAdmin = true;
        return this.repo.save(existing);
    }
};
exports.SwmsService = SwmsService;
exports.SwmsService = SwmsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(swms_entity_1.Swms)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        notification_service_1.NotificationsService])
], SwmsService);
//# sourceMappingURL=swms.service.js.map