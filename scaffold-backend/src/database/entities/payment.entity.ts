import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  CHEQUE = 'CHEQUE',
  OTHER = 'OTHER'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED'
}

@Entity({ name: 'payments' })
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // link to invoice or builder (in case payment is not invoice-specific)
  @Column({ type: 'uuid', nullable: true })
  invoiceId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  builderId?: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.BANK_TRANSFER })
  method: PaymentMethod;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference?: string | null; // txn ID / cheque no

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.COMPLETED })
  status: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // audit: who recorded the payment
  @Column({ type: 'varchar', length: 36, nullable: true })
  recordedBy?: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
