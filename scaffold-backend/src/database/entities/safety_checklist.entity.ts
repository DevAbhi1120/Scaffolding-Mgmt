import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity({ name: 'safety_checklists' })
export class SafetyChecklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  orderId?: string | null;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order?: Order | null;

  @Column({ type: 'uuid', nullable: true })
  submittedBy?: string | null;

  // Store full checklist form as JSON
  @Column({ type: 'json' })
  checklistData: any;

  // ISO date string for the date the checklist was completed
  @Column({ type: 'date' })
  dateOfCheck: Date;

  // file keys from FilesModule (array of S3 keys)
  @Column({ type: 'json', nullable: true })
  attachments?: string[];

  // preserve after job completion
  @Column({ type: 'boolean', default: true })
  preserved?: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
