// src/products/dto/create-product.dto.ts
import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsUUID()
  categoryId: string;

  @IsUUID()
  productTypeId: string;

  @IsString()
  name: string;

  @IsString()
  unit: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @Type(() => Number)
  @IsInt()
  status: number; // 1 = active, 0 = inactive

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  extra?: any;
}
