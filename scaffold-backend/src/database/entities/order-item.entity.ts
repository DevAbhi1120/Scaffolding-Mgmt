// src/database/entities/order-item.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { Order } from './order.entity';
import { DecimalTransformer } from './decimal-transformer';

@Entity({ name: 'order_items' })
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  orderId: string;

  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'varchar', length: 36 })
  productId: string;

  // Avoid eager loading product by default to reduce heavy joins; join when you need it
  @ManyToOne(() => Product, { eager: false })
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  // Optionally the client can pass serial numbers assigned for this line
  @Column({ type: 'json', nullable: true })
  serialNumbers?: string[] | null;

  // unit price stored as decimal but transformed to number in TS
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: DecimalTransformer,
  })
  unitPrice?: number | null;

  // NEW: description
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
