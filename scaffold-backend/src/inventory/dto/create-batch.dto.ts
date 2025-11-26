// src/inventory/dto/create-batch.dto.ts
import { IsUUID, IsInt, Min, IsOptional, IsEnum } from 'class-validator';

export class CreateBatchDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsEnum(['SYSTEM','PURCHASE','ORDER'])
  referenceType?: 'SYSTEM' | 'PURCHASE' | 'ORDER';

  @IsOptional()
  @IsUUID()
  referenceId?: string;
}
