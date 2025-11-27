import { CreateUserDto } from './create-user.dto';
import { Role } from '../../database/entities/role.enum';
declare const UpdateUserDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateUserDto>>;
export declare class UpdateUserDto extends UpdateUserDto_base {
    role?: Role;
    status?: number;
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
export {};
