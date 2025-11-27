import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity({ name: 'swms' })
export class Swms {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  orderId?: string | null;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order?: Order | null;

  @Column({ type: 'uuid', nullable: true })
  submittedBy?: string | null;

  @Column({ type: 'json' })
  swmsData: any;

  @Column({ type: 'json' })
  highRiskTasks: any[];

  @Column({ type: 'json', nullable: true })
  attachments?: string[];

  @Column({ type: 'boolean', default: true })
  editableByAdmin?: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
