import { IsUUID, IsOptional, IsNumber, IsString, Min } from 'class-validator';

export class MarkLostDto {
  @IsUUID()
  itemId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number; // lost fee to charge
}
