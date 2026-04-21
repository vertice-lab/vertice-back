import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import {
  CreateUserAdminDto,
  UpdateUserAdminDto,
  UpdateProfileDto,
  GetUsersQueryDto,
  ChangeRoleDto,
  SetActiveDto,
  UserResponseDto,
} from '../../dto';
import * as argon2 from 'argon2';
import { KycStatus, type Prisma } from 'generated/prisma/client';
import { buildPaginationMeta } from 'src/common/helpers/pagination.helper';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { Roles } from 'src/auth/interfaces/enums/roles';
import { CreateRoleDto } from 'src/user/dto/create-role.dto';
import { AssessorStatus } from 'src/ticket/enums/ticket-status.enum';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaClientService) {}

  private mapToUserResponse(
    user: Prisma.UserGetPayload<Record<string, never>> & {
      role?: { id: string; name: string; level: number } | null;
      country?: { country_name: string; country_code: string } | null;
      information?: {
        phone: string | null;
        dateBirth: string | null;
        address: string | null;
        documentNumber: string | null;
        documentType: string | null;
        postalCode: string | null;
        acceptedTerms: boolean;
        receiveMarketingEmails: boolean;
      } | null;
      providers?: unknown[];
    },
  ): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      roleId: user.roleId,
      verified: user.verified,
      active: user.active,
      countryCode: user.countryCode,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role
        ? {
            id: user.role.id,
            name: user.role.name,
            level: user.role.level,
          }
        : undefined,
      information: user.information
        ? {
            phone: user.information.phone,
            dateBirth: user.information.dateBirth,
            address: user.information.address,
            documentNumber: user.information.documentNumber,
            documentType: user.information.documentType,
            postalCode: user.information.postalCode,
            acceptedTerms: user.information.acceptedTerms,
            receiveMarketingEmails: user.information.receiveMarketingEmails,
          }
        : undefined,
      country: user.country
        ? {
            country_name: user.country.country_name,
            country_code: user.country.country_code,
          }
        : undefined,
    };
  }

  async isOnlineUser(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      await this.prisma.user.update({
        where: {
          id: user?.id,
        },
        data: {
          online: true,
          status: AssessorStatus.AVAILABLE,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener el usuario');
    }
  }

  async isOffOnlineUser(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      await this.prisma.user.update({
        where: {
          id: user?.id,
        },
        data: {
          online: false,
          status: AssessorStatus.OFFLINE,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener el usuario');
    }
  }

  async createRole(createRoleDto: CreateRoleDto) {
    try {
      const roleExist = await this.prisma.role.findUnique({
        where: {
          name: createRoleDto.name as Roles,
          level: createRoleDto.level,
        },
      });

      if (roleExist) {
        throw new BadRequestException(`${roleExist.name} ya existe`);
      }

      await this.prisma.role.create({
        data: {
          name: createRoleDto.name as Roles,
          level: createRoleDto.level,
        },
      });

      return {
        ok: true,
      };
    } catch (error) {
      console.log(error);
    }
  }

  private async validateRole(
    roleId: string,
    allowClient = false,
  ): Promise<void> {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });

    if (!role) {
      throw new BadRequestException('Rol no encontrado');
    }

    if (!allowClient && role.name === Roles.client) {
      throw new BadRequestException(
        'No se puede asignar el rol de cliente desde este endpoint',
      );
    }
  }

  async getUserById(sub: string, iat: number, exp: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: sub },
      include: {
        role: true,
        providers: true,
        information: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no existente');
    }

    return { ok: true, user, iat, exp };
  }

  async findAll(
    query: GetUsersQueryDto,
  ): Promise<{ ok: true } & PaginatedResponse<UserResponseDto>> {
    const { page = 1, limit = 10, search, roleId, active, verified } = query;
    const pageIndex = page - 1; 

    const where: Prisma.UserWhereInput = {
      role: { name: { not: Roles.client } },
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(roleId && { roleId }),
      ...(active !== undefined && { active }),
      ...(verified !== undefined && { verified }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: pageIndex * limit,
        take: limit,
        include: { role: true, country: true, information: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      ok: true,
      data: users.map(this.mapToUserResponse),
      pagination: buildPaginationMeta(total, pageIndex, limit),
    };
  }

  async findOne(id: string): Promise<{ ok: true; data: UserResponseDto }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true, country: true, information: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return { ok: true, data: this.mapToUserResponse(user) };
  }

  async createUserAdmin(
    createDto: CreateUserAdminDto,
  ): Promise<{ ok: true; data: UserResponseDto; msg: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: createDto.email },
    });
    if (existing) throw new BadRequestException('El correo ya existe');

    await this.validateRole(createDto.roleId);

    const hashedPassword = await argon2.hash(createDto.password);

    if (createDto.level !== undefined) {
      await this.prisma.role.update({
        where: { id: createDto.roleId },
        data: { level: createDto.level },
      });
    }

    const user = await this.prisma.user.create({
      data: {
        name: createDto.name,
        lastName: createDto.lastName,
        email: createDto.email,
        password: hashedPassword,
        roleId: createDto.roleId,
        countryCode: createDto.countryCode,
        image: createDto.image,
        active: true,
        verified: true,
      },
    });

    const { data } = await this.findOne(user.id);

    return {
      ok: true,
      data,
      msg: 'Usuario creado exitosamente',
    };
  }

  async updateUserAdmin(
    id: string,
    updateDto: UpdateUserAdminDto,
  ): Promise<{ ok: true; data: UserResponseDto; msg: string }> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (updateDto.roleId) {
      await this.validateRole(updateDto.roleId);

      if (updateDto.level !== undefined) {
        await this.prisma.role.update({
          where: { id: updateDto.roleId },
          data: { level: updateDto.level },
        });
      }
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        name: updateDto.name,
        lastName: updateDto.lastName,
        roleId: updateDto.roleId,
      },
    });

    const { data } = await this.findOne(id);
    return { ok: true, data, msg: 'Usuario actualizado exitosamente' };
  }

  async changeRole(
    id: string,
    changeRoleDto: ChangeRoleDto,
  ): Promise<{ ok: true; data: UserResponseDto; msg: string }> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    await this.validateRole(changeRoleDto.roleId, true);

    await this.prisma.user.update({
      where: { id },
      data: { roleId: changeRoleDto.roleId },
    });

    const { data } = await this.findOne(id);
    return { ok: true, data, msg: 'Rol cambiado exitosamente' };
  }

  async setActive(
    id: string,
    setActiveDto: SetActiveDto,
  ): Promise<{ ok: true; data: UserResponseDto; msg: string }> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    await this.prisma.user.update({
      where: { id },
      data: { active: setActiveDto.active },
    });

    const { data } = await this.findOne(id);
    return {
      ok: true,
      data,
      msg: `Usuario ${setActiveDto.active ? 'activado' : 'desactivado'} correctamente`,
    };
  }

  async delete(id: string): Promise<{ ok: true; msg: string }> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    await this.prisma.user.delete({ where: { id } });
    return { ok: true, msg: 'Usuario eliminado correctamente' };
  }

  async updateOwnProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<{ ok: true; data: UserResponseDto; msg: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      throw new BadRequestException('El correo no se puede actualizar');
    }

    if (user.kycStatus === KycStatus.APPROVED) {
      const {
        name: _n,
        lastName: _ln,
        dateBirth: _db,
        documentType: _dt,
        documentNumber: _dn,
        ...safeDto
      } = updateProfileDto;
      updateProfileDto = safeDto as UpdateProfileDto;
    }

    const {
      phone,
      dateBirth,
      address,
      documentNumber,
      documentType,
      postalCode,
      ...userData
    } = updateProfileDto;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: userData });

      const hasInfoUpdate =
        phone !== undefined ||
        dateBirth !== undefined ||
        address !== undefined ||
        documentNumber !== undefined ||
        documentType !== undefined ||
        postalCode !== undefined;

      if (hasInfoUpdate) {
        const infoData = {
          ...(phone !== undefined && { phone: phone || null }),
          ...(dateBirth !== undefined && { dateBirth }),
          ...(address !== undefined && { address }),
          ...(documentNumber !== undefined && { documentNumber }),
          ...(documentType !== undefined && { documentType }),
          ...(postalCode !== undefined && { postalCode }),
        };

        const existing = await tx.informationUser.findUnique({
          where: { userId },
        });

        if (existing) {
          await tx.informationUser.update({
            where: { userId },
            data: infoData,
          });
        } else {
          await tx.informationUser.create({
            data: {
              userId,
              ...infoData,
              acceptedTerms: false,
              receiveMarketingEmails: false,
            },
          });
        }
      }
    });

    const { data } = await this.findOne(userId);
    return { ok: true, data, msg: 'Perfil actualizado exitosamente' };
  }

  async resetPassword(
    userId: string,
    password: string,
  ): Promise<{ ok: true; msg: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role?.name === Roles.client) {
      throw new BadRequestException(
        'No se puede resetear la contraseña de un cliente',
      );
    }

    const hashedPassword = await argon2.hash(password);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { ok: true, msg: 'Contraseña reseteada exitosamente' };
  }
}
