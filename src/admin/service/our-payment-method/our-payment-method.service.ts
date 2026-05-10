import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { UserService } from 'src/user/services/user/user.service';
import { GetUser } from 'src/auth/decorators/user/user.decorator';
import { UserAuth } from 'src/auth/interfaces/user/user-auth';
import { Roles } from 'src/auth/interfaces/enums/roles';
import {
  CreateOurPaymentMethodDto,
  UpdateOurPaymentMethodDto,
} from 'src/admin/dto/our-payment-method/our-payment-method.dto';
import { normalizeString } from 'src/common/utils/normalize-string';

@Injectable()
export class OurPaymentMethodService {
  private readonly logger = new Logger(OurPaymentMethodService.name);

  constructor(
    private prisma: PrismaClientService,
    private userService: UserService,
  ) {}

  private capitalizeWords(word?: string) {
    if (!word) return word || '';
    return word
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  // PUBLIC - Get all payment methods (list) - incluye activos e inactivos
  async getAllActivePaymentMethods() {
    try {
      const paymentMethods = await this.prisma.ourPaymentMethod.findMany({
        orderBy: [
          { country: 'asc' },
          { type: 'asc' },
          { financialInstitutionName: 'asc' },
        ],
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return {
        ok: true,
        data: paymentMethods,
      };
    } catch (error) {
      this.logger.error('Error fetching payment methods', error);
      throw new InternalServerErrorException(
        'Error al obtener los métodos de pago',
      );
    }
  }

  // PUBLIC - Get payment methods by country
  async getPaymentMethodsByCountry(country: string) {
    try {
      const paymentMethods = await this.prisma.ourPaymentMethod.findMany({
        where: {
          country: {
            equals: country,
            mode: 'insensitive',
          },
          isActive: true,
        },
        orderBy: [
          { type: 'asc' },
          { financialInstitutionName: 'asc' },
        ],
      });

      return {
        ok: true,
        data: paymentMethods,
      };
    } catch (error) {
      this.logger.error('Error fetching payment methods by country', error);
      throw new InternalServerErrorException(
        'Error al obtener los métodos de pago por país',
      );
    }
  }

  // PUBLIC - Get payment method by ID or Country
  async getPaymentMethodByIdOrCountry(idOrCountry: string) {
    try {
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          idOrCountry,
        );

      if (isUUID) {
        const paymentMethod = await this.prisma.ourPaymentMethod.findUnique({
          where: { id: idOrCountry },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        if (!paymentMethod) {
          throw new NotFoundException(
            `Método de pago con ID ${idOrCountry} no encontrado`,
          );
        }

        return {
          ok: true,
          data: paymentMethod,
        };
      }

      let paymentMethods = await this.prisma.ourPaymentMethod.findMany({
        where: {
          country: idOrCountry,
          isActive: true,
        },
        orderBy: [{ type: 'asc' }, { financialInstitutionName: 'asc' }],
      });

      if (paymentMethods.length === 0) {
        const allActive = await this.prisma.ourPaymentMethod.findMany({
          where: { isActive: true },
          orderBy: [
            { country: 'asc' },
            { type: 'asc' },
            { financialInstitutionName: 'asc' },
          ],
        });

        paymentMethods = allActive.filter((pm) => {
          const normalizedCountry = normalizeString(pm.country) ?? pm.country;
          return normalizedCountry === idOrCountry;
        });
      }

      if (paymentMethods.length === 0) {
        throw new NotFoundException(
          `No se encontraron métodos de pago para el país: ${idOrCountry}`,
        );
      }

      return {
        ok: true,
        data: paymentMethods,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        'Error fetching payment method by ID or country',
        error,
      );
      throw new InternalServerErrorException(
        'Error al obtener el método de pago',
      );
    }
  }

  // PRIVATE - Create payment method (admin only)
  async createPaymentMethod(
    createOurPaymentMethodDto: CreateOurPaymentMethodDto,
    @GetUser() userAuthAdmin: UserAuth,
  ) {
    try {
      const { sub, iat, exp } = userAuthAdmin as {
        sub: string;
        iat: number;
        exp: number;
      };

      const userAdmin = await this.userService.getUserById(sub, iat, exp);

      if (userAdmin.user.role.name !== Roles.admin) {
        throw new UnauthorizedException(
          'Unauthorized Access - You need authorization',
        );
      }

      const { accountNumberOrCode, type, financialInstitutionName, country } =
        createOurPaymentMethodDto as any;

      const formattedCountry = this.capitalizeWords(country);

      const whereClause: any = {
        financialInstitutionName,
        country: formattedCountry,
        type,
      };

      if (accountNumberOrCode) {
        whereClause.accountNumberOrCode = accountNumberOrCode;
      }

      const existingMethod = await this.prisma.ourPaymentMethod.findFirst({
        where: whereClause,
      });

      if (existingMethod) {
        throw new BadRequestException(
          'Ya existe un método de pago con esta configuración',
        );
      }

      const paymentMethod = await this.prisma.ourPaymentMethod.create({
        data: {
          ...createOurPaymentMethodDto,
          country: formattedCountry,
          userId: sub,
        },
      });

      return {
        ok: true,
        msg: 'Método de pago creado correctamente',
        data: paymentMethod,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error('Error creating payment method', error);
      throw new InternalServerErrorException(
        'Error al crear el método de pago',
      );
    }
  }

  // PRIVATE - Update payment method
  async updatePaymentMethod(
    id: string,
    updateOurPaymentMethodDto: UpdateOurPaymentMethodDto,
    @GetUser() userAuthAdmin: UserAuth,
  ) {
    try {
      const { sub, iat, exp } = userAuthAdmin as {
        sub: string;
        iat: number;
        exp: number;
      };

      const userAdmin = await this.userService.getUserById(sub, iat, exp);

      if (userAdmin.user.role.name !== Roles.admin) {
        throw new UnauthorizedException(
          'Unauthorized Access - You need authorization',
        );
      }

      const paymentMethod = await this.prisma.ourPaymentMethod.findUnique({
        where: { id },
      });

      if (!paymentMethod) {
        throw new NotFoundException(
          `Método de pago con ID ${id} no encontrado`,
        );
      }

      if (updateOurPaymentMethodDto.country) {
        (updateOurPaymentMethodDto as any).country = this.capitalizeWords(
          updateOurPaymentMethodDto.country as any,
        );
      }

      const updatedPaymentMethod = await this.prisma.ourPaymentMethod.update({
        where: { id },
        data: updateOurPaymentMethodDto,
      });

      return {
        ok: true,
        msg: `Método de pago ${updatedPaymentMethod.financialInstitutionName} actualizado correctamente`,
        data: updatedPaymentMethod,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error('Error updating payment method', error);
      throw new InternalServerErrorException(
        'Error al actualizar el método de pago',
      );
    }
  }

  // PRIVATE - Update only isActive flag (admin only)
  async updatePaymentMethodActive(
    id: string,
    isActive: boolean,
    @GetUser() userAuthAdmin: UserAuth,
  ) {
    try {
      const { sub, iat, exp } = userAuthAdmin as {
        sub: string;
        iat: number;
        exp: number;
      };

      const userAdmin = await this.userService.getUserById(sub, iat, exp);

      if (userAdmin.user.role.name !== Roles.admin) {
        throw new UnauthorizedException(
          'Unauthorized Access - You need authorization',
        );
      }

      const paymentMethod = await this.prisma.ourPaymentMethod.findUnique({
        where: { id },
      });

      if (!paymentMethod) {
        throw new NotFoundException(
          `Método de pago con ID ${id} no encontrado`,
        );
      }

      const updated = await this.prisma.ourPaymentMethod.update({
        where: { id },
        data: { isActive },
      });

      return {
        ok: true,
        msg: `Estado actualizado correctamente`,
        data: updated,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error('Error updating isActive for payment method', error);
      throw new InternalServerErrorException(
        'Error al actualizar el estado del método de pago',
      );
    }
  }

  // PRIVATE - Delete payment method (admin only)
  async deletePaymentMethod(id: string, @GetUser() userAuthAdmin: UserAuth) {
    try {
      const { sub, iat, exp } = userAuthAdmin as {
        sub: string;
        iat: number;
        exp: number;
      };

      const userAdmin = await this.userService.getUserById(sub, iat, exp);

      if (userAdmin.user.role.name !== Roles.admin) {
        throw new UnauthorizedException(
          'Unauthorized Access - You need authorization',
        );
      }

      const paymentMethod = await this.prisma.ourPaymentMethod.findUnique({
        where: { id },
      });

      if (!paymentMethod) {
        throw new NotFoundException(
          `Método de pago con ID ${id} no encontrado`,
        );
      }

      await this.prisma.ourPaymentMethod.delete({ where: { id } });

      return {
        ok: true,
        msg: `Método de pago ${paymentMethod.financialInstitutionName} eliminado correctamente`,
      };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error('Error deleting payment method', error);
      throw new InternalServerErrorException(
        'Error al eliminar el método de pago',
      );
    }
  }
}
