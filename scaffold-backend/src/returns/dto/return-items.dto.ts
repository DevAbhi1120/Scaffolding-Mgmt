import { IsArray, ArrayMinSize, IsUUID, IsOptional, IsString } from 'class-validator';

export class ReturnItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  itemIds: string[];

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
