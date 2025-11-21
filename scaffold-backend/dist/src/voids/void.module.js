"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoidsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const void_entity_1 = require("./void.entity");
const void_service_1 = require("./void.service");
const void_controller_1 = require("./void.controller");
const notifications_module_1 = require("../notifications/notifications.module");
let VoidsModule = class VoidsModule {
};
exports.VoidsModule = VoidsModule;
exports.VoidsModule = VoidsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([void_entity_1.VoidProtection]), notifications_module_1.NotificationsModule],
        providers: [void_service_1.VoidsService],
        controllers: [void_controller_1.VoidsController],
        exports: [void_service_1.VoidsService]
    })
], VoidsModule);
//# sourceMappingURL=void.module.js.map