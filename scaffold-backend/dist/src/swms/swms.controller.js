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
exports.SwmsController = void 0;
const common_1 = require("@nestjs/common");
const swms_service_1 = require("./swms.service");
const create_swms_dto_1 = require("./dto/create-swms.dto");
const update_swms_dto_1 = require("./dto/update-swms.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const platform_express_1 = require("@nestjs/platform-express");
let SwmsController = class SwmsController {
    constructor(svc) {
        this.svc = svc;
    }
    async create(dto, files) {
        return this.svc.create({ ...dto, files });
    }
    async listAll() {
        return this.svc.listAll();
    }
    async listByOrder(orderId) {
        return this.svc.findByOrder(orderId);
    }
    async get(id) {
        return this.svc.get(id);
    }
    async update(id, dto, newFiles) {
        return this.svc.update(id, { ...dto, newFiles }, true);
    }
    async delete(id) {
        return this.svc.delete(id);
    }
};
exports.SwmsController = SwmsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 20)),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_swms_dto_1.CreateSwmsDto, Array]),
    __metadata("design:returntype", Promise)
], SwmsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SwmsController.prototype, "listAll", null);
__decorate([
    (0, common_1.Get)('order/:orderId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SwmsController.prototype, "listByOrder", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SwmsController.prototype, "get", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('newFiles', 20)),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_swms_dto_1.UpdateSwmsDto, Array]),
    __metadata("design:returntype", Promise)
], SwmsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SwmsController.prototype, "delete", null);
exports.SwmsController = SwmsController = __decorate([
    (0, common_1.Controller)('swms'),
    __metadata("design:paramtypes", [swms_service_1.SwmsService])
], SwmsController);
//# sourceMappingURL=swms.controller.js.map