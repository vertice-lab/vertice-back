import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del equipo es obligatorio' })
  name: string;

  @IsUUID('4', { message: 'El ID del manager debe ser un UUID válido' })
  @IsNotEmpty({ message: 'Debes asignar un líder al equipo' })
  managerId: string;

  @IsArray({ message: 'Los miembros deben ser un arreglo de IDs' })
  @IsOptional()
  @IsUUID('4', {
    each: true,
    message: 'Cada ID de miembro debe ser un UUID válido',
  })
  memberIds?: string[];
}
