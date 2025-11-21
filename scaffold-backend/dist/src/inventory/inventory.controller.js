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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const create_item_dto_1 = require("./dto/create-item.dto");
const movement_dto_1 = require("./dto/movement.dto");
const assign_items_dto_1 = require("./dto/assign-items.dto");
let InventoryController = class InventoryController {
    constructor(svc) {
        this.svc = svc;
    }
    async createItem(dto) {
        return this.svc.createItem(dto);
    }
    async listItems(productId, status, page, limit) {
        return this.svc.listItems({ productId, status, page: Number(page), limit: Number(limit) });
    }
    async movement(dto) {
        return this.svc.createMovement(dto);
    }
    async assign(dto) {
        return this.svc.assignToOrder(dto);
    }
    async return(dto) {
        return this.svc.returnFromOrder(dto);
    }
    async getAvailable(id) {
        const qty = await this.svc.getAvailableQuantity(id);
        return { productId: id, available: qty };
    }
    async movements(id, page, limit) {
        return this.svc.movementsForProduct(id, Number(page) || 1, Number(limit) || 50);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Post)('items'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_item_dto_1.CreateInventoryItemDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createItem", null);
__decorate([
    (0, common_1.Get)('items'),
    __param(0, (0, common_1.Query)('productId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Number, Number]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "listItems", null);
__decorate([
    (0, common_1.Post)('movement'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [movement_dto_1.InventoryMovementDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "movement", null);
__decorate([
    (0, common_1.Post)('assign'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assign_items_dto_1.AssignItemsDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "assign", null);
__decorate([
    (0, common_1.Post)('return'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assign_items_dto_1.AssignItemsDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "return", null);
__decorate([
    (0, common_1.Get)('product/:id/available'),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getAvailable", null);
__decorate([
    (0, common_1.Get)('product/:id/movements'),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "movements", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map