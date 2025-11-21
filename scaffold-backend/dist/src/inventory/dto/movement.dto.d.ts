import { MovementType } from '../../database/entities/inventory_movement.entity';
export declare class InventoryMovementDto {
    productId: string;
    quantity: number;
    movementType: MovementType;
    referenceId?: string;
    notes?: string;
}
