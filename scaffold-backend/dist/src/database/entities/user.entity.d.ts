import { Role } from './role.enum';
export declare class User {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
    phone?: string;
    status: number;
}
