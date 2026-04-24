import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CreateCurrencyBaseDto,
  CurrencyBaseDto,
  UpdateAllCurrencyBaseDto,
} from 'src/admin/dto/rate-base/currency-base.dto';
import { GetUser } from 'src/auth/decorators/user/user.decorator';
import { Roles } from 'src/auth/interfaces/enums/roles';
import { UserAuth } from 'src/auth/interfaces/user/user-auth';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { UserService } from 'src/user/services/user/user.service';
import { CurrencyRateService } from '../currency-rate/currency-rate.service';
import { Prisma } from 'generated/prisma/client';
import { CurrencyRate } from 'generated/prisma/client';
import { CurrencyRateHistoryService } from '../currency-rate-history/currency-rate-history.service';
import { OperationMethod } from 'generated/prisma/client';

@Injectable()
export class CurrencyBaseService {
  constructor(
    private prisma: PrismaClientService,
    private userService: UserService,
    private currencyRateService: CurrencyRateService,
    private currencyRateHistoryService: CurrencyRateHistoryService,
  ) {}

  async createRateBase(createCurrencyBaseDto: CreateCurrencyBaseDto) {
    const {
      currency,
      name,
      countryName,
      buyRate,
      sellRate,
      marketRate,
      dolarBcvRate,
      eurBcvRate,
      isActive,
      isBase,
      isVolatile,
      isCripto,
    } = createCurrencyBaseDto;

    try {
      const isCurrencyDB = await this.prisma.currencyBaseRate.findUnique({
        where: {
          currency: currency,
        },
      });

      if (isCurrencyDB) {
        throw new BadRequestException(`La tasa: ${currency} ya existe`);
      }

      await this.prisma.currencyBaseRate.create({
        data: {
          currency,
          name,
          countryName,
          buyRate,
          sellRate,
          marketRate,
          dolarBcvRate,
          eurBcvRate,
          isActive,
          isBase,
          isVolatile,
          isCripto,
        },
      });

      return {
        ok: true,
        msg: 'Creado correctamente',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  async updateAllRateBase(
    updateAllCurrencyBaseDto: UpdateAllCurrencyBaseDto[],
    userAuthAdmin: any,
  ) {
    try {
      const ids = updateAllCurrencyBaseDto.map((dto) => dto.id);

      const existingRates = await this.prisma.currencyBaseRate.findMany({
        where: { id: { in: ids } },
      });

      const existingMap = new Map(existingRates.map((rate) => [rate.id, rate]));

      const ratesToUpdate = updateAllCurrencyBaseDto.filter((dto) => {
        const existing = existingMap.get(dto.id);
        return (
          existing &&
          (dto.buyRate !== existing.buyRate ||
            dto.sellRate !== existing.sellRate ||
            dto.marketRate !== existing.marketRate ||
            dto.dolarBcvRate !== existing.dolarBcvRate ||
            dto.eurBcvRate !== existing.eurBcvRate ||
            dto.isActive !== existing.isActive ||
            dto.isBase !== existing.isBase ||
            dto.isVolatile !== existing.isVolatile)
        );
      });

      if (ratesToUpdate.length > 0) {
        await this.prisma.$transaction(
          ratesToUpdate.map((dto) =>
            this.prisma.currencyBaseRate.update({
              where: { id: dto.id },
              data: {
                buyRate: dto.buyRate,
                sellRate: dto.sellRate,
                marketRate: dto.marketRate,
                dolarBcvRate: dto.dolarBcvRate,
                eurBcvRate: dto.eurBcvRate,
                isActive: dto.isActive,
                isBase: dto.isBase,
                isVolatile: dto.isVolatile,
                updatedAt: new Date(),
              },
            }),
          ),
        );
      }
      await this.updateAllCurrencyRatesFromBase(ratesToUpdate, userAuthAdmin);

      return {
        ok: true,
        data: ratesToUpdate,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  private async updateAllCurrencyRatesFromBase(
    updatedBaseRates: UpdateAllCurrencyBaseDto[],
    userAuthAdmin: any,
  ) {
    try {
      const allCurrencyRates = await this.prisma.currencyRate.findMany({
        include: {
          fromCurrencyBase: true,
          toCurrencyBase: true,
        },
      });

      const updates: Prisma.PrismaPromise<CurrencyRate>[] = [];
      const historyCreations: Array<{
        rateId: string;
        oldBuyRate: number;
        oldSellRate: number;
        newBuyRate: number;
        newSellRate: number;
        fromName: string;
        toName: string;
      }> = [];

      for (const currencyRate of allCurrencyRates) {
        let shouldUpdate = false;
        const updateData: any = {};

        const fromBaseRate = updatedBaseRates.find(
          (rate) => rate.currency === currencyRate.fromCurrency,
        );

        const toBaseRate = updatedBaseRates.find(
          (rate) => rate.currency === currencyRate.toCurrency,
        );

        if (fromBaseRate || toBaseRate) {
          const exchangePair = `${currencyRate.fromCurrency} → ${currencyRate.toCurrency}`;
          let newRate: Record<string, number | string> = {};

          try {
            const calculatedRate = await this.currencyRateService[
              'exchangeService'
            ].calculateRate(exchangePair, newRate);

            Object.assign(updateData, {
              buyRate: Number(calculatedRate.buyRate),
              sellRate: Number(calculatedRate.sellRate),
            });
            shouldUpdate = true;
          } catch (error) {
            shouldUpdate = false;
          }

          if (shouldUpdate) {
            // Guardar datos para historial
            historyCreations.push({
              rateId: currencyRate.id,
              oldBuyRate: currencyRate.buyRate,
              oldSellRate: currencyRate.sellRate,
              newBuyRate: updateData.buyRate,
              newSellRate: updateData.sellRate,
              fromName: currencyRate.fromCurrencyBase.name,
              toName: currencyRate.toCurrencyBase.name,
            });

            updates.push(
              this.prisma.currencyRate.update({
                where: { id: currencyRate.id },
                data: {
                  ...updateData,
                  updatedAt: new Date(),
                },
              }),
            );
          }
        }
      }

      if (updates.length > 0) {
        // Ejecutar actualizaciones en transacción
        await this.prisma.$transaction(updates);

        // Crear historiales después de actualizar
        for (const historyData of historyCreations) {
          const updatedRate = await this.prisma.currencyRate.findUnique({
            where: { id: historyData.rateId },
          });

          if (updatedRate) {
            const nf = new Intl.NumberFormat('es-ES', {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            });
            const oldBuy = nf.format(historyData.oldBuyRate);
            const newBuy = nf.format(historyData.newBuyRate);
            const oldSell = nf.format(historyData.oldSellRate);
            const newSell = nf.format(historyData.newSellRate);

            const operation = `Se actualizó la tasa de cambio de ${historyData.fromName} a ${historyData.toName} - Compra: ${oldBuy} → ${newBuy}, Venta: ${oldSell} → ${newSell}`;

            await this.currencyRateHistoryService.createFromCurrencyRate(
              operation,
              OperationMethod.UPDATE,
              updatedRate.id,
              {
                firstCreatedAt: updatedRate.createdAt.toISOString(),
                buyRate: updatedRate.buyRate,
                sellRate: updatedRate.sellRate,
                isActive: updatedRate.isActive,
                name: updatedRate.name,
                newUpdatedAt: updatedRate.updatedAt.toISOString(),
                fromCurrency: updatedRate.fromCurrency,
                toCurrency: updatedRate.toCurrency,
                marketRate: updatedRate.marketRate ?? undefined,
                dolarBcvRate: updatedRate.dolarBcvRate ?? undefined,
                eurBcvRate: updatedRate.eurBcvRate ?? undefined,
              },
              userAuthAdmin,
            );
          }
        }
      }
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al actualizar tipos de cambio derivados',
      );
    }
  }

  async getAllRateBase(@GetUser() userAuthAdmin: UserAuth) {
    const { sub, exp, iat } = userAuthAdmin as {
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

    const baseRates = await this.prisma.currencyBaseRate.findMany();

    return {
      ok: true,
      data: baseRates,
    };
  }

  async getRateBase(currencyBaseDto: CurrencyBaseDto) {
    try {
      const isCurrency = await this.prisma.currencyBaseRate.findUnique({
        where: {
          currency: currencyBaseDto.currency.toUpperCase(),
        },
      });

      if (!isCurrency) {
        throw new NotFoundException(`La tasa base: ${isCurrency} no existe`);
      }

      return {
        ok: true,
        currency: isCurrency,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }
}
