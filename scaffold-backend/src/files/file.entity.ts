// src/files/file.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'files' })
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * All file locations for this entity, e.g.:
   * ["uploads/products/2025-11-24/uuid1.jpg", "uploads/products/2025-11-24/uuid2.jpg"]
   */
  @Column({ type: 'json', nullable: false, default: '[]' })
  keys: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  relatedEntityType?: string | null; // e.g. PRODUCT, CATEGORY

  @Column({ type: 'varchar', length: 36, nullable: true })
  relatedEntityId?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  uploadedBy?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
