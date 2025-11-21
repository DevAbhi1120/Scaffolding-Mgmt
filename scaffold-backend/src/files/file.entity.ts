// src/files/file.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'files' })
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // storage key (S3/local) — using Version B's constraints
  @Column({ type: 'varchar', length: 512, unique: true })
  key: string;

  // main filename (required)
  @Column({ type: 'varchar', length: 255 })
  filename: string;

  // optional original client filename (from Version A)
  @Column({ type: 'varchar', length: 255, nullable: true })
  originalName?: string | null;

  // unified MIME type field (merging mimeType/contentType)
  @Column({ type: 'varchar', length: 150, nullable: true })
  mimeType?: string | null;

  @Column({ type: 'bigint', nullable: true })
  size?: number | null;

  // merged association naming strategy:
  // we keep Version B names (related*) but add compatibility fields
  @Column({ type: 'varchar', length: 100, nullable: true })
  relatedEntityType?: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  relatedEntityId?: string | null;

  // optional field (kept from Version B)
  @Column({ type: 'varchar', length: 100, nullable: true })
  uploadedBy?: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
