import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ConfirmDeleteAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string;

  @IsOptional()
  @IsString()
  password?: string;
}
