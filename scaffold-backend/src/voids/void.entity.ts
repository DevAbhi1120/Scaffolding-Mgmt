import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from '../database/entities/order.entity';


export enum VoidType {
    PRE = 'PRE',
    POST = 'POST'
}


export enum VoidStatus {
    OPEN = 'OPEN',
    COMPLETED = 'COMPLETED',
    EXPIRED = 'EXPIRED'
}


@Entity({ name: 'void_protections' })
export class VoidProtection {
    @PrimaryGeneratedColumn('uuid')
    id: string;


    @Column({ type: 'uuid', nullable: true })
    orderId?: string | null;


    @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'orderId' })
    order?: Order | null;


    @Column({ type: 'enum', enum: VoidType })
    type: VoidType;


    @Column({ type: 'varchar', length: 255, nullable: true })
    installer?: string | null;


    @Column({ type: 'date', nullable: true })
    installedOn?: Date | null;


    // For toilets the expiry date (if applicable)
    @Column({ type: 'date', nullable: true })
    expiryDate?: Date | null;


    // free-text specs / notes
    @Column({ type: 'text', nullable: true })
    notes?: string | null;


    // file keys or file IDs registered in files table
    @Column({ type: 'json', nullable: true })
    attachments?: string[];


    @Column({ type: 'enum', enum: VoidStatus, default: VoidStatus.OPEN })
    status: VoidStatus;


    @CreateDateColumn()
    createdAt: Date;
}