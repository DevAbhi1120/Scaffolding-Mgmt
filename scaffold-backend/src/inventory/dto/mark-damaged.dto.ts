import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

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
