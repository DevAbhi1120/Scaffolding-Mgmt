import { IsUUID, IsInt, Min, IsOptional, IsArray, ArrayNotEmpty } from 'class-validator';

export class AssignItemsDto {
  @IsUUID()
  productId: string;

  @IsUUID()
  orderId: string;

  // If per-item serials provided, list them; otherwise quantity will be used
  @IsOptional()
  @IsArray()
  serialNumbers?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
