import { Role } from './role.enum';
export declare class User {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
    phone?: string;
    profileImage?: string;
    socialFacebook?: string;
    socialX?: string;
    socialLinkedin?: string;
    socialInstagram?: string;
    country?: string;
    cityState?: string;
    postalCode?: string;
    taxId?: string;
    status: number;
    createdAt: Date;
    updatedAt: Date;
}
