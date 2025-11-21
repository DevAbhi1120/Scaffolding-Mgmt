import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnEvent } from './return-event.entity';
import { InventoryItem } from '../database/entities/inventory_item.entity';
import { ReturnsService } from './returns.service';
import { ReturnsController } from './returns.controller';
import { BillingModule } from '../billing/billing.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReturnEvent, InventoryItem]),
    forwardRef(() => BillingModule),
    NotificationsModule
  ],
  providers: [ReturnsService],
  controllers: [ReturnsController],
  exports: [ReturnsService]
})
export class ReturnsModule {}
