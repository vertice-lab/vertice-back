import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateBankAccountDto {
  @IsString()
  @MinLength(1)
  financialInstitutionName: string;

  @IsString()
  @MinLength(1)
  country: string;

  @IsString()
  @IsOptional()
  type?: string = 'Banco';

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

  @IsString()
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

  @IsString()
  @IsOptional()
  currencyCode?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
