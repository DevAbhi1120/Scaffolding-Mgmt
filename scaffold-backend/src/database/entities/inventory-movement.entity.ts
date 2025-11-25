// src/database/entities/inventory-movement.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum MovementReason {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ORDER_RESERVE = 'ORDER_RESERVE',
  ORDER_RELEASE = 'ORDER_RELEASE',
  DAMAGE = 'DAMAGE',
  LOSS = 'LOSS',
  MANUAL = 'MANUAL',
}

export enum MovementReferenceType {
  ORDER = 'ORDER',
  JOB = 'JOB',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  ADJUSTMENT = 'ADJUSTMENT',
  SYSTEM = 'SYSTEM',
}

@Entity({ name: 'inventory_movements' })
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.inventoryMovements, {
    eager: true,
  })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product;

  @Column({ name: 'product_id', type: 'char', length: 36 })
  @Index()
  productId: string;

  @Column({
    name: 'inventory_item_id',
    type: 'char',
    length: 36,
    nullable: true,
  })
  inventoryItemId?: string | null;

  @Column({ type: 'int' })
  quantity: number; // +ve for IN, -ve for OUT / ADJUSTMENT

  @Column({
    name: 'movement_type',
    type: 'enum',
    enum: MovementType,
  })
  movementType: MovementType;

  @Column({
    name: 'reason',
    type: 'enum',
    enum: MovementReason,
  })
  reason: MovementReason;

  @Column({
    name: 'reference_type',
    type: 'enum',
    enum: MovementReferenceType,
    nullable: true,
  })
  referenceType?: MovementReferenceType | null;

  @Column({
    name: 'reference_id',
    type: 'char',
    length: 36,
    nullable: true,
  })
  referenceId?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({
    name: 'created_by',
    type: 'char',
    length: 36,
    nullable: true,
  })
  createdBy?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
