import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ExpiryService } from './expiry.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoidProtection } from '../voids/void.entity';
import { InventoryItem } from '../database/entities/inventory_item.entity';

@Module({
  imports: [ScheduleModule.forRoot(), NotificationsModule, TypeOrmModule.forFeature([VoidProtection, InventoryItem])],
  providers: [ExpiryService],
  exports: [ExpiryService]
})
export class ExpiryModule {}
