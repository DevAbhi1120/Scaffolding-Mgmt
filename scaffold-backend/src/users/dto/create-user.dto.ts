import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum, Matches, MinLength } from 'class-validator';
import { Role } from '../../database/entities/role.enum';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    @Matches(PASSWORD_REGEX, { message: 'Password must be 8+ chars and include uppercase, lowercase, number and special character' })
    password: string;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @IsOptional()
    @IsString()
    phone?: string;

    // optional profile/social/address fields for creation
    @IsOptional() @IsString() profileImage?: string;
    @IsOptional() @IsString() socialFacebook?: string;
    @IsOptional() @IsString() socialX?: string;
    @IsOptional() @IsString() socialLinkedin?: string;
    @IsOptional() @IsString() socialInstagram?: string;

    @IsOptional() @IsString() country?: string;
    @IsOptional() @IsString() cityState?: string;
    @IsOptional() @IsString() postalCode?: string;
    @IsOptional() @IsString() taxId?: string;
}
