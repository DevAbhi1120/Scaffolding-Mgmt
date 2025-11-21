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

  // Main SWMS header / meta as JSON
  @Column({ type: 'json' })
  swmsData: any;

  // High Risk Construction Work Detail — store each selection as full row object
  @Column({ type: 'json' })
  highRiskTasks: any[];

  // file keys from FilesModule (array of S3 keys or file IDs)
  @Column({ type: 'json', nullable: true })
  attachments?: string[];

  // Admin can edit always
  @Column({ type: 'boolean', default: true })
  editableByAdmin?: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
