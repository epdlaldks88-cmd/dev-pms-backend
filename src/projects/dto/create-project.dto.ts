import { IsString, IsOptional, IsDateString, MaxLength, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProjectDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value || undefined)
  description?: string;

  @IsOptional()
  @ValidateIf((o) => o.startDate !== '' && o.startDate != null)
  @IsDateString()
  @Transform(({ value }) => value || undefined)
  startDate?: string;

  @IsOptional()
  @ValidateIf((o) => o.endDate !== '' && o.endDate != null)
  @IsDateString()
  @Transform(({ value }) => value || undefined)
  endDate?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}
