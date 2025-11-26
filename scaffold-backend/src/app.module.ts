import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JobsModule } from './jobs/jobs.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';
import { InventoryModule } from './inventory/inventory.module';
import { FilesModule } from './checklists/files/files.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { SwmsModule } from './swms/swms.module';
import { ReportsModule } from './reports/reports.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ExpiryModule } from './expiry/expiry.module';
import { BuildersModule } from './builders/builders.module';
import { AuditService } from './common/audit.service';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnsModule } from './returns/returns.module';
import { ProductTypesModule } from './product-types/product-types.module';
import { AuditLog } from './common/entities/audit-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    JobsModule,
    BuildersModule,
    CategoriesModule,
    ProductTypesModule,
    ProductsModule,
    InventoryModule,
    OrdersModule,
    ChecklistsModule,
    NotificationsModule,
    FilesModule,
    SwmsModule,
    ReportsModule,
    ScheduleModule.forRoot(),
    ExpiryModule,
    TypeOrmModule.forFeature([AuditLog]),
    ReturnsModule,
  ],
  providers: [
    AuditService,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor }
  ],
})
export class AppModule { }
