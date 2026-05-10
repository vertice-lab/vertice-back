import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

// Register temporal
export class TempRegisterAuthDto {
  @IsString()
  @IsEmail()
  email: string;
}

// UserDto
export class UserEmailAuthDto {
  @IsString()
  @IsEmail()
  email: string;
}

//Register user
export class RegisterAuthDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  countryCode: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  dateBirth: string;

  @IsBoolean()
  @IsOptional()
  acceptedTerms?: boolean;

  @IsBoolean()
  @IsOptional()
  receiveMarketingEmails?: boolean;
}

export class GoogleCallbackDto {
  @IsString()
  googleId: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  image?: string;
}

export class LoginAuthDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class TokenAuthDto {
  @IsString()
  token: string;
}

export class UpdatePasswordDto {
  @IsString()
  newPassword: string;
  @IsString()
  token: string;
}

export class UpdateAuthDto extends PartialType(RegisterAuthDto) { }

export class SupportFormDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  message: string;
}
