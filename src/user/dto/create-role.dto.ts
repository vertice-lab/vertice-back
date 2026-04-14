import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  level: number;
}
