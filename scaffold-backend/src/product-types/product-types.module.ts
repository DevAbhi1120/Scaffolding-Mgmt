// src/product-types/product-types.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ProductType } from '../database/entities/product-type.entity';
import { ProductTypesService } from './product-types.service';
import { ProductTypesController } from './product-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductType]), ConfigModule],
  providers: [ProductTypesService],
  controllers: [ProductTypesController],
  exports: [ProductTypesService],
})
export class ProductTypesModule {}
