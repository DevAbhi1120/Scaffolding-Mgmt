import { IsUUID, IsOptional, IsString } from 'class-validator';

export class RecoverItemDto {
  @IsUUID()
  itemId: string;

  @IsOptional()
  @IsString()
  notes?: string; // note about recovery/repair
}
