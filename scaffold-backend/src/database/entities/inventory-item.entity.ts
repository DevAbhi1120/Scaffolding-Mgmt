// src/database/entities/inventory-item.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

export enum InventoryStatus {
    IN_STORE = 'IN_STORE',
    ASSIGNED = 'ASSIGNED',
    DAMAGED = 'DAMAGED',
    LOST = 'LOST',
    BROKEN = 'BROKEN',
}

export enum InventoryCondition {
    GOOD = 'GOOD',
    DAMAGED = 'DAMAGED',
    LOST = 'LOST',
    REPAIRED = 'REPAIRED',
}

@Entity({ name: 'inventory_items' })
export class InventoryItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Product, (product) => product.inventoryItems, {
        eager: true,
    })
    @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
    product: Product;

    @Column({ name: 'product_id', type: 'char', length: 36 })
    @Index()
    productId: string;

    @Column({ name: 'serial_number', type: 'varchar', length: 200, nullable: true })
    serialNumber?: string | null;

    @Column({
        name: 'status',
        type: 'enum',
        enum: InventoryStatus,
        default: InventoryStatus.IN_STORE,
    })
    status: InventoryStatus;

    @Column({
        name: 'condition',
        type: 'enum',
        enum: InventoryCondition,
        default: InventoryCondition.GOOD,
        nullable: true,
    })
    condition: InventoryCondition;

    @Column({ name: 'damaged_at', type: 'date', nullable: true })
    damagedAt?: Date | null;

    @Column({ name: 'damage_notes', type: 'text', nullable: true })
    damageNotes?: string | null;

    @Column({ name: 'damage_fee', type: 'decimal', precision: 10, scale: 2, nullable: true })
    damageFee?: string | null;

    @Column({ name: 'lost_at', type: 'date', nullable: true })
    lostAt?: Date | null;

    @Column({ name: 'lost_notes', type: 'text', nullable: true })
    lostNotes?: string | null;

    @Column({ name: 'lost_fee', type: 'decimal', precision: 10, scale: 2, nullable: true })
    lostFee?: string | null;

    @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt?: Date | null;

    @Column({ name: 'assigned_to_order_id', type: 'char', length: 36, nullable: true })
    assignedToOrderId?: string | null;

    @Column({ name: 'site_address', type: 'varchar', length: 300, nullable: true })
    siteAddress?: string | null;

    @Column({ name: 'code_no', type: 'varchar', length: 100, nullable: true })
    codeNo?: string | null;

    @Column({ name: 'expiry_date', type: 'date', nullable: true })
    expiryDate?: Date | null;

    @Column({ name: 'extra', type: 'json', nullable: true })
    extra?: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
