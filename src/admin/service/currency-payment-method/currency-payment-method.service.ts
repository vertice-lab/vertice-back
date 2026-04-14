import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserAuth } from 'src/auth/interfaces/user/user-auth';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { UserService } from 'src/user/services/user/user.service';
import { Roles } from 'src/auth/interfaces/enums/roles';
import {
  CreateCurrencyPaymentMethodDto,
  UpdateCurrencyPaymentMethodDto,
  UpdateIsActiveCurrencyPaymentMethodDto,
} from 'src/admin/dto/rate-payment-method/currency-rate-payment-method.dto';

@Injectable()
export class CurrencyPaymentMethodService {
  private readonly logger = new Logger(CurrencyPaymentMethodService.name);

  constructor(
    private prisma: PrismaClientService,
    private userService: UserService,
  ) {}

  // PUBLIC - Get all currency payment methods
  async getAllCurrencyPaymentMethods() {
    try {
      const currencyPaymentMethods =
        await this.prisma.currencyPaymentMethod.findMany({
          orderBy: [
            { currencyRate: { fromCurrencyBase: { name: 'asc' } } },
            { ourPaymentMethod: { financialInstitutionName: 'asc' } },
          ],
          select: {
            id: true,
            senderFeePercentage: true,
            receiverFeePercentage: true,
            isActive: true,
            ourPaymentMethod: true,
          },
        });

      return {
        ok: true,
        data: currencyPaymentMethods,
      };
    } catch (error) {
      this.logger.error('Error fetching currency payment methods', error);
      throw new InternalServerErrorException(
        'Error al obtener los métodos de pago de moneda',
      );
    }
  }

