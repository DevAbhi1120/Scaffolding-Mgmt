// src/swms/dto/create-swms.dto.ts
import { IsUUID, IsOptional, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class TaskDto {
  name: string;
  highRisk?: boolean;
}

export class CreateSwmsDto {
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsUUID()
  submittedBy?: string;

  @IsObject()
  formData!: any;

  @IsArray()
  tasks!: TaskDto[];

  @IsOptional()
  @IsArray()
  attachments?: string[];
}