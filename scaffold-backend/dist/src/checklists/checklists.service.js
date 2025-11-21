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
exports.ChecklistsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const safety_checklist_entity_1 = require("./safety_checklist.entity");
const notification_service_1 = require("../notifications/notification.service");
let ChecklistsService = class ChecklistsService {
    constructor(dataSource, repo, notificationsSvc) {
        this.dataSource = dataSource;
        this.repo = repo;
        this.notificationsSvc = notificationsSvc;
    }
    async create(dto) {
        if (!dto || !dto.checklistData)
            throw new common_1.BadRequestException('checklistData is required');
        const date = new Date(dto.dateOfCheck);
        if (Number.isNaN(date.getTime()))
            throw new common_1.BadRequestException('Invalid dateOfCheck');
        const entity = this.repo.create({
            orderId: dto.orderId ?? null,
            submittedBy: dto.submittedBy ?? null,
            checklistData: dto.checklistData,
            dateOfCheck: date,
            attachments: dto.attachments ?? [],
            preserved: true
        });
        const savedRaw = await this.repo.save(entity);
        const saved = Array.isArray(savedRaw) ? savedRaw[0] : savedRaw;
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER;
        if (adminEmail) {
            const subject = `Safety checklist submitted${dto.orderId ? ` for order ${dto.orderId}` : ''}`;
            const text = `A safety checklist was submitted${dto.orderId ? ` for order ${dto.orderId}` : ''} on ${dto.dateOfCheck}. Checklist ID: ${saved.id}.`;
            try {
                await this.notificationsSvc.enqueueEmailNotification(adminEmail, subject, text, 'safety_checklist', saved.id);
            }
            catch (e) {
                console.warn('Failed to enqueue admin notification for checklist:', e?.message ?? e);
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
            throw new common_1.NotFoundException('Checklist not found');
        return ent;
    }
    async search(filters) {
        const qb = this.repo.createQueryBuilder('c').leftJoinAndSelect('c.order', 'o');
        if (filters.orderId)
            qb.andWhere('c.orderId = :orderId', { orderId: filters.orderId });
        if (filters.from)
            qb.andWhere('c.dateOfCheck >= :from', { from: filters.from });
        if (filters.to)
            qb.andWhere('c.dateOfCheck <= :to', { to: filters.to });
        if (filters.builderId) {
            qb.andWhere('o.builderId = :builderId', { builderId: filters.builderId });
        }
        if (filters.search) {
            qb.andWhere('(JSON_EXTRACT(c.checklistData, "$") LIKE :s OR c.id LIKE :s)', { s: `%${filters.search}%` });
        }
        qb.orderBy('c.createdAt', 'DESC');
        return qb.getMany();
    }
};
exports.ChecklistsService = ChecklistsService;
exports.ChecklistsService = ChecklistsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(safety_checklist_entity_1.SafetyChecklist)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.Repository,
        notification_service_1.NotificationsService])
], ChecklistsService);
//# sourceMappingURL=checklists.service.js.map