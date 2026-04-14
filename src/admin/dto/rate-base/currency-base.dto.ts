import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCurrencyBaseDto {
  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  countryName: string;

  @IsNumber()
  @IsOptional()
  buyRate?: number;

  @IsNumber()
  @IsOptional()
  sellRate?: number;

  @IsNumber()
  @IsOptional()
  marketRate?: number;

  @IsNumber()
  @IsOptional()
  dolarBcvRate?: number;

  @IsNumber()
  @IsOptional()
  eurBcvRate?: number;

  @IsBoolean()
  @IsOptional()
  isActive: boolean = true;

  @IsBoolean()
  @IsOptional()
  isBase: boolean = false;

  @IsBoolean()
  @IsOptional()
  isVolatile: boolean = false;

  @IsBoolean()
  @IsOptional()
  isCripto: boolean = false;
}

export class UpdateAllCurrencyBaseDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  countryName?: string;

  @IsNumber()
  @IsOptional()
  buyRate?: number;

  @IsNumber()
  @IsOptional()
  sellRate?: number;

  @IsNumber()
  @IsOptional()
  marketRate?: number;

  @IsNumber()
  @IsOptional()
  dolarBcvRate?: number;

  @IsNumber()
  @IsOptional()
  eurBcvRate?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsBoolean()
  @IsOptional()
  isBase?: boolean = false;

  @IsBoolean()
  @IsOptional()
  isVolatile?: boolean = false;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}

export class CurrencyBaseDto {
  @IsString()
  currency: string;
}

export class PairCurrencyDto {}
