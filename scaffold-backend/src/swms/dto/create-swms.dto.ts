import { IsUUID, IsOptional, IsArray, IsObject, ArrayMinSize } from 'class-validator';

export class CreateSwmsDto {
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsUUID()
  submittedBy?: string;

  @IsObject()
  swmsData: any;

  @IsArray()
  highRiskTasks: any[]; // each task is an object with columns per the sheet

  @IsOptional()
  @IsArray()
  attachments?: string[];
}
