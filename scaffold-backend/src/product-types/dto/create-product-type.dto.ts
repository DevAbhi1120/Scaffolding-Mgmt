// src/product-types/dto/create-product-type.dto.ts
import { IsString, IsOptional, Length } from 'class-validator';

export class CreateProductTypeDto {
  @IsString()
  @Length(1, 150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
