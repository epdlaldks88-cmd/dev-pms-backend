import { IsString, IsOptional, IsInt, IsEnum, MaxLength } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class CreateStepDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
