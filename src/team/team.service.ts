import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { Roles } from 'generated/prisma/enums';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaClientService) {}

  async create(createTeamDto: CreateTeamDto) {
    const { name, managerId, memberIds } = createTeamDto;

    const manager = await this.prisma.user.findUnique({
      where: {
        id: managerId,
        role: {
          name: Roles.manager,
        },
      },
    });

    if (!manager) {
      throw new BadRequestException(
        'Este Usuario no posee los permisos adecuados',
      );
    }

    const validMembers = await this.prisma.user.count({
      where: {
        id: { in: memberIds ?? [] },
        role: { name: Roles.assessor },
      },
    });

    if (memberIds?.length && validMembers !== memberIds.length) {
      throw new BadRequestException(
        'Uno o más miembros no son válidos o no tienen el rol de asesor',
      );
    }

    try {
      const newTeam = await this.prisma.team.create({
        data: {
          name: name,
          manager: {
            connect: { id: managerId },
          },
          members:
            (memberIds ?? []).length > 0
              ? {
                  connect: memberIds?.map((id) => ({ id })),
                }
              : undefined,
        },
      });

      return {
        ok: true,
        msg: `Equipo ${newTeam.name} creado correctamente`,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException('Error al crear equipo');
    }
  }

  async findAll() {
    try {
      const list = await this.prisma.team.findMany({
        include: { manager: true, _count: { select: { members: true } } },
      });

      return {
        ok: true,
        data: list,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener lista de equipos',
      );
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} team`;
  }

  async findAvailableAssessors() {
    try {
      const asessessors = await this.prisma.user.findMany({
        where: {
          role: { name: 'assessor' },
          teamId: null,
          active: true,
        },
        select: { id: true, name: true, lastName: true, email: true },
      });

      return {
        ok: true,
        data: asessessors,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al buscar asesores disponibles',
      );
    }
  }

  async findAvailableManagers() {
    try {
      const managers = await this.prisma.user.findMany({
        where: {
          role: { name: Roles.manager },
          managedTeam: null,
          active: true,
        },
        select: {
          id: true,
          name: true,
          lastName: true,
          email: true,
          image: true,
        },
      });

      return {
        ok: true,
        data: managers,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al buscar managers disponibles',
      );
    }
  }

  async update(id: string, updateTeamDto: UpdateTeamDto) {
    const { name, managerId, memberIds } = updateTeamDto;

    if (managerId) {
      const manager = await this.prisma.user.findFirst({
        where: {
          id: managerId,
          role: { name: Roles.manager },
        },
      });

      if (!manager) {
        throw new BadRequestException(
          'El usuario asignado como líder no es un Manager válido',
        );
      }
    }

    try {
      await this.prisma.team.update({
        where: { id },
        data: {
          name: name,
          ...(managerId && {
            manager: { connect: { id: managerId } },
          }),
          ...(memberIds && {
            members: {
              set: [],
              connect: memberIds.map((userId) => ({ id: userId })),
            },
          }),
        },
        include: {
          manager: true,
          members: true,
        },
      });

      return {
        ok: true,
        msg: 'Actualizado correctamente',
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Este Manager ya lidera otro equipo.');
      }

      if (error.code === 'P2025') {
        throw new NotFoundException(
          'El equipo que intentas actualizar no existe.',
        );
      }

      throw new InternalServerErrorException('Error al actualizar el equipo');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.team.delete({ where: { id } });
      return {
        ok: true,
        msg: 'Eliminado Correctamente',
      };
    } catch (error) {
      throw new InternalServerErrorException('No se pudo eliminar el equipo');
    }
  }
}
