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
const create_inventory_from_form_dto_1 = require("./dto/create-inventory-from-form.dto");
const create_batch_dto_1 = require("./dto/create-batch.dto");
const update_batch_dto_1 = require("./dto/update-batch.dto");
const mark_damaged_dto_1 = require("./dto/mark-damaged.dto");
const mark_lost_dto_1 = require("./dto/mark-lost.dto");
const recover_item_dto_1 = require("./dto/recover-item.dto");
const inventory_item_entity_1 = require("../database/entities/inventory-item.entity");
const inventory_batch_entity_1 = require("../database/entities/inventory-batch.entity");
let InventoryController = class InventoryController {
    constructor(svc) {
        this.svc = svc;
    }
    async createFromForm(dto) {
        return this.svc.createFromForm(dto);
    }
    async listItems(productId) {
        return this.svc.listItems(productId);
    }
    async getItem(id) {
        const item = await this.svc.getItemById(id);
        if (!item)
            throw new common_1.NotFoundException('Item not found');
        return item;
    }
    async deleteItem(id) {
        const deleted = await this.svc.deleteItemById(id);
        if (!deleted)
            throw new common_1.NotFoundException('Item not found or could not be deleted');
        return { success: true };
    }
    async deleteProductInventory(productId) {
        await this.svc.deleteAllForProduct(productId);
        return { success: true };
    }
    async createBatch(dto) {
        return this.svc.createBatch(dto);
    }
    async listBatches(productId) {
        return this.svc.listBatches(productId);
    }
    async getBatch(id) {
        return this.svc.getBatch(id);
    }
    async updateBatch(id, dto) {
        return this.svc.updateBatch(id, dto);
    }
    async deleteBatch(id) {
        return this.svc.deleteBatch(id);
    }
    async getSummary(productId) {
        const summary = await this.svc.getProductSummary(productId);
        const batchSumRaw = await this.svc.batchesRepo
            .createQueryBuilder('b')
            .select('COALESCE(SUM(b.quantity),0)', 'sum')
            .where('b.product_id = :productId', { productId })
            .andWhere('b.status = :inStore', { inStore: inventory_batch_entity_1.InventoryBatchStatus.IN_STORE })
            .getRawOne();
        const batchQty = Number(batchSumRaw?.sum || 0);
        const items = await this.svc.listItems(productId);
        const itemCount = Array.isArray(items) ? items.filter((it) => it.status === inventory_item_entity_1.InventoryStatus.IN_STORE).length : 0;
        const availablePhysical = batchQty + itemCount;
        return {
            productId,
            availablePhysical,
            stockBalance: summary.stockBalance,
            openingStock: summary.openingStock ?? 0,
            stockIn: summary.stockIn ?? 0,
            stockOut: summary.stockOut ?? 0,
        };
    }
    async markDamaged(dto) {
        return this.svc.markItemDamaged(dto.itemId, dto.notes, dto.fee);
    }
    async markLost(dto) {
        return this.svc.markItemLost(dto.itemId, dto.notes, dto.fee);
    }
    async recover(dto) {
        return this.svc.recoverItem(dto.itemId, dto.notes);
    }
    async listLostDamaged(productId, from, to) {
        return this.svc.listLostDamaged({ productId, from, to });
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Post)('items'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_inventory_from_form_dto_1.CreateInventoryFromFormDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createFromForm", null);
__decorate([
    (0, common_1.Get)('items'),
    __param(0, (0, common_1.Query)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "listItems", null);
__decorate([
    (0, common_1.Get)('items/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getItem", null);
__decorate([
    (0, common_1.Delete)('items/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "deleteItem", null);
__decorate([
    (0, common_1.Delete)('product/:productId'),
    __param(0, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "deleteProductInventory", null);
__decorate([
    (0, common_1.Post)('batches'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_batch_dto_1.CreateBatchDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createBatch", null);
__decorate([
    (0, common_1.Get)('batches'),
    __param(0, (0, common_1.Query)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "listBatches", null);
__decorate([
    (0, common_1.Get)('batches/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getBatch", null);
__decorate([
    (0, common_1.Put)('batches/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_batch_dto_1.UpdateBatchDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "updateBatch", null);
__decorate([
    (0, common_1.Delete)('batches/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "deleteBatch", null);
__decorate([
    (0, common_1.Get)('summary/:productId'),
    __param(0, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Post)('mark-damaged'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mark_damaged_dto_1.MarkDamagedDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "markDamaged", null);
__decorate([
    (0, common_1.Post)('mark-lost'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mark_lost_dto_1.MarkLostDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "markLost", null);
__decorate([
    (0, common_1.Post)('recover'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [recover_item_dto_1.RecoverItemDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "recover", null);
__decorate([
    (0, common_1.Get)('lost-damaged'),
    __param(0, (0, common_1.Query)('productId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "listLostDamaged", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('inventories'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map