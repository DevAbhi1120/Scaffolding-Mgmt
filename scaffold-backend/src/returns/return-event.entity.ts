import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InventoryItem } from '../database/entities/inventory-item.entity';
import { Order } from '../database/entities/order.entity';

@Entity({ name: 'return_events' })
export class ReturnEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  orderId?: string | null;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order?: Order | null;

  @Column({ type: 'uuid' })
  itemId: string;

  @ManyToOne(() => InventoryItem, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: InventoryItem;

  @Column({ type: 'uuid', nullable: true })
  returnedBy?: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  returnedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;
}
