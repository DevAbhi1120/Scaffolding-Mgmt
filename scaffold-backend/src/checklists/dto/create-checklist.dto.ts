import { IsOptional, IsString, IsUUID, IsNotEmpty, IsDateString, IsArray } from 'class-validator';

export class CreateChecklistDto {
  @IsOptional()
  @IsUUID()
  orderId?: string | null;

  @IsOptional()
  @IsUUID()
  submittedBy?: string | null;

  @IsNotEmpty()
  checklistData: any;

  @IsDateString()
  dateOfCheck: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  preserved?: boolean;
}
