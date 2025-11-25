// src/inventory/dto/create-inventory-from-form.dto.ts
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateInventoryFromFormDto {
    @IsUUID()
    product_id: string;

    @IsInt()
    @Min(0)
    opening_stock: number;

    @IsInt()
    @Min(0)
    stock_in: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    stock_out?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    missing?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    damaged?: number;
}
