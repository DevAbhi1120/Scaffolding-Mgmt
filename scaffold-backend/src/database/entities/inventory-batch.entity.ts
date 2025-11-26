// src/database/entities/inventory-batch.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum InventoryBatchStatus {
    IN_STORE = 'IN_STORE',
    RESERVED = 'RESERVED',
    CONSUMED = 'CONSUMED',
    DAMAGED = 'DAMAGED',
}

@Entity({ name: 'inventory_batches' })
export class InventoryBatch {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'product_id', type: 'char', length: 36 })
    product_id: string;


    @Column({ type: 'int', default: 0 })
    quantity: number;

    @Column({ name: 'status', type: 'enum', enum: InventoryBatchStatus, default: InventoryBatchStatus.IN_STORE })
    status: InventoryBatchStatus;

    @Column({ name: 'reference_type', type: 'enum', enum: ['SYSTEM', 'PURCHASE', 'ORDER'], nullable: true })
    referenceType?: 'SYSTEM' | 'PURCHASE' | 'ORDER';

    @Column({ name: 'reference_id', type: 'char', length: 36, nullable: true })
    referenceId?: string | null;

    @Column({ name: 'meta', type: 'json', nullable: true })
    meta?: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
