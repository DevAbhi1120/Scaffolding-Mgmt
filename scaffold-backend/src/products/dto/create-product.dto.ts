import { IsString, IsOptional, IsUUID, IsEnum, IsNumber, IsNumberString } from 'class-validator';
import { ProductType } from '../../database/entities/product-type.enum';

export class CreateProductDto {
  @IsUUID()
  categoryId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  defaultCost?: number;

  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;

  @IsOptional()
  extra?: any;
}
