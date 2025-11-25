import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.enum';
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
export declare class UsersService {
    private usersRepo;
    constructor(usersRepo: Repository<User>);
    create(data: CreateUserInput): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    update(id: string, data: UpdateUserInput): Promise<User>;
    remove(id: string): Promise<void>;
}
