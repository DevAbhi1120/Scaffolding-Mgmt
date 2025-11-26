// src/inventory/dto/create-inventory-from-form.dto.ts
import { IsUUID, IsInt, Min, IsOptional, IsArray, IsString } from 'class-validator';

export class CreateInventoryFromFormDto {
  @IsUUID()
  product_id: string;

  @IsInt()
  @Min(0)
  opening_stock: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  stock_in?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  stock_out?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  missing?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  damaged?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serialNumbers?: string[];
}
