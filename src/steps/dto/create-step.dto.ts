import { IsString, IsOptional, IsInt, MaxLength } from 'class-validator';

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
}
