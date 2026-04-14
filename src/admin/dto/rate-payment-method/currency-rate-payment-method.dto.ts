import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateCurrencyPaymentMethodDto {
  @IsUUID()
  @IsNotEmpty()
  currencyRateId: string;

  @IsUUID()
  @IsNotEmpty()
  ourPaymentMethodId: string;

  @IsNumber()
  senderFeePercentage: number; // % cuando el cliente USA este método para ENVIAR

  @IsNumber()
  receiverFeePercentage: number; // % cuando el cliente DESEA RECIBIR por este método

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCurrencyPaymentMethodDto {
  @IsUUID()
  @IsOptional()
  currencyRateId?: string;

  @IsUUID()
  @IsOptional()
  ourPaymentMethodId?: string;

  @IsNumber()
  @IsOptional()
  senderFeePercentage?: number; // % cuando el cliente USA este método para ENVIAR

  @IsNumber()
  @IsOptional()
  receiverFeePercentage?: number; // % cuando el cliente DESEA RECIBIR por este método

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class GetCurrencyPaymentMethodParamDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class UpdateIsActiveCurrencyPaymentMethodDto {
  @IsBoolean()
  isActive: boolean;
}

export class GetPaymentMethodsByRateDto {
  @IsUUID()
  @IsNotEmpty()
  currencyRateId: string;

  @IsString()
  @IsNotEmpty()
  operationType: 'SEND' | 'RECEIVE'; // SEND = cliente envía dinero, RECEIVE = cliente recibe dinero
}
