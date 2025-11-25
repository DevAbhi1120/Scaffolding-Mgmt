// src/database/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
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
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.TEAM_MEMBER,
  })
  role: Role;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'int', default: 1 })
  status: number;
}
