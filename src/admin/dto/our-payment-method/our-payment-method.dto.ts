import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateOurPaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  financialInstitutionName: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  accountHolderName?: string;

  @IsString()
  @IsOptional()
  accountHolderId?: string;

  @IsString()
  @IsOptional()
  accountNumberOrCode?: string;

  @IsString()
  @IsOptional()
  aliasOrReference?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ValidateIf(
    (o) =>
      o.emailAddress !== '' &&
      o.emailAddress !== null &&
      o.emailAddress !== undefined,
  )
  @IsEmail()
  @IsOptional()
  emailAddress?: string;

  @IsString()
  @IsOptional()
  bankAccountType?: string;

  @IsString()
  @IsOptional()
  addressOrDetails?: string;

  @IsString()
  @IsOptional()
  additionalNotes?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateOurPaymentMethodDto {
  @IsString()
  @IsOptional()
  financialInstitutionName?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  accountHolderName?: string;

  @IsString()
  @IsOptional()
  accountHolderId?: string;

  @IsString()
  @IsOptional()
  accountNumberOrCode?: string;

  @IsString()
  @IsOptional()
  aliasOrReference?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ValidateIf(
    (o) =>
      o.emailAddress !== '' &&
      o.emailAddress !== null &&
      o.emailAddress !== undefined,
  )
  @IsEmail()
  @IsOptional()
  emailAddress?: string;

  @IsString()
  @IsOptional()
  bankAccountType?: string;

  @IsString()
  @IsOptional()
  addressOrDetails?: string;

  @IsString()
  @IsOptional()
  additionalNotes?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateIsActiveDto {
  @IsBoolean()
  isActive: boolean;
}
