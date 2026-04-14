import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TicketReceiptStatus } from 'generated/prisma/client';

export class UpdateTicketReceiptNotificationStatusDto {
  @IsEnum(TicketReceiptStatus)
  status: TicketReceiptStatus;

  @IsOptional()
  @IsString()
  managerNote?: string;

  @IsOptional()
  @IsString()
  managerResponseImageUrl?: string;
}
