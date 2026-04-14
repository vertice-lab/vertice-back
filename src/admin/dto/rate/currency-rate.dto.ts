import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUppercase,
} from 'class-validator';

export class GetCurrencyRateDto {
  @IsString()
  @IsNotEmpty()
  @IsUppercase()
  fromCurrency: string;

  @IsString()
  @IsNotEmpty()
  @IsUppercase()
  toCurrency: string;
}

export class GetCurrencyRatePaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  @IsUppercase()
  fromCurrency: string;

  @IsString()
  @IsNotEmpty()
  @IsUppercase()
  toCurrency: string;
}

export class GetCurrencyRateByUsdDto {
  @IsString()
  @IsNotEmpty()
  @IsUppercase()
  fromCurrency: string;
}

export class CreateCurrencyRateDto {
  @IsString()
  @IsNotEmpty()
  @IsUppercase()
  fromCurrency: string;

  @IsString()
  @IsNotEmpty()
  @IsUppercase()
  toCurrency: string;

  @IsBoolean()
  isActive: boolean;
}

export class UpdateCurrencyRateDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  @IsUppercase()
  fromCurrency: string;

  @IsString()
  @IsNotEmpty()
  @IsUppercase()
  toCurrency: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  buyRate: number;

  @IsNumber()
  sellRate: number;

  @IsBoolean()
  isActive: boolean;
}

export class DestroyCurrencyRate {
  @IsString()
  @IsNotEmpty()
  fromCurrency: string;

  @IsString()
  @IsNotEmpty()
  toCurrency: string;
}

export class UpdateIsActiveRateDto {
  @IsBoolean()
  isActive: boolean;
}
