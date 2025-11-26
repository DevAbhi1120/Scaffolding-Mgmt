// src/inventory/dto/mark-damaged.dto.ts
import { IsUUID, IsOptional, IsString, IsNumber } from 'class-validator';

export class MarkDamagedDto {
  @IsUUID()
  itemId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  fee?: number;
}
