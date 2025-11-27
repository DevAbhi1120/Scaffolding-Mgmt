import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Role } from '../../database/entities/role.enum';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @IsOptional()
    status?: number;

    // file uploads handled in controller; these string fields can be set when not uploading
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
