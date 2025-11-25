// src/database/entities/inventory_item.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { Order } from './order.entity';

export enum InventoryStatus {
  IN_STORE = 'IN_STORE',
  ASSIGNED = 'ASSIGNED',
  BROKEN = 'BROKEN',
  OUT_FOR_REPAIR = 'OUT_FOR_REPAIR',
}

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'varchar', length: 255, nullable: true })
  serialNumber?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  siteAddress?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  codeNo?: string | null;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date | null;

  @Column({
    type: 'enum',
    enum: InventoryStatus,
    default: InventoryStatus.IN_STORE,
  })
  status: InventoryStatus;

  @Column({ type: 'uuid', nullable: true })
  assignedToOrderId?: string | null;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'assignedToOrderId' })
  assignedToOrder?: Order | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  condition?: string | null; // e.g. 'OK','DAMAGED','LOST'

  @Column({ type: 'datetime', nullable: true })
  damagedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  damageNotes?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  damageFee?: number | null;

  @Column({ type: 'datetime', nullable: true })
  lostAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  lostNotes?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  lostFee?: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date | null;
}
