import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private usersRepo;
    constructor(usersRepo: Repository<User>);
    private sanitize;
    create(data: CreateUserDto): Promise<any>;
    findByEmail(email: string): Promise<User | null>;
    findAll(): Promise<any[]>;
    findOne(id: string): Promise<any>;
    update(id: string, data: UpdateUserDto & {
        profileImageFile?: string;
    }): Promise<any>;
    remove(id: string): Promise<void>;
}
