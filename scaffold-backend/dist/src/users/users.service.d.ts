import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.enum';
export declare class UsersService {
    private usersRepo;
    constructor(usersRepo: Repository<User>);
    create(data: {
        name: string;
        email: string;
        password: string;
        role?: Role;
    }): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findAll(): Promise<User[]>;
}
