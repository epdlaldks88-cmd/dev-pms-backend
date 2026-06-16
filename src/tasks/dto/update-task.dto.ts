import {
  IsString, IsOptional, IsDateString,
  MaxLength, IsEnum, IsArray, IsUUID, IsInt, ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Priority, TaskStatus } from '@prisma/client';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @ValidateIf((o) => o.stepId != null && o.stepId !== '')
  @IsUUID()
  stepId?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.startDate != null && o.startDate !== '')
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.dueDate != null && o.dueDate !== '')
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  assigneeIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  labelIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  personnelIds?: string[];

  @IsOptional()
  @IsInt()
  order?: number;
}
