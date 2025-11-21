import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from '../database/entities/order.entity';

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

  // full checklist JSON payload (form answers)
  @Column({ type: 'json' })
  checklistData: any;

  // date the check was carried out (ISO date)
  @Column({ type: 'date' })
  dateOfCheck: Date;

  // file keys or file IDs from FilesModule
  @Column({ type: 'json', nullable: true })
  attachments?: string[];

  // preserve even after job completion
  @Column({ type: 'boolean', default: true })
  preserved?: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
