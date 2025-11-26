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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryBatch = exports.InventoryBatchStatus = void 0;
const typeorm_1 = require("typeorm");
var InventoryBatchStatus;
(function (InventoryBatchStatus) {
    InventoryBatchStatus["IN_STORE"] = "IN_STORE";
    InventoryBatchStatus["RESERVED"] = "RESERVED";
    InventoryBatchStatus["CONSUMED"] = "CONSUMED";
    InventoryBatchStatus["DAMAGED"] = "DAMAGED";
})(InventoryBatchStatus || (exports.InventoryBatchStatus = InventoryBatchStatus = {}));
let InventoryBatch = class InventoryBatch {
};
exports.InventoryBatch = InventoryBatch;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InventoryBatch.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_id', type: 'char', length: 36 }),
    __metadata("design:type", String)
], InventoryBatch.prototype, "product_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], InventoryBatch.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'enum', enum: InventoryBatchStatus, default: InventoryBatchStatus.IN_STORE }),
    __metadata("design:type", String)
], InventoryBatch.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_type', type: 'enum', enum: ['SYSTEM', 'PURCHASE', 'ORDER'], nullable: true }),
    __metadata("design:type", String)
], InventoryBatch.prototype, "referenceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_id', type: 'char', length: 36, nullable: true }),
    __metadata("design:type", Object)
], InventoryBatch.prototype, "referenceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'meta', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], InventoryBatch.prototype, "meta", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], InventoryBatch.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], InventoryBatch.prototype, "updatedAt", void 0);
exports.InventoryBatch = InventoryBatch = __decorate([
    (0, typeorm_1.Entity)({ name: 'inventory_batches' })
], InventoryBatch);
//# sourceMappingURL=inventory-batch.entity.js.map