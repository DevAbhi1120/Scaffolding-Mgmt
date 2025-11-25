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
exports.InventoryItem = exports.InventoryCondition = exports.InventoryStatus = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("./product.entity");
var InventoryStatus;
(function (InventoryStatus) {
    InventoryStatus["IN_STORE"] = "IN_STORE";
    InventoryStatus["ASSIGNED"] = "ASSIGNED";
    InventoryStatus["DAMAGED"] = "DAMAGED";
    InventoryStatus["LOST"] = "LOST";
    InventoryStatus["BROKEN"] = "BROKEN";
})(InventoryStatus || (exports.InventoryStatus = InventoryStatus = {}));
var InventoryCondition;
(function (InventoryCondition) {
    InventoryCondition["GOOD"] = "GOOD";
    InventoryCondition["DAMAGED"] = "DAMAGED";
    InventoryCondition["LOST"] = "LOST";
    InventoryCondition["REPAIRED"] = "REPAIRED";
})(InventoryCondition || (exports.InventoryCondition = InventoryCondition = {}));
let InventoryItem = class InventoryItem {
};
exports.InventoryItem = InventoryItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InventoryItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, (product) => product.inventoryItems, {
        eager: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id', referencedColumnName: 'id' }),
    __metadata("design:type", product_entity_1.Product)
], InventoryItem.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_id', type: 'char', length: 36 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], InventoryItem.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'serial_number', type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "serialNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'status',
        type: 'enum',
        enum: InventoryStatus,
        default: InventoryStatus.IN_STORE,
    }),
    __metadata("design:type", String)
], InventoryItem.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'condition',
        type: 'enum',
        enum: InventoryCondition,
        default: InventoryCondition.GOOD,
        nullable: true,
    }),
    __metadata("design:type", String)
], InventoryItem.prototype, "condition", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'damaged_at', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "damagedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'damage_notes', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "damageNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'damage_fee', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "damageFee", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lost_at', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "lostAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lost_notes', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "lostNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'lost_fee', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "lostFee", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_to_order_id', type: 'char', length: 36, nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "assignedToOrderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'site_address', type: 'varchar', length: 300, nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "siteAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'code_no', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "codeNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expiry_date', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "expiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'extra', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "extra", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], InventoryItem.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], InventoryItem.prototype, "updatedAt", void 0);
exports.InventoryItem = InventoryItem = __decorate([
    (0, typeorm_1.Entity)({ name: 'inventory_items' })
], InventoryItem);
//# sourceMappingURL=inventory-item.entity.js.map