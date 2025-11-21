import { IsUUID, IsNumber, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '../../database/entities/payment.entity';

export class CreatePaymentDto {
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @IsOptional()
  @IsUUID()
  builderId?: string;

  @IsNumber()
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  recordedBy?: string;
}
