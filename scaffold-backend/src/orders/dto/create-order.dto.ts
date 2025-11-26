// src/orders/dto/create-order.dto.ts
import {
  IsOptional,
  IsUUID,
  IsDateString,
  IsArray,
  ArrayMinSize,
  IsNumber,
  Min,
  IsString,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MaxDecimalPlaces } from '../../utils/validators/max-decimal-places';

export class CreateOrderItemDto {
  @IsUUID()
  productId: string;

  // Use transform: true in ValidationPipe so incoming strings are converted
  @IsNumber()
  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @MaxDecimalPlaces(2)
  unitPrice?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serialNumbers?: string[];
}

export class CreateOrderDto {
  @IsOptional()
  @IsUUID()
  builderId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  closeDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
