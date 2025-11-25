import { IsString, IsEmail, IsPhoneNumber, IsOptional, IsObject } from 'class-validator';

export class CreateBuilderDto {
  @IsString()
  businessName: string;

  @IsOptional()
  @IsString()
  businessAddress?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsPhoneNumber()
  contactPhone?: string;

  @IsOptional()
  @IsObject()
  config?: any;
}