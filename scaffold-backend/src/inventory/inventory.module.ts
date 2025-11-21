import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItem } from '../database/entities/inventory_item.entity';
import { InventoryMovement } from '../database/entities/inventory_movement.entity';
import { Product } from '../database/entities/product.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryItem, InventoryMovement, Product]),
    BillingModule
  ],
  providers: [InventoryService],
  controllers: [InventoryController],
  exports: [InventoryService]
})
export class InventoryModule { }