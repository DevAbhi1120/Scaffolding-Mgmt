import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.enum';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  private sanitize(user: User) {
    if (!user) return user;
    const { passwordHash, ...rest } = user as any;
    return rest;
  }

  async create(data: CreateUserDto) {
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

    const existing = await this.usersRepo.findOne({ where: { email: data.email } });
    if (existing) throw new BadRequestException('Email is already in use');

    const passwordHash = await bcrypt.hash(data.password, parseInt(process.env.SALT_ROUNDS || '10', 10));

    const user = this.usersRepo.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role ?? Role.TEAM_MEMBER,
      phone: data.phone,
      profileImage: data.profileImage,
      socialFacebook: data.socialFacebook,
      socialX: data.socialX,
      socialLinkedin: data.socialLinkedin,
      socialInstagram: data.socialInstagram,
      country: data.country,
      cityState: data.cityState,
      postalCode: data.postalCode,
      taxId: data.taxId,
    });

    const saved = await this.usersRepo.save(user);
    return this.sanitize(saved);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findAll(): Promise<any[]> {
    const users = await this.usersRepo.find();
    return users.map(u => this.sanitize(u));
  }

  async findOne(id: string): Promise<any> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return this.sanitize(user);
  }

  async update(id: string, data: UpdateUserDto & { profileImageFile?: string }): Promise<any> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    // email change & uniqueness check
    if (data.email && data.email !== user.email) {
      const existing = await this.usersRepo.findOne({ where: { email: data.email } });
      if (existing) throw new BadRequestException('Email is already in use');
      user.email = data.email;
    }

    // password change
    if ((data as any).password) {
      if (!PASSWORD_REGEX.test((data as any).password)) {
        throw new BadRequestException(
          'Password must be 8+ chars and include uppercase, lowercase, number and special character',
        );
      }
      user.passwordHash = await bcrypt.hash((data as any).password, parseInt(process.env.SALT_ROUNDS || '10', 10));
    }

    if (typeof data.name === 'string') user.name = data.name;
    if (typeof data.role !== 'undefined') user.role = data.role;
    if (typeof data.phone === 'string') user.phone = data.phone;

    // profile image: allow a filename or path provided by controller after saving file
    if (typeof data.profileImage === 'string') user.profileImage = data.profileImage;
    // if controller writes profileImageFile (filename) to data
    if ((data as any).profileImageFile) user.profileImage = (data as any).profileImageFile;

    // social links
    if (typeof data.socialFacebook === 'string') user.socialFacebook = data.socialFacebook;
    if (typeof data.socialX === 'string') user.socialX = data.socialX;
    if (typeof data.socialLinkedin === 'string') user.socialLinkedin = data.socialLinkedin;
    if (typeof data.socialInstagram === 'string') user.socialInstagram = data.socialInstagram;

    // address
    if (typeof data.country === 'string') user.country = data.country;
    if (typeof data.cityState === 'string') user.cityState = data.cityState;
    if (typeof data.postalCode === 'string') user.postalCode = data.postalCode;
    if (typeof data.taxId === 'string') user.taxId = data.taxId;

    if (typeof data.status === 'number') user.status = data.status;

    const saved = await this.usersRepo.save(user);
    return this.sanitize(saved);
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepo.remove(user);
  }
}
