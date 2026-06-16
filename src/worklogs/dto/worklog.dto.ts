import { IsString, IsOptional, IsUUID, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateWorkLogDto {
  @IsUUID()
  taskId: string;

  @IsOptional()
  @IsUUID()
  userId?: string; // 미지정 시 본인

  @IsOptional()
  @IsNumber()
  @Min(0)
  hours?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  workDate?: string;
}

export class UpdateWorkLogDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  hours?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  workDate?: string;
}
