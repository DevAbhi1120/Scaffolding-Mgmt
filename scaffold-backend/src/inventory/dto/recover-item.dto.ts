import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RecoverItemDto {
  @IsUUID()
  itemId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  orderId?: string;
}
