import { IsOptional, IsUUID, IsEnum, IsDateString, IsArray, IsString } from 'class-validator';
import { VoidType } from '../void.entity';


export class CreateVoidDto {
    @IsOptional()
    @IsUUID()
    orderId?: string;


    @IsEnum(VoidType)
    type: VoidType;


    @IsOptional()
    @IsString()
    installer?: string;


    @IsOptional()
    @IsDateString()
    installedOn?: string;


    @IsOptional()
    @IsDateString()
    expiryDate?: string;


    @IsOptional()
    @IsString()
    notes?: string;


    @IsOptional()
    @IsArray()
    attachments?: string[];
}