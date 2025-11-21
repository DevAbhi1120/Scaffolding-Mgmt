"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("./entities/user.entity");
const product_entity_1 = require("./entities/product.entity");
const category_entity_1 = require("./entities/category.entity");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (cfg) => ({
                    type: 'mysql',
                    host: cfg.get('db.host'),
                    port: +cfg.get('db.port'),
                    username: cfg.get('db.username'),
                    password: cfg.get('db.password'),
                    database: cfg.get('db.database'),
                    entities: [user_entity_1.User, product_entity_1.Product, category_entity_1.Category, __dirname + '/entities/*.ts'],
                    synchronize: false
                }),
                inject: [config_1.ConfigService]
            }),
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, product_entity_1.Product, category_entity_1.Category])
        ],
        exports: [typeorm_1.TypeOrmModule]
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map