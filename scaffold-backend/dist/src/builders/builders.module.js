"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const builder_entity_1 = require("../database/entities/builder.entity");
const builders_service_1 = require("./builders.service");
const builders_controller_1 = require("./builders.controller");
let BuildersModule = class BuildersModule {
};
exports.BuildersModule = BuildersModule;
exports.BuildersModule = BuildersModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([builder_entity_1.Builder])],
        providers: [builders_service_1.BuildersService],
        controllers: [builders_controller_1.BuildersController],
        exports: [builders_service_1.BuildersService],
    })
], BuildersModule);
//# sourceMappingURL=builders.module.js.map