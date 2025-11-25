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
exports.InventoryMovement = exports.MovementReferenceType = exports.MovementReason = exports.MovementType = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("./product.entity");
var MovementType;
(function (MovementType) {
    MovementType["IN"] = "IN";
    MovementType["OUT"] = "OUT";
    MovementType["ADJUSTMENT"] = "ADJUSTMENT";
})(MovementType || (exports.MovementType = MovementType = {}));
var MovementReason;
(function (MovementReason) {
    MovementReason["PURCHASE"] = "PURCHASE";
    MovementReason["SALE"] = "SALE";
    MovementReason["ORDER_RESERVE"] = "ORDER_RESERVE";
    MovementReason["ORDER_RELEASE"] = "ORDER_RELEASE";
    MovementReason["DAMAGE"] = "DAMAGE";
    MovementReason["LOSS"] = "LOSS";
    MovementReason["MANUAL"] = "MANUAL";
})(MovementReason || (exports.MovementReason = MovementReason = {}));
var MovementReferenceType;
(function (MovementReferenceType) {
    MovementReferenceType["ORDER"] = "ORDER";
    MovementReferenceType["JOB"] = "JOB";
    MovementReferenceType["PURCHASE_ORDER"] = "PURCHASE_ORDER";
    MovementReferenceType["ADJUSTMENT"] = "ADJUSTMENT";
    MovementReferenceType["SYSTEM"] = "SYSTEM";
})(MovementReferenceType || (exports.MovementReferenceType = MovementReferenceType = {}));
let InventoryMovement = class InventoryMovement {
};
exports.InventoryMovement = InventoryMovement;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], InventoryMovement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, (product) => product.inventoryMovements, {
        eager: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id', referencedColumnName: 'id' }),
    __metadata("design:type", product_entity_1.Product)
], InventoryMovement.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_id', type: 'char', length: 36 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], InventoryMovement.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'inventory_item_id',
        type: 'char',
        length: 36,
        nullable: true,
    }),
    __metadata("design:type", Object)
], InventoryMovement.prototype, "inventoryItemId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], InventoryMovement.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'movement_type',
        type: 'enum',
        enum: MovementType,
    }),
    __metadata("design:type", String)
], InventoryMovement.prototype, "movementType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'reason',
        type: 'enum',
        enum: MovementReason,
    }),
    __metadata("design:type", String)
], InventoryMovement.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'reference_type',
        type: 'enum',
        enum: MovementReferenceType,
        nullable: true,
    }),
    __metadata("design:type", Object)
], InventoryMovement.prototype, "referenceType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'reference_id',
        type: 'char',
        length: 36,
        nullable: true,
    }),
    __metadata("design:type", Object)
], InventoryMovement.prototype, "referenceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], InventoryMovement.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'created_by',
        type: 'char',
        length: 36,
        nullable: true,
    }),
    __metadata("design:type", Object)
], InventoryMovement.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], InventoryMovement.prototype, "createdAt", void 0);
exports.InventoryMovement = InventoryMovement = __decorate([
    (0, typeorm_1.Entity)({ name: 'inventory_movements' })
], InventoryMovement);
//# sourceMappingURL=inventory-movement.entity.js.map