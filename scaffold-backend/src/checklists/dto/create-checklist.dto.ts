import { IsUUID, IsOptional, IsDateString, IsArray, ArrayMinSize, IsObject } from 'class-validator';

export class CreateChecklistDto {
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsUUID()
  submittedBy?: string;

  @IsObject()
  checklistData: any;

  @IsDateString()
  dateOfCheck: string; // ISO date

  @IsOptional()
  @IsArray()
  attachments?: string[]; // file keys
}
