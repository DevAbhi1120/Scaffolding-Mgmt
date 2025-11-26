// src/inventory/dto/mark-lost.dto.ts
import { IsUUID, IsOptional, IsString, IsNumber } from 'class-validator';

export class MarkLostDto {
  @IsUUID()
  itemId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  fee?: number;
}
