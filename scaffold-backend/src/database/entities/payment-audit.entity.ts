import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'payment_audits' })
export class PaymentAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  paymentId: string;

  @Column({ type: 'text' })
  oldValue: string;

  @Column({ type: 'text', nullable: true })
  newValue?: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  changedBy?: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
