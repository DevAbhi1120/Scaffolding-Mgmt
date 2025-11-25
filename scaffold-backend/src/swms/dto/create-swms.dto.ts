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

  // ← YOU SENT "formData" → CHANGE TO "formData"
  @IsObject()
  formData!: any;  // ← THIS IS WHAT YOU SEND

  // ← YOU SENT "tasks" → CHANGE TO "tasks"
  @IsArray()
  tasks!: TaskDto[];

  @IsOptional()
  @IsArray()
  attachments?: string[];
}