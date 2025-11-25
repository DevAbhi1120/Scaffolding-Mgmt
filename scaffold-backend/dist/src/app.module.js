"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const configuration_1 = require("./config/configuration");
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const jobs_module_1 = require("./jobs/jobs.module");
const products_module_1 = require("./products/products.module");
const categories_module_1 = require("./categories/categories.module");
const orders_module_1 = require("./orders/orders.module");
const inventory_module_1 = require("./inventory/inventory.module");
const files_module_1 = require("./files/files.module");
const notifications_module_1 = require("./notifications/notifications.module");
const checklists_module_1 = require("./checklists/checklists.module");
const swms_module_1 = require("./swms/swms.module");
const reports_module_1 = require("./reports/reports.module");
const schedule_1 = require("@nestjs/schedule");
const expiry_module_1 = require("./expiry/expiry.module");
const builders_module_1 = require("./builders/builders.module");
const audit_service_1 = require("./common/audit.service");
const audit_interceptor_1 = require("./common/interceptors/audit.interceptor");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const returns_module_1 = require("./returns/returns.module");
const audit_log_entity_1 = require("./common/entities/audit-log.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [configuration_1.default] }),
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            jobs_module_1.JobsModule,
            builders_module_1.BuildersModule,
            categories_module_1.CategoriesModule,
            products_module_1.ProductsModule,
            orders_module_1.OrdersModule,
            inventory_module_1.InventoryModule,
            files_module_1.FilesModule,
            notifications_module_1.NotificationsModule,
            checklists_module_1.ChecklistsModule,
            swms_module_1.SwmsModule,
            reports_module_1.ReportsModule,
            schedule_1.ScheduleModule.forRoot(),
            expiry_module_1.ExpiryModule,
            typeorm_1.TypeOrmModule.forFeature([audit_log_entity_1.AuditLog]),
            returns_module_1.ReturnsModule,
        ],
        providers: [
            audit_service_1.AuditService,
            { provide: core_1.APP_INTERCEPTOR, useClass: audit_interceptor_1.AuditInterceptor }
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map