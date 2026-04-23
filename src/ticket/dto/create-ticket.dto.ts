import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsNotEmpty,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

// --- Sub-DTOs para validación anidada ---

class QuoteDto {
  @IsString()
  @IsNotEmpty()
  rateId: string;

  @IsNumber()
  @IsPositive()
  sendAmount: number;

  @IsNumber()
  @IsPositive()
  receiveAmount: number;

  @IsString()
  @IsNotEmpty()
  fromCurrency: string;

  @IsString()
  @IsNotEmpty()
  toCurrency: string;

  @IsNumber()
  @IsPositive()
  rate: number;

  @IsEnum(['isSelf', 'isThirdParty'])
  transferType: 'isSelf' | 'isThirdParty';
}

class AccountDto {
  @IsEnum(['bank', 'cash'])
  deliveryMethod: 'bank' | 'cash';

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsString()
  institutionName?: string;

  @IsOptional()
  @IsString()
  typeInstitution?: string;

  @IsBoolean()
  isThirdParty: boolean;

  // Campos de Terceros
  @IsOptional()
  @IsString()
  thirdPartyName?: string;

  @IsOptional()
  @IsString()
  thirdPartyPhone?: string;

  @IsOptional()
  @IsString()
  thirdPartyId?: string;

  @IsOptional()
  @IsString()
  thirdPartyEmail?: string;

  @IsOptional()
  @IsString()
  thirdPartyAlias?: string;

  @IsOptional()
  @IsString()
  thirdPartyAccountNumberOrCode?: string;

  @IsOptional()
  @IsString()
  thirdPartyAccountHolderId?: string;

  @IsOptional()
  @IsString()
  thirdPartyBankAccountType?: string;

  @IsOptional()
  @IsString()
  thirdPartyAddressOrDetails?: string;

  @IsOptional()
  @IsEnum(['DNI', 'CEDULA', 'PASSPORT'])
  documentType?: 'DNI' | 'CEDULA' | 'PASSPORT';

  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}

class PaymentDetailsDto {
  @IsString()
  @IsNotEmpty()
  financialInstitutionName: string;

  @IsNumber()
  senderFeePercentage: number;

  @IsOptional()
  @IsString()
  accountNumber?: string;
}

// --- DTO Principal ---

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  ticketNumber: string;

  @IsNumber()
  @IsPositive()
  totalToPay: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ValidateNested()
  @Type(() => QuoteDto)
  @IsNotEmpty()
  quote: QuoteDto;

  @ValidateNested()
  @Type(() => AccountDto)
  @IsNotEmpty()
  account: AccountDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails?: PaymentDetailsDto | null;
}
