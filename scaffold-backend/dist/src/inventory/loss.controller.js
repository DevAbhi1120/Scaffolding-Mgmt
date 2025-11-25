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
exports.LossController = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const mark_damaged_dto_1 = require("./dto/mark-damaged.dto");
const mark_lost_dto_1 = require("./dto/mark-lost.dto");
const recover_item_dto_1 = require("./dto/recover-item.dto");
let LossController = class LossController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async markDamaged(dto, req) {
        const user = req.user;
        await this.inventoryService.markDamaged(dto, user?.userId ?? user?.id);
        return { success: true };
    }
    async markLost(dto, req) {
        const user = req.user;
        await this.inventoryService.markLost(dto, user?.userId ?? user?.id);
        return { success: true };
    }
    async recoverItem(dto, req) {
        const user = req.user;
        await this.inventoryService.recoverItem(dto, user?.userId ?? user?.id);
        return { success: true };
    }
    async listLostDamaged(productId, from, to) {
        const items = await this.inventoryService.listLostDamaged({
            productId,
            from,
            to,
        });
        return { success: true, data: items };
    }
};
exports.LossController = LossController;
__decorate([
    (0, common_1.Post)('damaged'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mark_damaged_dto_1.MarkDamagedDto, Object]),
    __metadata("design:returntype", Promise)
], LossController.prototype, "markDamaged", null);
__decorate([
    (0, common_1.Post)('lost'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mark_lost_dto_1.MarkLostDto, Object]),
    __metadata("design:returntype", Promise)
], LossController.prototype, "markLost", null);
__decorate([
    (0, common_1.Post)('recover'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [recover_item_dto_1.RecoverItemDto, Object]),
    __metadata("design:returntype", Promise)
], LossController.prototype, "recoverItem", null);
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Query)('productId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], LossController.prototype, "listLostDamaged", null);
exports.LossController = LossController = __decorate([
    (0, common_1.Controller)('inventories/loss'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], LossController);
//# sourceMappingURL=loss.controller.js.map