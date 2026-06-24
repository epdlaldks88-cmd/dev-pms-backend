import { IsString, IsOptional, IsDateString, IsInt, Min, Max, IsUUID } from 'class-validator';

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

  @IsOptional() @IsString()
  note?: string;

  @IsOptional() @IsInt()
  order?: number;

  @IsOptional() @IsInt()
  depth?: number;

  @IsOptional()
  parentId?: string | null;
}

export class ReorderWbsDto {
  items: { id: string; order: number; parentId: string | null; depth: number }[];
}
