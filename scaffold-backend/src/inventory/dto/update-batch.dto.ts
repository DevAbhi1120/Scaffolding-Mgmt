// src/inventory/dto/update-batch.dto.ts
import { IsOptional, IsInt, Min, IsEnum, IsUUID } from 'class-validator';

export class UpdateBatchDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsEnum(['IN_STORE','RESERVED','CONSUMED','DAMAGED'])
  status?: 'IN_STORE' | 'RESERVED' | 'CONSUMED' | 'DAMAGED';

  @IsOptional()
  @IsEnum(['SYSTEM','PURCHASE','ORDER'])
  referenceType?: 'SYSTEM' | 'PURCHASE' | 'ORDER';

  @IsOptional()
  @IsUUID()
  referenceId?: string | null;
}
