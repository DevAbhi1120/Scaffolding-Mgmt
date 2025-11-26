import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity({ name: 'safety_checklists' })
export class SafetyChecklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'orderId', type: 'char', length: 36, nullable: true })
  orderId?: string | null;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order?: Order | null;

  @Column({ name: 'submittedBy', type: 'char', length: 36, nullable: true })
  submittedBy?: string | null;

  // full checklist JSON
  @Column({ name: 'checklistData', type: 'json' })
  checklistData: any;

  @Column({ name: 'dateOfCheck', type: 'date' })
  dateOfCheck: Date;

  // array of stored file paths or S3 keys (strings)
  @Column({ name: 'attachments', type: 'json', nullable: true })
  attachments?: string[];

  @Column({ name: 'preserved', type: 'boolean', default: true })
  preserved?: boolean;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;
}
