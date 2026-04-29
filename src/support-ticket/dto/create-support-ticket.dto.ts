import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { Priority } from '../enums/priority.enum';

export class CreateSupportTicketDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsUUID()
  relatedTicketId?: string;

  @IsOptional()
  @IsString()
  evidenceImage?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;
}
