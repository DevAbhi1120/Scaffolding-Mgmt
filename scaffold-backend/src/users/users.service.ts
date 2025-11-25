// src/users/users.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) { }

  async create(data: {
    name: string;
    email: string;
    password: string;
    role?: Role;  // ← Use the enum, not string
  }) {
    if (!data.password) {
      throw new BadRequestException('Password is required');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = this.usersRepo.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role ?? Role.TEAM_MEMBER,
    });

    return await this.usersRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepo.find();
  }
}