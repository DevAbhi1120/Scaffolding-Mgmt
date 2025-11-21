"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwmsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const swms_entity_1 = require("../database/entities/swms.entity");
const swms_service_1 = require("./swms.service");
const swms_controller_1 = require("./swms.controller");
const notifications_module_1 = require("../notifications/notifications.module");
let SwmsModule = class SwmsModule {
};
exports.SwmsModule = SwmsModule;
exports.SwmsModule = SwmsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([swms_entity_1.Swms]), notifications_module_1.NotificationsModule],
        providers: [swms_service_1.SwmsService],
        controllers: [swms_controller_1.SwmsController],
        exports: [swms_service_1.SwmsService]
    })
], SwmsModule);
//# sourceMappingURL=swms.module.js.map