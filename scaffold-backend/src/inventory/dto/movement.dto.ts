import { IsUUID, IsInt, Min, IsEnum, IsOptional, IsString } from 'class-validator';
import { MovementType } from '../../database/entities/inventory_movement.entity';

export class InventoryMovementDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsEnum(MovementType)
  movementType: MovementType;

  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
