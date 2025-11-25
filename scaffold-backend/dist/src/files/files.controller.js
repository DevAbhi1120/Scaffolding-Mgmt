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
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const files_service_1 = require("./files.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const platform_express_1 = require("@nestjs/platform-express");
const path = require("path");
const fs = require("fs");
let FilesController = class FilesController {
    constructor(filesSvc) {
        this.filesSvc = filesSvc;
    }
    async upload(files, relatedEntityType, relatedEntityId, category, req) {
        const user = req.user;
        const uploadedBy = user?.userId ?? user?.id ?? user?.sub ?? 'unknown';
        if (!relatedEntityType || !relatedEntityId) {
            throw new common_1.BadRequestException('relatedEntityType and relatedEntityId are required');
        }
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('At least one file is required');
        }
        return this.filesSvc.uploadFiles(files, {
            relatedEntityType,
            relatedEntityId,
            category,
            uploadedBy,
        });
    }
    async list(entityType, entityId, page, limit) {
        return this.filesSvc.listFiles({
            entityType,
            entityId,
            page: Number(page) || 1,
            limit: Number(limit) || 20,
        });
    }
    async viewFile(id, index, res) {
        const idx = Number.isNaN(Number(index)) ? 0 : Number(index);
        const loc = await this.filesSvc.getFileLocation(id, idx);
        if (loc.type === 's3') {
            return res.redirect(loc.url);
        }
        if (!fs.existsSync(loc.filePath)) {
            return res.status(404).json({ message: 'File not found on disk' });
        }
        return res.sendFile(path.resolve(loc.filePath));
    }
    async update(id, files, relatedEntityType, relatedEntityId, category, keepKeysRaw, removeKeysRaw, req) {
        const user = req.user;
        const uploadedBy = user?.userId ?? user?.id ?? user?.sub ?? 'unknown';
        let keepKeys = undefined;
        if (Array.isArray(keepKeysRaw)) {
            keepKeys = keepKeysRaw;
        }
        else if (typeof keepKeysRaw === 'string' && keepKeysRaw.trim()) {
            const raw = keepKeysRaw.trim();
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    keepKeys = parsed.map((k) => String(k));
                }
                else {
                    keepKeys = [String(parsed)];
                }
            }
            catch {
                keepKeys = raw.split(',').map((k) => k.trim()).filter(Boolean);
            }
        }
        let removeKeys = undefined;
        if (Array.isArray(removeKeysRaw)) {
            removeKeys = removeKeysRaw;
        }
        else if (typeof removeKeysRaw === 'string' && removeKeysRaw.trim()) {
            const raw = removeKeysRaw.trim();
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    removeKeys = parsed.map((k) => String(k));
                }
                else {
                    removeKeys = [String(parsed)];
                }
            }
            catch {
                removeKeys = raw.split(',').map((k) => k.trim()).filter(Boolean);
            }
        }
        const safeFiles = files && files.length > 0 ? files : undefined;
        return this.filesSvc.updateFile(id, safeFiles, {
            relatedEntityType,
            relatedEntityId,
            category,
            uploadedBy,
            keepKeys,
            removeKeys,
        });
    }
    async delete(id) {
        return this.filesSvc.deleteFile(id);
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.AnyFilesInterceptor)()),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)('relatedEntityType')),
    __param(2, (0, common_1.Body)('relatedEntityId')),
    __param(3, (0, common_1.Body)('category')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Query)('entityType')),
    __param(1, (0, common_1.Query)('entityId')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Query)('index')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "viewFile", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.AnyFilesInterceptor)()),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, common_1.Body)('relatedEntityType')),
    __param(3, (0, common_1.Body)('relatedEntityId')),
    __param(4, (0, common_1.Body)('category')),
    __param(5, (0, common_1.Body)('keepKeys')),
    __param(6, (0, common_1.Body)('removeKeys')),
    __param(7, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, String, String, String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "delete", null);
exports.FilesController = FilesController = __decorate([
    (0, common_1.Controller)('files'),
    __metadata("design:paramtypes", [files_service_1.FilesService])
], FilesController);
//# sourceMappingURL=files.controller.js.map