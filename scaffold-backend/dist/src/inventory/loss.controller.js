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
exports.InventoryLossController = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const mark_damaged_dto_1 = require("./dto/mark-damaged.dto");
const mark_lost_dto_1 = require("./dto/mark-lost.dto");
const recover_item_dto_1 = require("./dto/recover-item.dto");
let InventoryLossController = class InventoryLossController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async markDamaged(dto, req) {
        const user = req.user;
        return this.inventoryService.markDamaged(dto, user?.userId ?? user?.id);
    }
    async markLost(dto, req) {
        const user = req.user;
        return this.inventoryService.markLost(dto, user?.userId ?? user?.id);
    }
    async recover(dto, req) {
        const user = req.user;
        return this.inventoryService.recoverItem(dto, user?.userId ?? user?.id);
    }
    async list(productId, from, to) {
        return this.inventoryService.listLostDamaged({ productId, from, to });
    }
};
exports.InventoryLossController = InventoryLossController;
__decorate([
    (0, common_1.Post)('mark-damaged'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mark_damaged_dto_1.MarkDamagedDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryLossController.prototype, "markDamaged", null);
__decorate([
    (0, common_1.Post)('mark-lost'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mark_lost_dto_1.MarkLostDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryLossController.prototype, "markLost", null);
__decorate([
    (0, common_1.Post)('recover'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [recover_item_dto_1.RecoverItemDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryLossController.prototype, "recover", null);
__decorate([
    (0, common_1.Get)('loss/list'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Query)('productId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], InventoryLossController.prototype, "list", null);
exports.InventoryLossController = InventoryLossController = __decorate([
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryLossController);
//# sourceMappingURL=loss.controller.js.map