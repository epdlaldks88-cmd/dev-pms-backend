import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateQATestDto {
  @IsString()
  srNumber: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  tester?: string;

  @IsOptional()
  @IsUUID()
  workLogId?: string;
}

export class UpdateQATestDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  tester?: string;
}
