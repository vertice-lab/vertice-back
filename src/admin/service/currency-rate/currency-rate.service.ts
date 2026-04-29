import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CreateCurrencyRateDto,
  DestroyCurrencyRate,
  GetCurrencyRateByUsdDto,
  GetCurrencyRateDto,
  UpdateIsActiveRateDto,
} from 'src/admin/dto/rate/currency-rate.dto';
import { GetUser } from 'src/auth/decorators/user/user.decorator';
import { Roles } from 'src/auth/interfaces/enums/roles';
import { UserAuth } from 'src/auth/interfaces/user/user-auth';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { UserService } from 'src/user/services/user/user.service';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';
import { CurrencyRateHistoryService } from '../currency-rate-history/currency-rate-history.service';

@Injectable()
export class CurrencyRateService {
  private readonly logger = new Logger(CurrencyRateService.name);

  constructor(
    private prisma: PrismaClientService,
    private userService: UserService,
    private exchangeService: ExchangeRateService,
    private currencyRateHistoryService: CurrencyRateHistoryService,
  ) {}

  //public
  async getRate(getCurrencyRateIdDto: GetCurrencyRateDto) {
    const fromCurrencyUpperCase = getCurrencyRateIdDto.fromCurrency;
    const toCurrencyUpperCase = getCurrencyRateIdDto.toCurrency;

    const rate = await this.prisma.currencyRate.findUnique({
      where: {
        fromCurrency_toCurrency: {
          fromCurrency: fromCurrencyUpperCase,
          toCurrency: toCurrencyUpperCase,
        },
        isActive: true,
      },
      
    });

    return {
      ok: true,
      data: rate,
    };
  }

  //public
  async getRateCurrencyPaymentMethod(getCurrencyRateIdDto: GetCurrencyRateDto) {
    const fromCurrencyUpperCase = getCurrencyRateIdDto.fromCurrency;
    const toCurrencyUpperCase = getCurrencyRateIdDto.toCurrency;

    const rate = await this.prisma.currencyRate.findUnique({
      where: {
        fromCurrency_toCurrency: {
          fromCurrency: fromCurrencyUpperCase,
          toCurrency: toCurrencyUpperCase,
        },
        isActive: true,
      },
      select: {
        paymentMethods: true,
      },
    });

    return {
      ok: true,
      data: rate,
    };
  }

  async getRateByUsd(getCurrencyRateByUsdDto: GetCurrencyRateByUsdDto) {
    const fromCurrencyUpperCase = getCurrencyRateByUsdDto.fromCurrency;
    const toCurrencyUpperCase = 'USD';

    const rate = await this.prisma.currencyRate.findUnique({
      where: {
        fromCurrency_toCurrency: {
          fromCurrency: fromCurrencyUpperCase,
          toCurrency: toCurrencyUpperCase,
        },
      },
    });

    return {
      ok: true,
      data: rate,
    };
  }

