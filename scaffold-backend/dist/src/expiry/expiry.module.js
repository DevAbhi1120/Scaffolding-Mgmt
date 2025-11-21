"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpiryModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const expiry_service_1 = require("./expiry.service");
const notifications_module_1 = require("../notifications/notifications.module");
const typeorm_1 = require("@nestjs/typeorm");
const void_entity_1 = require("../voids/void.entity");
const inventory_item_entity_1 = require("../database/entities/inventory_item.entity");
let ExpiryModule = class ExpiryModule {
};
exports.ExpiryModule = ExpiryModule;
exports.ExpiryModule = ExpiryModule = __decorate([
    (0, common_1.Module)({
        imports: [schedule_1.ScheduleModule.forRoot(), notifications_module_1.NotificationsModule, typeorm_1.TypeOrmModule.forFeature([void_entity_1.VoidProtection, inventory_item_entity_1.InventoryItem])],
        providers: [expiry_service_1.ExpiryService],
        exports: [expiry_service_1.ExpiryService]
    })
], ExpiryModule);
//# sourceMappingURL=expiry.module.js.map