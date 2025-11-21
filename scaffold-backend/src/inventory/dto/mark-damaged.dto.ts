import { IsUUID, IsOptional, IsNumber, IsString, Min } from 'class-validator';

export class MarkDamagedDto {
  @IsUUID()
  itemId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number; // damage fee to charge
}
