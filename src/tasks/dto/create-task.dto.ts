import {
  IsString, IsOptional, IsDateString,
  MaxLength, IsEnum, IsArray, IsUUID, IsInt, ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Priority, TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || undefined)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value || undefined)
  requester?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value || undefined)
  part?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @ValidateIf((o) => o.stepId != null && o.stepId !== '')
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  stepId?: string;

  @IsOptional()
  @ValidateIf((o) => o.startDate != null && o.startDate !== '')
  @IsDateString()
  @Transform(({ value }) => value || undefined)
  startDate?: string;

  @IsOptional()
  @ValidateIf((o) => o.dueDate != null && o.dueDate !== '')
  @IsDateString()
  @Transform(({ value }) => value || undefined)
  dueDate?: string;

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
  @ValidateIf((o) => o.parentId != null && o.parentId !== '')
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  parentId?: string;

  @IsOptional()
  @IsInt()
  order?: number;
}
