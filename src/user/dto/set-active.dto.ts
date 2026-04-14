import { IsBoolean, IsNotEmpty } from 'class-validator';

export class SetActiveDto {
  @IsBoolean()
  @IsNotEmpty()
  active: boolean;
}
