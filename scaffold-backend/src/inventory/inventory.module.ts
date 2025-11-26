// src/inventory/inventory.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryItem } from '../database/entities/inventory-item.entity';
import { InventoryMovement } from '../database/entities/inventory-movement.entity';
import { InventoryBatch } from '../database/entities/inventory-batch.entity';
import { Product } from '../database/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem, InventoryMovement, InventoryBatch, Product])],
  providers: [InventoryService],
  controllers: [InventoryController],
  exports: [InventoryService],
})
export class InventoryModule {}
