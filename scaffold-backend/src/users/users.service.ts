// src/users/users.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.enum';
import * as bcrypt from 'bcrypt';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
  phone?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  phone?: string;
  status?: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) { }

  async create(data: CreateUserInput) {
    if (!data.password) {
      throw new BadRequestException('Password is required');
    }

    if (!PASSWORD_REGEX.test(data.password)) {
      throw new BadRequestException(
        'Password must be 8+ chars and include uppercase, lowercase, number and special character',
      );
    }

    if (!data.email) {
      throw new BadRequestException('Email is required');
    }

    const existing = await this.usersRepo.findOne({
      where: { email: data.email },
    });

    if (existing) {
      throw new BadRequestException('Email is already in use');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = this.usersRepo.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role ?? Role.TEAM_MEMBER,
      phone: data.phone,
      // status defaults are handled in the entity (see below)
    });

    return await this.usersRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepo.find();
  }

  // 👇 ID is string, not number
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    const user = await this.findOne(id);

    // email change & uniqueness check
    if (data.email && data.email !== user.email) {
      const existing = await this.usersRepo.findOne({
        where: { email: data.email },
      });
      if (existing) {
        throw new BadRequestException('Email is already in use');
      }
      user.email = data.email;
    }

    // password change
    if (data.password) {
      if (!PASSWORD_REGEX.test(data.password)) {
        throw new BadRequestException(
          'Password must be 8+ chars and include uppercase, lowercase, number and special character',
        );
      }
      user.passwordHash = await bcrypt.hash(data.password, 10);
    }

    if (typeof data.name === 'string') user.name = data.name;
    if (typeof data.role !== 'undefined') user.role = data.role;
    if (typeof data.phone === 'string') user.phone = data.phone;

    if (typeof data.status === 'number') {
      // Requires status field on entity (see below)
      (user as any).status = data.status;
    }

    return this.usersRepo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepo.remove(user);
  }
}
