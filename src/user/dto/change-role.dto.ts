import { IsUUID, IsNotEmpty } from 'class-validator';

export class ChangeRoleDto {
  @IsUUID()
  @IsNotEmpty()
  roleId: string;
}
