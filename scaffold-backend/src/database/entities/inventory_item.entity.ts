import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { Product } from './product.entity';
import { Order } from './order.entity';

export enum InventoryStatus {
  IN_STORE = 'IN_STORE',
  ASSIGNED = 'ASSIGNED',
  DAMAGED = 'DAMAGED',
  LOST = 'LOST',
  BROKEN = 'BROKEN',
  OUT_FOR_REPAIR = 'OUT_FOR_REPAIR'
}

@Entity({ name: 'inventory_items' })
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  productId: string;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'productId' })
  product?: Product | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  serialNumber?: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  siteAddress?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  codeNo?: string | null;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date | null;

  @Column({ type: 'enum', enum: InventoryStatus, default: InventoryStatus.IN_STORE })
  status: InventoryStatus;

  @Column({ type: 'uuid', nullable: true })
  assignedToOrderId?: string | null;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedToOrderId' })
  assignedToOrder?: Order | null;

  // Lost/damaged tracking
  @Column({ type: 'varchar', length: 50, nullable: true })
  condition?: string | null; // e.g., 'OK' | 'DAMAGED' | 'LOST' | 'REPAIRED'

  @Column({ type: 'timestamp', nullable: true })
  damagedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  damageNotes?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  damageFee?: number | null;

  @Column({ type: 'timestamp', nullable: true })
  lostAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  lostNotes?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  lostFee?: number | null;

  @Column({ type: 'json', nullable: true })
  extra?: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
