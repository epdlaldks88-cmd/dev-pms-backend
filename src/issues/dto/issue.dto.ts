import { IsString, IsOptional, IsEnum, IsUUID, MaxLength, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { IssueRisk, IssueStatus } from '@prisma/client';

export class CreateIssueDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value || undefined)
  description?: string;

  @IsOptional()
  @IsEnum(IssueRisk)
  riskLevel?: IssueRisk;

  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @IsOptional()
  @ValidateIf((o) => o.assigneeId != null && o.assigneeId !== '')
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  assigneeId?: string;

  @IsOptional()
  @ValidateIf((o) => o.taskId != null && o.taskId !== '')
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  taskId?: string;
}

export class UpdateIssueDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(IssueRisk)
  riskLevel?: IssueRisk;

  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @IsOptional()
  @ValidateIf((o) => o.assigneeId != null && o.assigneeId !== '')
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  assigneeId?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.taskId != null && o.taskId !== '')
  @IsUUID()
  @Transform(({ value }) => value || undefined)
  taskId?: string | null;
}
