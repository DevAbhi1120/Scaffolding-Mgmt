import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Category } from './category.entity';
import { ProductType } from './product-type.entity';
import { InventoryItem } from './inventory-item.entity';
import { InventoryMovement } from './inventory-movement.entity';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(
    () => InventoryItem,
    (inventoryItem: InventoryItem) => inventoryItem.product,
  )
  inventoryItems: InventoryItem[];

  @OneToMany(
    () => InventoryMovement,
    (inventoryMovement: InventoryMovement) => inventoryMovement.product,
  )
  inventoryMovements: InventoryMovement[];

  @ManyToOne(() => Category, (c) => c.products, { eager: true })
  category: Category;

  @Column({ type: 'varchar', length: 36 })
  categoryId: string;

  @ManyToOne(() => ProductType, { eager: true })
  productType: ProductType;

  @Column({ type: 'varchar', length: 36 })
  productTypeId: string;

  @Index()
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku?: string;

  @Column({ type: 'varchar', length: 50 })
  unit: string;

  @Column({ type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  extra?: any;

  // store all image URLs here as an array
  @Column({ type: 'json', nullable: true })
  images?: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
