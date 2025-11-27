import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from './role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude() // ensure passwordHash is not serialized
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.TEAM_MEMBER,
  })
  role: Role;

  @Column({ nullable: true })
  phone?: string;

  @Column({ name: 'profile_image', nullable: true })
  profileImage?: string;

  @Column({ name: 'social_facebook', nullable: true })
  socialFacebook?: string;

  @Column({ name: 'social_x', nullable: true })
  socialX?: string;

  @Column({ name: 'social_linkedin', nullable: true })
  socialLinkedin?: string;

  @Column({ name: 'social_instagram', nullable: true })
  socialInstagram?: string;

  @Column({ name: 'country', nullable: true })
  country?: string;

  @Column({ name: 'city_state', nullable: true })
  cityState?: string;

  @Column({ name: 'postal_code', nullable: true })
  postalCode?: string;

  @Column({ name: 'tax_id', nullable: true })
  taxId?: string;

  @Column({ type: 'int', default: 1 })
  status: number;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 6 })
  updatedAt: Date;
}
