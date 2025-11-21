import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  entity: string; // e.g. 'orders', 'inventory_items'

  @Column({ type: 'varchar', length: 36, nullable: true })
  entityId?: string;

  @Column({ type: 'varchar', length: 100 })
  action: 'CREATE' | 'UPDATE' | 'DELETE';

  @Column({ type: 'varchar', length: 36, nullable: true })
  performedBy?: string;

  @Column({ type: 'json', nullable: true })
  before?: any;

  @Column({ type: 'json', nullable: true })
  after?: any;

  @CreateDateColumn()
  createdAt: Date;
}
