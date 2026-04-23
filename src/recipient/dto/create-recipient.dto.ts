import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { IdentificationType, PaymentMethodType } from "../enums/recipient.enum";

export class CreatePaymentDetailDto {
    @IsEnum(PaymentMethodType)
    paymentMethod: PaymentMethodType;

    @IsString()
    @IsOptional()
    bank?: string;

    @IsString()
    @IsOptional()
    accountType?: string;

    @IsString()
    @IsOptional()
    accountNumber?: string;

    @IsString()
    @IsOptional()
    country?: string;

    @IsString()
    @IsOptional()
    state?: string;

    @IsBoolean()
    @IsOptional()
    accountVerified?: boolean;

    @IsString()
    @IsOptional()
    addressOrDetails?: string;

    @IsString()
    @IsOptional()
    aliasOrReference?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;
}

export class CreateRecipientDto {

    @IsString()
    firstName: string;
    
    @IsString()
    @IsOptional()
    lastName?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    phone: string;

    @IsEnum(IdentificationType)
    @IsOptional()
    identificationType?: IdentificationType;

    @IsString()
    identificationNumber: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreatePaymentDetailDto)
    paymentDetails?: CreatePaymentDetailDto;

}
