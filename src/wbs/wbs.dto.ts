import { IsString, IsOptional, IsDateString, IsInt, Min, Max, IsUUID, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { WbsStatus } from '@prisma/client';
import { Type } from 'class-transformer';

class ReorderItem {
  @IsString()
  id: string;

  @IsInt()
  order: number;

  @IsOptional() @IsString()
  parentId: string | null;

  @IsInt()
  depth: number;
}

export class ReorderWbsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItem)
  items: ReorderItem[];
}

export class CreateWbsItemDto {
  @IsString()
  title: string;

  @IsOptional() @IsString()
  assignee?: string;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsDateString()
  endDate?: string;

  @IsOptional() @IsInt() @Min(0) @Max(100)
  progress?: number;

  @IsOptional() @IsEnum(WbsStatus)
  status?: WbsStatus;

  @IsOptional() @IsString()
  note?: string;

  @IsOptional() @IsInt()
  order?: number;

  @IsOptional() @IsInt()
  depth?: number;

  @IsOptional() @IsUUID()
  parentId?: string;
}

export class UpdateWbsItemDto {
  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
  assignee?: string;

  @IsOptional()
  startDate?: string | null;

  @IsOptional()
  endDate?: string | null;

  @IsOptional() @IsInt() @Min(0) @Max(100)
  progress?: number;

  @IsOptional() @IsEnum(WbsStatus)
  status?: WbsStatus;

  @IsOptional() @IsString()
  note?: string;

  @IsOptional() @IsInt()
  order?: number;

  @IsOptional() @IsInt()
  depth?: number;

  @IsOptional()
  parentId?: string | null;
}

