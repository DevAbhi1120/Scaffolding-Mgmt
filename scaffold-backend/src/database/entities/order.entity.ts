// src/database/entities/order.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // builder/customer id (nullable for now)
  @Column({ type: 'varchar', length: 36, nullable: true })
  builderId?: string | null;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.DRAFT })
  @Index() // index status for common queries
  status: OrderStatus;

  @Column({ type: 'date', nullable: true })
  startDate?: Date | null;

  @Column({ type: 'date', nullable: true })
  closeDate?: Date | null;

  @Column({ type: 'date', nullable: true })
  extendedUntil?: Date | null;

  // NEW: notes field
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @OneToMany(() => OrderItem, (oi) => oi.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
