import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  BOTH = 'BOTH'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED'
}

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  entityType: string;

  @Column({ type: 'varchar', length: 36 })
  entityId: string;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.EMAIL })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipientEmail?: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  recipientPhone?: string | null;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Column({ type: 'text', nullable: true })
  payload?: string;

  @Column({ type: 'text', nullable: true })
  resultMessage?: string;

  @CreateDateColumn()
  createdAt: Date;
}
