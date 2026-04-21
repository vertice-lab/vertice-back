import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum KycNewStatus {
    APPROVED = 'Approved',
    DECLINED = 'Declined',
    RESUBMITTED = 'Resubmitted',
}

export class UpdateStatusDto {
    @ApiProperty({
        enum: KycNewStatus,
        description: 'El nuevo estado de la sesión. Use Approved o Declined para decisiones finales, o Resubmitted para solicitar al usuario que rehaga pasos específicos.',
        required: true,
    })
    @IsNotEmpty()
    @IsEnum(KycNewStatus, {
        message: 'new_status debe ser Approved, Declined o Resubmitted'
    })
    new_status: KycNewStatus;


    @IsString()
    @IsOptional()
    comment?: string
}