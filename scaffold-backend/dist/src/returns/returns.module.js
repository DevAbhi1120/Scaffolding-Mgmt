"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const return_event_entity_1 = require("./return-event.entity");
const inventory_item_entity_1 = require("../database/entities/inventory_item.entity");
const returns_service_1 = require("./returns.service");
const returns_controller_1 = require("./returns.controller");
const billing_module_1 = require("../billing/billing.module");
const notifications_module_1 = require("../notifications/notifications.module");
let ReturnsModule = class ReturnsModule {
};
exports.ReturnsModule = ReturnsModule;
exports.ReturnsModule = ReturnsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([return_event_entity_1.ReturnEvent, inventory_item_entity_1.InventoryItem]),
            (0, common_1.forwardRef)(() => billing_module_1.BillingModule),
            notifications_module_1.NotificationsModule
        ],
        providers: [returns_service_1.ReturnsService],
        controllers: [returns_controller_1.ReturnsController],
        exports: [returns_service_1.ReturnsService]
    })
], ReturnsModule);
//# sourceMappingURL=returns.module.js.map