  // PUBLIC - Get currency payment method by ID
  async getCurrencyPaymentMethodById(id: string) {
    try {
      const currencyPaymentMethod =
        await this.prisma.currencyPaymentMethod.findUnique({
          where: { id },
          include: {
            ourPaymentMethod: true,
          },
        });

      if (!currencyPaymentMethod) {
        throw new NotFoundException(
          `Método de pago de moneda con ID ${id} no encontrado`,
        );
      }

      return {
        ok: true,
        data: currencyPaymentMethod,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching currency payment method by ID', error);
      throw new InternalServerErrorException(
        'Error al obtener el método de pago de moneda',
      );
    }
  }

  // PUBLIC - Get payment methods by currency rate with percentage logic
  async getPaymentMethodsByCurrencyRate(
    currencyRateId: string,
    currency: string,
  ) {
    try {
      const currencyUpper = currency.toUpperCase();

      const countryMap: Record<string, string> = {
        USD: 'Ee.uu',
        BS: 'Venezuela',
        ARS: 'Argentina',
        CLP: 'Chile',
        PEN: 'Perú',
        USDT: 'Ee.uu',
        COP: 'Colombia',
        EUR: 'España',
      };

      const targetCountry = countryMap[currencyUpper] || currency;

      const currencyPaymentMethods =
        await this.prisma.currencyPaymentMethod.findMany({
          where: {
            currencyRateId,
            isActive: true,
          },
          include: {
            ourPaymentMethod: true,
          },
        });

      const methods = currencyPaymentMethods
        .filter((item) => {
          const method = item.ourPaymentMethod;
          const institutionName = method.financialInstitutionName.toLowerCase();
          const matchesCountry =
            method.country.toLowerCase() === targetCountry.toLowerCase();

          if (!matchesCountry) return false;

          if (currencyUpper === 'USDT') {
            return institutionName === 'binance';
          }

          if (currencyUpper === 'USD') {
            return institutionName !== 'binance';
          }

          return true;
        })
        .map((method) => {
          const pm = method.ourPaymentMethod;

          // --- LÓGICA PARA EL NOMBRE EN EL SELECT ---
          // Combinamos Institución + Tipo para que sea imposible confundirse
          // Ejemplo: "Zelle (Zelle)" o "Wise (Transferencia Wise)" o "Mercado Pago (Transferencia)"
          const label =
            pm.financialInstitutionName && pm.type
              ? `${pm.financialInstitutionName} - ${pm.type}`
              : pm.financialInstitutionName || pm.type;

          return {
            id: method.id,
            label, // <--- Este es el campo que usarás en el Select del Frontend
            paymentMethod: pm,
            senderFeePercentage: method.senderFeePercentage,
            receiverFeePercentage: method.receiverFeePercentage,
          };
        });

      return {
        ok: true,
        data: methods,
      };
    } catch (error) {
      this.logger.error(
        'Error fetching payment methods by currency rate',
        error,
      );
      throw new InternalServerErrorException(
        'Error al obtener métodos de pago',
      );
    }
  }

  // PRIVATE - Create currency payment method (admin only)
  async createCurrencyPaymentMethod(
    createCurrencyPaymentMethodDto: CreateCurrencyPaymentMethodDto,
    userAuthAdmin: UserAuth,
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

      const {
        currencyRateId,
        ourPaymentMethodId,
        senderFeePercentage,
        receiverFeePercentage,
        isActive,
      } = createCurrencyPaymentMethodDto;

      const currencyRate = await this.prisma.currencyRate.findUnique({
        where: { id: currencyRateId },
      });

      if (!currencyRate) {
        throw new BadRequestException(
          `Currency rate con ID ${currencyRateId} no encontrado`,
        );
      }

      const ourPaymentMethod = await this.prisma.ourPaymentMethod.findUnique({
        where: { id: ourPaymentMethodId },
      });

      if (!ourPaymentMethod) {
        throw new BadRequestException(
          `Payment method con ID ${ourPaymentMethodId} no encontrado`,
        );
      }

      const existingMethod = await this.prisma.currencyPaymentMethod.findFirst({
        where: {
          currencyRateId,
          ourPaymentMethodId,
        },
      });

      if (existingMethod) {
        throw new BadRequestException(
          'Ya existe un método de pago para esta combinación de moneda y método de pago',
        );
      }

      await this.prisma.currencyPaymentMethod.create({
        data: {
          currencyRateId,
          ourPaymentMethodId,
          senderFeePercentage,
          receiverFeePercentage,
          isActive: isActive !== undefined ? isActive : true,
        },
      });

      return {
        ok: true,
        msg: 'Método de pago de moneda creado correctamente',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error('Error creating currency payment method', error);
      throw new InternalServerErrorException(
        'Error al crear el método de pago de moneda',
      );
    }
  }

  // PRIVATE - Update currency payment method (admin only)
  async updateCurrencyPaymentMethod(
    id: string,
    updateCurrencyPaymentMethodDto: UpdateCurrencyPaymentMethodDto,
    userAuthAdmin: UserAuth,
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

      const currencyPaymentMethod =
        await this.prisma.currencyPaymentMethod.findUnique({
          where: { id },
        });

      if (!currencyPaymentMethod) {
        throw new NotFoundException(
          `Método de pago de moneda con ID ${id} no encontrado`,
        );
      }

      // If updating currencyRateId or ourPaymentMethodId, validate they exist
      if (updateCurrencyPaymentMethodDto.currencyRateId) {
        const currencyRate = await this.prisma.currencyRate.findUnique({
          where: { id: updateCurrencyPaymentMethodDto.currencyRateId },
        });

        if (!currencyRate) {
          throw new BadRequestException(
            `Currency rate con ID ${updateCurrencyPaymentMethodDto.currencyRateId} no encontrado`,
          );
        }
      }

      if (updateCurrencyPaymentMethodDto.ourPaymentMethodId) {
        const ourPaymentMethod = await this.prisma.ourPaymentMethod.findUnique({
          where: { id: updateCurrencyPaymentMethodDto.ourPaymentMethodId },
        });

        if (!ourPaymentMethod) {
          throw new BadRequestException(
            `Payment method con ID ${updateCurrencyPaymentMethodDto.ourPaymentMethodId} no encontrado`,
          );
        }
      }

      // Check for duplicates if changing the combination
      if (
        updateCurrencyPaymentMethodDto.currencyRateId ||
        updateCurrencyPaymentMethodDto.ourPaymentMethodId
      ) {
        const newCurrencyRateId =
          updateCurrencyPaymentMethodDto.currencyRateId ||
          currencyPaymentMethod.currencyRateId;
        const newOurPaymentMethodId =
          updateCurrencyPaymentMethodDto.ourPaymentMethodId ||
          currencyPaymentMethod.ourPaymentMethodId;

        const existingMethod =
          await this.prisma.currencyPaymentMethod.findFirst({
            where: {
              currencyRateId: newCurrencyRateId,
              ourPaymentMethodId: newOurPaymentMethodId,
              id: { not: id }, // Exclude current record
            },
          });

        if (existingMethod) {
          throw new BadRequestException(
            'Ya existe un método de pago para esta combinación de moneda y método de pago',
          );
        }
      }

      const updatedCurrencyPaymentMethod =
        await this.prisma.currencyPaymentMethod.update({
          where: { id },
          data: updateCurrencyPaymentMethodDto,
          include: {
            currencyRate: {
              include: {
                fromCurrencyBase: true,
                toCurrencyBase: true,
              },
            },
            ourPaymentMethod: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

      return {
        ok: true,
        msg: 'Método de pago de moneda actualizado correctamente',
        data: updatedCurrencyPaymentMethod,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error('Error updating currency payment method', error);
      throw new InternalServerErrorException(
        'Error al actualizar el método de pago de moneda',
      );
    }
  }

  // PRIVATE - Update only isActive flag (admin only)
  async updateCurrencyPaymentMethodActive(
    id: string,
    updateIsActiveDto: UpdateIsActiveCurrencyPaymentMethodDto,
    userAuthAdmin: UserAuth,
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

      const currencyPaymentMethod =
        await this.prisma.currencyPaymentMethod.findUnique({
          where: { id },
        });

      if (!currencyPaymentMethod) {
        throw new NotFoundException(
          `Método de pago de moneda con ID ${id} no encontrado`,
        );
      }

      const updated = await this.prisma.currencyPaymentMethod.update({
        where: { id },
        data: { isActive: updateIsActiveDto.isActive },
        include: {
          currencyRate: {
            include: {
              fromCurrencyBase: true,
              toCurrencyBase: true,
            },
          },
          ourPaymentMethod: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return {
        ok: true,
        msg: `Estado del método de pago de moneda actualizado correctamente`,
        data: updated,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error(
        'Error updating isActive for currency payment method',
        error,
      );
      throw new InternalServerErrorException(
        'Error al actualizar el estado del método de pago de moneda',
      );
    }
  }

  // PRIVATE - Delete currency payment method (admin only)
  async deleteCurrencyPaymentMethod(id: string, userAuthAdmin: UserAuth) {
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

      const currencyPaymentMethod =
        await this.prisma.currencyPaymentMethod.findUnique({
          where: { id },
        });

      if (!currencyPaymentMethod) {
        throw new NotFoundException(
          `Método de pago de moneda con ID ${id} no encontrado`,
        );
      }

      await this.prisma.currencyPaymentMethod.delete({ where: { id } });

      return {
        ok: true,
        msg: 'Método de pago de moneda eliminado correctamente',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error('Error deleting currency payment method', error);
      throw new InternalServerErrorException(
        'Error al eliminar el método de pago de moneda',
      );
    }
  }
}
