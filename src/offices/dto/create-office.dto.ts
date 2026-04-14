import { IsOptional, IsString, IsBoolean } from 'class-validator';
export class CreateOfficeDto {
  @IsString()
  country: string;

  @IsString()
  city: string;

  @IsString()
  address: string;

  @IsBoolean()
  isActive: boolean = true;

  @IsString()
  @IsOptional()
  openingTime: string;

  @IsString()
  @IsOptional()
  closingTime?: string;
}
