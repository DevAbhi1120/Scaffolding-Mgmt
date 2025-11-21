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
exports.VoidsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const void_entity_1 = require("./void.entity");
const notification_service_1 = require("../notifications/notification.service");
let VoidsService = class VoidsService {
    constructor(dataSource, repo, notificationsSvc) {
        this.dataSource = dataSource;
        this.repo = repo;
        this.notificationsSvc = notificationsSvc;
    }
    async create(dto) {
        if (!dto || !dto.type) {
            throw new common_1.BadRequestException('type is required');
        }
        const ent = this.repo.create({
            orderId: dto.orderId ?? null,
            type: dto.type,
            installer: dto.installer ?? null,
            installedOn: dto.installedOn ? new Date(dto.installedOn) : null,
            expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
            notes: dto.notes ?? null,
            attachments: dto.attachments ?? [],
            status: void_entity_1.VoidStatus.OPEN
        });
        const savedRaw = await this.repo.save(ent);
        const saved = Array.isArray(savedRaw) ? savedRaw[0] : savedRaw;
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
        if (adminEmail) {
            const subject = `VOID ${dto.type} recorded${dto.orderId ? ' for order ' + dto.orderId : ''}`;
            const text = `A VOID protection (${dto.type}) was recorded. ID: ${saved.id}.` +
                (dto.expiryDate ? ` Expiry: ${dto.expiryDate}` : '');
            try {
                await this.notificationsSvc.enqueueEmailNotification(adminEmail, subject, text, 'void', saved.id);
            }
            catch (e) {
                console.warn('Failed to enqueue VOID admin notification', e?.message ?? e);
            }
        }
        return saved;
    }
    async get(id) {
        const ent = await this.repo.findOne({ where: { id } });
        if (!ent)
            throw new common_1.NotFoundException('Void protection not found');
        return ent;
    }
    async findByOrder(orderId) {
        return this.repo.find({ where: { orderId }, order: { createdAt: 'DESC' } });
    }
    async update(id, dto) {
        const existing = await this.get(id);
        if (dto.installer !== undefined)
            existing.installer = dto.installer ?? existing.installer;
        if (dto.installedOn !== undefined)
            existing.installedOn = dto.installedOn ? new Date(dto.installedOn) : existing.installedOn;
        if (dto.expiryDate !== undefined)
            existing.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : existing.expiryDate;
        if (dto.notes !== undefined)
            existing.notes = dto.notes ?? existing.notes;
        if (dto.attachments !== undefined)
            existing.attachments = dto.attachments ?? existing.attachments;
        if (dto.status !== undefined)
            existing.status = dto.status ?? existing.status;
        return this.repo.save(existing);
    }
    async findExpiring(days = 14) {
        const today = new Date();
        const target = new Date(today);
        target.setDate(today.getDate() + days);
        const targetStr = target.toISOString().slice(0, 10);
        const res = await this.repo
            .createQueryBuilder('v')
            .where('v.expiryDate IS NOT NULL')
            .andWhere('DATE(v.expiryDate) <= :target', { target: targetStr })
            .orderBy('v.expiryDate', 'ASC')
            .getMany();
        return res;
    }
};
exports.VoidsService = VoidsService;
exports.VoidsService = VoidsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(void_entity_1.VoidProtection)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.Repository,
        notification_service_1.NotificationsService])
], VoidsService);
//# sourceMappingURL=void.service.js.map