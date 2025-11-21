import { Role } from './role.enum';
export declare class User {
    id: string;
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
}
