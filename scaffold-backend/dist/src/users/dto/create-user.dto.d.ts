import { Role } from '../../database/entities/role.enum';
export declare class CreateUserDto {
    name: string;
    email: string;
    password: string;
    role?: Role;
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
}
