import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsUppercase,
  IsIn,
} from 'class-validator';

export class CreateCurrencyRateHistoryDto {
  @IsString()
  @IsNotEmpty()
  operation: string;

  @IsDateString()
  firstCreatedAt: string;

  @IsNumber()
  buyRate: number;

  @IsBoolean()
  isActive: boolean;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  sellRate: number;

  @IsDateString()
  newUpdatedAt: string;

  @IsString()
  @IsNotEmpty()
  @IsUppercase()
  fromCurrency: string;

  @IsString()
  @IsNotEmpty()
  @IsUppercase()
  toCurrency: string;

  @IsNumber()
  @IsOptional()
  marketRate?: number;

  @IsNumber()
  @IsOptional()
  dolarBcvRate?: number;

  @IsNumber()
  @IsOptional()
  eurBcvRate?: number;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  @IsNotEmpty()
  currencyRateId: string;

  @IsString()
  @IsOptional()
  @IsIn(['CREATE', 'UPDATE'])
  method?: 'CREATE' | 'UPDATE';
}

export class UpdateCurrencyRateHistoryDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  operation?: string;

  @IsDateString()
  @IsOptional()
  firstCreatedAt?: string;

  @IsNumber()
  @IsOptional()
  buyRate?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  sellRate?: number;

  @IsDateString()
  @IsOptional()
  newUpdatedAt?: string;

  @IsString()
  @IsOptional()
  @IsUppercase()
  fromCurrency?: string;

  @IsString()
  @IsOptional()
  @IsUppercase()
  toCurrency?: string;

  @IsNumber()
  @IsOptional()
  marketRate?: number;

  @IsUUID()
  @IsOptional()
  currencyRateId?: string;
}

export class CurrencyRateHistoryDto {
  @IsUUID()
  id: string;

  @IsDateString()
  createdAt: string;

  @IsString()
  operation: string;

  @IsDateString()
  firstCreatedAt: string;

  @IsNumber()
  buyRate: number;

  @IsBoolean()
  isActive: boolean;

  @IsString()
  name: string;

  @IsNumber()
  sellRate: number;

  @IsDateString()
  newUpdatedAt: string;

  @IsString()
  @IsUppercase()
  fromCurrency: string;

  @IsString()
  @IsUppercase()
  toCurrency: string;

  @IsNumber()
  @IsOptional()
  marketRate?: number;

  @IsUUID()
  userId: string;

  @IsUUID()
  currencyRateId: string;

  @IsString()
  method: 'CREATE' | 'UPDATE';
}
