import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

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
