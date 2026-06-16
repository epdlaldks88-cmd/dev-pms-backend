import { IsOptional, IsString, MaxLength, MinLength, IsEmail, IsIn } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class AdminUpdateUserDto {
  @IsOptional()
  @IsIn(['ADMIN', 'MEMBER'])
  role?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name?: string;
}

// backward compat alias
export class UpdateUserDto extends UpdateProfileDto {}
