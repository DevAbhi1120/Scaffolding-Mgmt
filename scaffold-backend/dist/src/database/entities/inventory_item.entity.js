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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryCondition = exports.InventoryStatus = exports.InventoryItem = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("./product.entity");
const inventory_status_enum_1 = require("../../inventory/enums/inventory-status.enum");
Object.defineProperty(exports, "InventoryStatus", { enumerable: true, get: function () { return inventory_status_enum_1.InventoryStatus; } });
const inventory_condition_enum_1 = require("../../inventory/enums/inventory-condition.enum");
Object.defineProperty(exports, "InventoryCondition", { enumerable: true, get: function () { return inventory_condition_enum_1.InventoryCondition; } });
let InventoryItem = class InventoryItem {
};
exports.InventoryItem = InventoryItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InventoryItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { onDelete: 'CASCADE' }),
    __metadata("design:type", product_entity_1.Product)
], InventoryItem.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], InventoryItem.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], InventoryItem.prototype, "serialNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: inventory_status_enum_1.InventoryStatus,
        default: inventory_status_enum_1.InventoryStatus.IN_STORE,
    }),
    __metadata("design:type", typeof (_a = typeof inventory_status_enum_1.InventoryStatus !== "undefined" && inventory_status_enum_1.InventoryStatus) === "function" ? _a : Object)
], InventoryItem.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: inventory_condition_enum_1.InventoryCondition,
        nullable: true,
        default: inventory_condition_enum_1.InventoryCondition.GOOD,
    }),
    __metadata("design:type", typeof (_b = typeof inventory_condition_enum_1.InventoryCondition !== "undefined" && inventory_condition_enum_1.InventoryCondition) === "function" ? _b : Object)
], InventoryItem.prototype, "condition", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], InventoryItem.prototype, "damagedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], InventoryItem.prototype, "damageNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "damageFee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], InventoryItem.prototype, "lostAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], InventoryItem.prototype, "lostNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "lostFee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], InventoryItem.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "assignedToOrderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 300, nullable: true }),
    __metadata("design:type", String)
], InventoryItem.prototype, "siteAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], InventoryItem.prototype, "codeNo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], InventoryItem.prototype, "expiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], InventoryItem.prototype, "extra", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], InventoryItem.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], InventoryItem.prototype, "updatedAt", void 0);
exports.InventoryItem = InventoryItem = __decorate([
    (0, typeorm_1.Entity)({ name: 'inventory_items' })
], InventoryItem);
//# sourceMappingURL=inventory_item.entity.js.map