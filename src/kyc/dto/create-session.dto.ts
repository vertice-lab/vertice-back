import { Type } from "class-transformer";
import { IsBoolean, IsEmail, IsOptional, IsString, ValidateNested } from "class-validator";


class ContactDetailsDto {
  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString()
  email_lang?: string;

  @IsOptional() @IsBoolean()
  send_notification_emails?: boolean;

  @IsOptional() @IsString()
  phone?: string;
}

class ExpectedDetailsDto {
  @IsOptional() @IsString()
  first_name?: string;

  @IsOptional() @IsString()
  last_name?: string;

  @IsOptional() @IsString()
  date_of_birth?: string;
}

export class CreateSessionDto {
  // Estos datos ahora se manejan idealmente en el backend (.env),
  // pero los dejamos como opcionales por si alguna vista requiere forzarlos.
  @IsOptional() @IsString()
  workflow_id?: string;

  @IsOptional() @IsString()
  callback?: string;

  @IsOptional() @IsString()
  vendor_data?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional() @ValidateNested() @Type(() => ContactDetailsDto)
  contact_details?: ContactDetailsDto;

  @IsOptional() @ValidateNested() @Type(() => ExpectedDetailsDto)
  expected_details?: ExpectedDetailsDto;
}