import { IsString, IsOptional, IsUUID, Min, Max, IsInt } from 'class-validator';

export class UpdateUserAdminDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsUUID()
  @IsOptional()
  roleId?: string;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  level?: number;
}
