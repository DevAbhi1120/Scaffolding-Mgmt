import { IsUUID, IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { InventoryStatus } from '../../database/entities/inventory_item.entity';

export class CreateInventoryItemDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;

  @IsOptional()
  @IsString()
  siteAddress?: string;

  @IsOptional()
  @IsString()
  codeNo?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  extra?: any;
}