  //private
  async getAllCurrencyRates(@GetUser() userAuthAdmin: UserAuth) {
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
      const currencyRates = await this.prisma.currencyRate.findMany({
        orderBy: {
          fromCurrency: 'asc',
        },
        include: {
          paymentMethods: {
            include: {
              ourPaymentMethod: true,
            },
          },
        },
        
      });

      return {
        ok: true,
        data: currencyRates,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al obtener los tipos de cambios',
      );
    }
  }

  // async createCurrencyRates(createCurrencyRateIdDto: CreateCurrencyRateDto, userAuthAdmin: any) {
  //   const { fromCurrency, toCurrency, isActive } = createCurrencyRateIdDto;

  //   try {
  //     const fromCurrencyUpper = fromCurrency.toUpperCase();
  //     const toCurrencyUpper = toCurrency.toUpperCase();

  //     const existingRate = await this.prisma.currencyRate.findUnique({
  //       where: {
  //         fromCurrency_toCurrency: {
  //           fromCurrency: fromCurrencyUpper,
  //           toCurrency: toCurrencyUpper,
  //         },
  //       },
  //     }) || null;

  //     if (existingRate) {
  //       throw new BadRequestException('Tipo de cambio existente');
  //     }

  //     const exchangePair = `${fromCurrencyUpper} → ${toCurrencyUpper}`;

  //     let result: Record<string, number | string> = {};
  //     let newRate: Record<string, number | string> = {};

  //     switch(exchangePair) {
  //       case 'ARS → BS':
  //         const arsToBsRate = await this.exchangeService.calculateArsToBs(exchangePair, newRate)
  //         result = arsToBsRate
  //         break;
  //       case 'ARS → COP':
  //         const arsToCop = await this.exchangeService.calculateArsToCop(exchangePair, newRate)
  //         result = arsToCop
  //         break;
  //       case 'ARS → USD':
  //         const arsToUsd = await this.exchangeService.calculateArsToUsd(exchangePair, newRate)
  //         result = arsToUsd
  //         break;
  //       case 'ARS → EUR':
  //         const arsToEur = await this.exchangeService.calculateArsToEur(exchangePair, newRate)
  //         result = arsToEur
  //         break;
  //       case 'ARS → CLP':
  //         const arsToClp = await this.exchangeService.calculateArsToClp(exchangePair, newRate)
  //         result = arsToClp
  //         break;
  //       case 'ARS → PEN':
  //         const arsToPen = await this.exchangeService.calculateArsToPen(exchangePair, newRate)
  //         result = arsToPen
  //         break;

  //       case 'CLP → BS':
  //         const clpToBs = await this.exchangeService.calculateClpToBs(exchangePair, newRate)
  //         result = clpToBs
  //         break;
  //       case 'CLP → ARS':
  //         const clpToArs = await this.exchangeService.calculateClpToArs(exchangePair, newRate)
  //         result = clpToArs
  //         break;
  //       case 'CLP → EUR':
  //         const clpToEur = await this.exchangeService.calculateClpToEur(exchangePair, newRate)
  //         result = clpToEur
  //         break;
  //       case 'CLP → USD':
  //         const clpToUsd = await this.exchangeService.calculateClpToUsd(exchangePair, newRate)
  //         result = clpToUsd
  //         break;
  //       case 'CLP → COP':
  //         const clpToCop = await this.exchangeService.calculateClpToCop(exchangePair, newRate)
  //         result = clpToCop
  //         break;
  //       case 'CLP → PEN':
  //         const clpTopPen = await this.exchangeService.calculateClpToPen(exchangePair, newRate)
  //         result = clpTopPen
  //         break;

  //       case 'USD → ARS':
  //         const usdToArs = await this.exchangeService.calculateUsdToArs(exchangePair, newRate)
  //         result = usdToArs
  //         break;
  //       case 'USD → BS':
  //         const usdToBs = await this.exchangeService.calculateUsdToBs(exchangePair, newRate)
  //         result = usdToBs
  //         break;
  //       case 'USD → CLP':
  //         const usdToClp = await this.exchangeService.calculateUsdToClp(exchangePair, newRate)
  //         result = usdToClp
  //         break;
  //       case 'USD → EUR':
  //         const usdToEur = await this.exchangeService.calculateUsdToEur(exchangePair, newRate)
  //         result = usdToEur
  //         break;
  //       case 'USD → COP':
  //         const usdToCop = await this.exchangeService.calculateUsdToCop(exchangePair, newRate)
  //         result = usdToCop
  //         break;
  //       case 'USD → PEN':
  //         const usdToPen = await this.exchangeService.calculateUsdToPen(exchangePair, newRate)
  //         result = usdToPen
  //         break;

  //       case 'EUR → ARS':
  //         const eurToArs = await this.exchangeService.calculateEurToArs(exchangePair, newRate)
  //         result = eurToArs
  //         break;
  //       case 'EUR → CLP':
  //         const eurToClp = await this.exchangeService.calculateEurToClp(exchangePair, newRate)
  //         result = eurToClp
  //         break;
  //       case 'EUR → BS':
  //         const eurToBs = await this.exchangeService.calculateEurToBs(exchangePair, newRate)
  //         result = eurToBs
  //         break;
  //       case 'EUR → USD':
  //         const eurToUsd = await this.exchangeService.calculateEurToUsd(exchangePair, newRate)
  //         result = eurToUsd
  //         break;
  //       case 'EUR → COP':
  //         const eurToCop = await this.exchangeService.calculateEurToCop(exchangePair, newRate)
  //         result = eurToCop
  //         break;
  //       case 'EUR → PEN':
  //         const eurToPen = await this.exchangeService.calculateEurToPen(exchangePair, newRate)
  //         result = eurToPen
  //         break;

  //       case 'COP → ARS':
  //         const copToArs = await this.exchangeService.calculateCopToArs(exchangePair, newRate)
  //         result = copToArs
  //         break;
  //       case 'COP → BS':
  //         const copToBs = await this.exchangeService.calculateCopToBs(exchangePair, newRate)
  //         result = copToBs
  //         break;
  //       case 'COP → EUR':
  //         const copToEur = await this.exchangeService.calculateCopToEur(exchangePair, newRate)
  //         result = copToEur
  //         break;
  //       case 'COP → CLP':
  //         const copToClp = await this.exchangeService.calculateCopToClp(exchangePair, newRate)
  //         result = copToClp
  //         break;
  //       case 'COP → USD':
  //         const copToUsd = await this.exchangeService.calculateCopToUsd(exchangePair, newRate)
  //         result = copToUsd
  //         break;
  //       case 'COP → PEN':
  //         const copToPen = await this.exchangeService.calculateCopToPen(exchangePair, newRate)
  //         result = copToPen
  //         break;

  //       case 'BS → ARS':
  //         const bsToArs = await this.exchangeService.calculateBsToArs(exchangePair, newRate)
  //         result = bsToArs
  //         break;
  //       case 'BS → COP':
  //         const bsToCop = await this.exchangeService.calculateBsToCop(exchangePair, newRate)
  //         result = bsToCop
  //       case 'BS → USD':
  //         const bsToUsd = await this.exchangeService.calculateBsToUsd(exchangePair, newRate)
  //         result = bsToUsd
  //         break;
  //       case 'BS → EUR':
  //         const bsToEur = await this.exchangeService.calculateBsToEur(exchangePair, newRate)
  //         result = bsToEur
  //         break;
  //       case 'BS → CLP':
  //         const bsToClp = await this.exchangeService.calculateBsToClp(exchangePair, newRate)
  //         result = bsToClp
  //         break;
  //       case 'BS → PEN':
  //         const bsToPen = await this.exchangeService.calculateBsToPen(exchangePair, newRate)
  //         result = bsToPen
  //         break;

  //       case 'PEN → ARS':
  //         const penToArs = await this.exchangeService.calculatePenToArs(exchangePair, newRate)
  //         result = penToArs
  //         break;
  //       case 'PEN → COP':
  //         const penToCop = await this.exchangeService.calculatePenToCop(exchangePair, newRate)
  //         result = penToCop
  //         break;
  //       case 'PEN → USD':
  //         const penToUsd = await this.exchangeService.calculatePenToUsd(exchangePair, newRate)
  //         result = penToUsd
  //         break;
  //       case 'PEN → EUR':
  //         const penToEur = await this.exchangeService.calculatePenToEur(exchangePair, newRate)
  //         result = penToEur
  //         break;
  //       case 'PEN → CLP':
  //         const penToClp = await this.exchangeService.calculatePenToClp(exchangePair, newRate)
  //         result = penToClp
  //         break;
  //       case 'PEN → BS':
  //         const penToBs = await this.exchangeService.calculatePenToBs(exchangePair, newRate)
  //         result = penToBs
  //         break;

  //     }

  //     type Rate = { fromCurrency: string; toCurrency: string; buyRate: number; sellRate: number;}

  //     const data: Rate = {
  //       fromCurrency: result.fromCurrency.toString(),
  //       toCurrency: result.toCurrency.toString(),
  //       buyRate: Number(result.buyRate),
  //       sellRate: Number(result.sellRate)
  //     }

  //     const createdRate = await this.prisma.currencyRate.create({
  //       data: {
  //         fromCurrency: data.fromCurrency,
  //         toCurrency: data.toCurrency,
  //         buyRate: data.buyRate,
  //         sellRate: data.sellRate,
  //         name: this.exchangeService.generateName(fromCurrency, toCurrency),
  //         isActive: isActive,
  //       }
  //     })

  //     try {
  //       const fromBase = await this.prisma.currencyBaseRate.findUnique({ where: { currency: data.fromCurrency } });
  //       const toBase = await this.prisma.currencyBaseRate.findUnique({ where: { currency: data.toCurrency } });
  //       const operationMsg = `Se creó nueva tasa de cambio de ${fromBase?.name || data.fromCurrency} a ${toBase?.name || data.toCurrency}`;

  //       await this.currencyRateHistoryService.createFromCurrencyRate(
  //         operationMsg,
  //         'CREATE',
  //         createdRate.id,
  //         {
  //           firstCreatedAt: new Date().toISOString(),
  //           buyRate: data.buyRate,
  //           isActive: Boolean(isActive),
  //           name: this.exchangeService.generateName(fromCurrency, toCurrency),
  //           sellRate: data.sellRate,
  //           newUpdatedAt: new Date().toISOString(),
  //           fromCurrency: data.fromCurrency,
  //           toCurrency: data.toCurrency,
  //           uniqueRate: undefined,
  //         },
  //         userAuthAdmin,
  //       );
  //     } catch (e) {
  //       this.logger.warn('Could not create history entry for new rate', e);
  //     }

  //     return {
  //       ok: true,
  //       msg: 'Creado Correctamente',
  //     };
  //   } catch (error) {
  //     if (error instanceof BadRequestException) {
  //       throw error;
  //     }
  //     this.logger.error('Error creating currency rates', error);
  //     throw new InternalServerErrorException();
  //   }
  // }

  async createCurrencyRates(
    createCurrencyRateIdDto: CreateCurrencyRateDto,
    userAuthAdmin: UserAuth,
  ) {
    const { fromCurrency, toCurrency, isActive } = createCurrencyRateIdDto;

    try {
      const fromCurrencyUpper = fromCurrency.toUpperCase();
      const toCurrencyUpper = toCurrency.toUpperCase();

      const existingRate = await this.prisma.currencyRate.findUnique({
        where: {
          fromCurrency_toCurrency: {
            fromCurrency: fromCurrencyUpper,
            toCurrency: toCurrencyUpper,
          },
        },
      });

      if (existingRate) {
        throw new BadRequestException('Tipo de cambio existente');
      }

      const exchangePair = this.exchangeService.generateName(
        fromCurrencyUpper,
        toCurrencyUpper,
      );

      const newRateResult: Record<string, number | string> = {};
      const result = await this.exchangeService.calculateRate(
        exchangePair,
        newRateResult,
      );

      type Rate = {
        fromCurrency: string;
        toCurrency: string;
        buyRate: number;
        sellRate: number;
      };
      const data: Rate = {
        fromCurrency: result.fromCurrency.toString(),
        toCurrency: result.toCurrency.toString(),
        buyRate: Number(result.buyRate),
        sellRate: Number(result.sellRate),
      };

      const createdRate = await this.prisma.currencyRate.create({
        data: {
          fromCurrency: data.fromCurrency,
          toCurrency: data.toCurrency,
          buyRate: data.buyRate,
          sellRate: data.sellRate,
          name: exchangePair,
          isActive: isActive,
        },
      });

      try {
        const fromBase = await this.prisma.currencyBaseRate.findUnique({
          where: { currency: data.fromCurrency },
        });
        const toBase = await this.prisma.currencyBaseRate.findUnique({
          where: { currency: data.toCurrency },
        });
        const operationMsg = `Se creó nueva tasa de cambio de ${fromBase?.name || data.fromCurrency} a ${toBase?.name || data.toCurrency}`;

        await this.currencyRateHistoryService.createFromCurrencyRate(
          operationMsg,
          'CREATE',
          createdRate.id,
          {
            firstCreatedAt: new Date().toISOString(),
            buyRate: data.buyRate,
            isActive: Boolean(isActive),
            name: exchangePair,
            sellRate: data.sellRate,
            newUpdatedAt: new Date().toISOString(),
            fromCurrency: data.fromCurrency,
            toCurrency: data.toCurrency,
            marketRate: undefined,
          },
          userAuthAdmin,
        );
      } catch (e) {
        this.logger.warn('Could not create history entry for new rate', e);
      }

      return {
        ok: true,
        msg: 'Creado Correctamente',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error creating currency rates', error);
      throw new InternalServerErrorException();
    }
  }

  async updateIsActiveRate(
    rateId: string,
    updateIsActiveRateDto: UpdateIsActiveRateDto,
    userAuthAdmin: UserAuth,
  ) {
    try {
      const rate = await this.prisma.currencyRate.findUnique({
        where: {
          id: rateId,
        },
      });

      if (!rate) {
        throw new NotFoundException(`Tipo de cambio: ${rate} no encontrado`);
      }

      await this.prisma.currencyRate.update({
        where: {
          id: rateId,
        },
        data: {
          isActive: updateIsActiveRateDto.isActive,
        },
      });
      try {
        const fromBase = await this.prisma.currencyBaseRate.findUnique({
          where: { currency: rate.fromCurrency },
        });
        const toBase = await this.prisma.currencyBaseRate.findUnique({
          where: { currency: rate.toCurrency },
        });
        const statusText = updateIsActiveRateDto.isActive
          ? 'activó'
          : 'desactivó';
        const operationMsg = `Se ${statusText} la tasa de cambio de ${fromBase?.name || rate.fromCurrency} a ${toBase?.name || rate.toCurrency}`;

        await this.currencyRateHistoryService.createFromCurrencyRate(
          operationMsg,
          'UPDATE',
          rateId,
          {
            firstCreatedAt: rate.createdAt.toISOString(),
            buyRate: rate.buyRate,
            isActive: updateIsActiveRateDto.isActive,
            name: rate.name,
            sellRate: rate.sellRate,
            newUpdatedAt: new Date().toISOString(),
            fromCurrency: rate.fromCurrency,
            toCurrency: rate.toCurrency,
          },
          userAuthAdmin,
        );
      } catch (e) {
        this.logger.warn('Could not create history entry for rate update', e);
      }

      return {
        ok: true,
        msg: `Tipo de cambio: ${rate.fromCurrency} - ${rate.toCurrency} actualizado correctamente`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar las tasa');
    }
  }

  async destroyCurrencyRate(destroyCurrencyRate: DestroyCurrencyRate) {
    const { fromCurrency, toCurrency } = destroyCurrencyRate;

    try {
      const rate = await this.prisma.currencyRate.findUnique({
        where: { fromCurrency_toCurrency: { fromCurrency, toCurrency } },
      });

      if (!rate) throw new NotFoundException('Tasa no encontrada');

      await this.prisma.$transaction([
        this.prisma.currencyRateHistory.deleteMany({
          where: { currencyRateId: rate.id },
        }),
        this.prisma.currencyRate.delete({
          where: { id: rate.id },
        }),
      ]);

      return { ok: true, msg: 'Tasa e historial eliminados' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException();
    }
  }
}
