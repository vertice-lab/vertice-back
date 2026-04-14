import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTicketReceiptNotificationDto {
  @IsString()
  @IsNotEmpty()
  ticketNumber: string;

  @IsString()
  @IsNotEmpty()
  selectedImageUrl: string;
}
