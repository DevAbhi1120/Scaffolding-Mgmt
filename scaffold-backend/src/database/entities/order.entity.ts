import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // builder/customer id (nullable for now)
  @Column({ type: 'uuid', nullable: true })
  builderId?: string | null;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.OPEN })
  status: OrderStatus;

  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @Column({ type: 'date', nullable: true })
  closeDate?: Date;

  @Column({ type: 'date', nullable: true })
  extendedUntil?: Date | null;

  // NEW: notes field
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @OneToMany(() => OrderItem, (oi) => oi.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
