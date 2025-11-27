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
exports.ChecklistsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const uuid_1 = require("uuid");
const checklists_service_1 = require("./checklists.service");
let ChecklistsController = class ChecklistsController {
    constructor(svc, filesService) {
        this.svc = svc;
        this.filesService = filesService;
    }
    async create(body, files) {
        let checklistData;
        try {
            checklistData = typeof body.checklistData === 'string' ? JSON.parse(body.checklistData) : body.checklistData;
        }
        catch (e) {
            throw new common_1.BadRequestException('Invalid checklistData JSON');
        }
        const dto = {
            orderId: body.orderId ?? null,
            submittedBy: body.submittedBy ?? null,
            checklistData,
            dateOfCheck: body.dateOfCheck ?? body.check_date ?? body.checkDate,
            attachments: [],
            preserved: body.preserved === 'false' ? false : body.preserved === 'true' ? true : body.preserved ?? true,
        };
        if (files && files.length > 0) {
            const uploaded = await this.filesService.uploadMany(files);
            dto.attachments = uploaded.map((u) => u.key || u.url || String(u));
        }
        return this.svc.create(dto);
    }
    async update(id, body, files) {
        let checklistData;
        try {
            checklistData = typeof body.checklistData === 'string'
                ? JSON.parse(body.checklistData)
                : body.checklistData;
        }
        catch (e) {
            throw new common_1.BadRequestException('Invalid checklistData JSON');
        }
        let existingAttachments = [];
        try {
            existingAttachments = body.existingAttachments
                ? JSON.parse(body.existingAttachments)
                : [];
        }
        catch (e) {
            existingAttachments = [];
        }
        const dto = {
            orderId: body.orderId ?? null,
            submittedBy: body.submittedBy ?? null,
            checklistData,
            dateOfCheck: body.dateOfCheck,
            existingAttachments,
            preserved: body.preserved,
        };
        if (files && files.length > 0) {
            const uploaded = await this.filesService.uploadMany(files);
            dto.attachments = uploaded.map((u) => u.key || u.url || String(u));
        }
        return this.svc.update(id, dto);
    }
    async list(q) {
        const filters = {};
        if (q.orderId)
            filters.orderId = q.orderId;
        if (q.builderId)
            filters.builderId = q.builderId;
        if (q.from)
            filters.from = q.from;
        if (q.to)
            filters.to = q.to;
        if (q.search)
            filters.search = q.search;
        return this.svc.search(filters);
    }
    async byOrder(orderId) {
        return this.svc.findByOrder(orderId);
    }
    async getOne(id) {
        return this.svc.get(id);
    }
    async delete(id) {
        return this.svc.delete(id);
    }
};
exports.ChecklistsController = ChecklistsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('attachments', 10, {
        storage: (0, multer_1.diskStorage)({
            destination: (req, file, cb) => cb(null, './uploads/checklists'),
            filename: (req, file, cb) => {
                const id = (0, uuid_1.v4)();
                const ext = (0, path_1.extname)(file.originalname) || '';
                cb(null, `${id}${ext}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            const allowed = /jpeg|jpg|png|gif|pdf/;
            const ok = allowed.test(file.mimetype);
            cb(ok ? null : new common_1.BadRequestException('Only images/pdf allowed'), ok);
        },
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", Promise)
], ChecklistsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('attachments', 10, {
        storage: (0, multer_1.diskStorage)({
            destination: (req, file, cb) => cb(null, './uploads/checklists'),
            filename: (req, file, cb) => {
                const id = (0, uuid_1.v4)();
                const ext = (0, path_1.extname)(file.originalname) || '';
                cb(null, `${id}${ext}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            const allowed = /jpeg|jpg|png|gif|pdf/;
            const ok = allowed.test(file.mimetype);
            cb(ok ? null : new common_1.BadRequestException('Only images/pdf allowed'), ok);
        },
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Array]),
    __metadata("design:returntype", Promise)
], ChecklistsController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChecklistsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('order/:orderId'),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChecklistsController.prototype, "byOrder", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChecklistsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChecklistsController.prototype, "delete", null);
exports.ChecklistsController = ChecklistsController = __decorate([
    (0, common_1.Controller)('checklists'),
    __param(1, (0, common_1.Inject)('FilesService')),
    __metadata("design:paramtypes", [checklists_service_1.ChecklistsService, Object])
], ChecklistsController);
//# sourceMappingURL=checklists.controller.js.map