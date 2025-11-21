import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  async create(data: Partial<User>) {
    const salt = await bcrypt.genSalt();
    const pw = await bcrypt.hash(data.passwordHash as string, salt);
    const user = this.usersRepo.create({ ...data, passwordHash: pw });
    return this.usersRepo.save(user);
  }

  async findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  // add update, delete, list with pagination...
}
