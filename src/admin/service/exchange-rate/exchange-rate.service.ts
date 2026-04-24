import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';

interface TypeRate {
  marketRate: number | null;
  dolarBcvRate: number | null;
  eurBcvRate: number | null;
  sellRate: number | null;
  id: string;
  currency: string;
  name: string;
  buyRate: number | null;
  isActive: boolean;
  isBase: boolean;
  isVolatile: boolean;
  updatedAt: Date;
  createdAt: Date;
  countryName: string;
}

type CalculationFunction = (
  fromBaseRate: TypeRate,
  toBaseRate: TypeRate,
) => number;

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);

  constructor(private prisma: PrismaClientService) { }

  private readonly calculationMap: Record<string, CalculationFunction> = {
    //ARS ✅
    'ARS → BS': (from, to) => Number(to.marketRate! / from.sellRate!),
    'ARS → USD': (from) => Number(from.sellRate!),
    'ARS → EUR': (from, to) => Number(from.sellRate! * to.sellRate!),
    'ARS → COP': (from, to) => Number(from.sellRate! / to.buyRate!),
    'ARS → CLP': (from, to) => Number(from.sellRate! / to.buyRate!),
    'ARS → PEN': (from, to) => Number(from.sellRate! / to.buyRate!),
    'ARS → USDT': (from, to) => Number(from.sellRate! * to.sellRate!),

    //CLP ✅
    'CLP → BS': (from, to) => Number(to.marketRate! / from.sellRate!),
    'CLP → ARS': (from, to) => Number(from.sellRate! / to.buyRate!),
    'CLP → COP': (from, to) => Number(from.sellRate! / to.buyRate!),
    'CLP → EUR': (from, to) => Number(from.sellRate! * to.sellRate!),
    'CLP → USD': (from) => Number(from.sellRate!),
    'CLP → PEN': (from, to) => Number(from.sellRate! / to.buyRate!),
    'CLP → USDT': (from, to) => Number(from.sellRate! * to.sellRate!),

    //BS ✅
    'BS → COP': (from, to) => Number(to.buyRate! / from.marketRate!),
    'BS → ARS': (from, to) => Number(from.marketRate! / to.buyRate!),
    'BS → CLP': (from, to) => Number(from.marketRate! / to.buyRate!),
    'BS → USD': (from) => Number(from.dolarBcvRate!),
    'BS → EUR': (from) => Number(from.eurBcvRate!),
    'BS → PEN': (from, to) => Number(from.marketRate! / to.buyRate!),
    'BS → USDT': (from, to) => Number(from.marketRate! * to.sellRate!),

    //COP ✅
    'COP → ARS': (from, to) => Number(from.sellRate! / to.buyRate!),
    'COP → BS': (from, to) => Number(from.sellRate! / to.marketRate!),
    'COP → EUR': (from, to) => Number(from.sellRate! * to.sellRate!),
    'COP → CLP': (from, to) => Number(from.sellRate! / to.buyRate!),
    'COP → USD': (from) => Number(from.sellRate!),
    'COP → PEN': (from, to) => Number(from.sellRate! / to.buyRate!),
    'COP → USDT': (from, to) => Number(from.sellRate! * to.sellRate!),

    //USD ✅
    'USD → ARS': (_, to) => Number(to.buyRate!),
    'USD → BS': (_, to) => Number(to.dolarBcvRate!),
    'USD → COP': (_, to) => Number(to.buyRate!),
    'USD → CLP': (_, to) => Number(to.buyRate!),
    'USD → EUR': (from, to) => Number(from.marketRate! / to.sellRate!),
    'USD → PEN': (_, to) => Number(to.buyRate!),
    'USD → USDT': (_, to) => Number(to.sellRate!),

    //USDT ✅
    'USDT → USD': (from, _) => Number(from.buyRate!),
    'USDT → EUR': (from, to) => Number(from.buyRate! / to.sellRate!),
    'USDT → ARS': (from, to) => Number(from.buyRate! * to.buyRate!),
    'USDT → COP': (from, to) => Number(from.buyRate! * to.buyRate!),
    'USDT → BS': (from, to) => Number(from.buyRate! * to.marketRate!),
    'USDT → PEN': (from, to) => Number(from.buyRate! * to.buyRate!),
    'USDT → CLP': (from, to) => Number(from.buyRate! * to.buyRate!),

    //EUR ✅
    'EUR → USD': (from, to) => Number(from.buyRate! * to.marketRate!),
    'EUR → ARS': (from, to) => Number(to.buyRate! * from.buyRate!),
    'EUR → CLP': (from, to) => Number(to.buyRate! * from.buyRate!),
    'EUR → BS': (_, to) => Number(to.eurBcvRate!),
    'EUR → COP': (from, to) => Number(to.buyRate! * from.buyRate!),
    'EUR → PEN': (from, to) => Number(from.buyRate! * to.buyRate!),
    'EUR → USDT': (from, to) => Number(from.buyRate! / to.sellRate!),

    //SOLES ✅
    'PEN → ARS': (from, to) => Number(to.buyRate! / from.sellRate!),
    'PEN → COP': (from, to) => Number(to.buyRate! / from.sellRate!),
    'PEN → BS': (from, to) => Number(to.marketRate! / from.sellRate!),
    'PEN → EUR': (from, to) => Number(from.sellRate! * to.sellRate!),
    'PEN → CLP': (from, to) => Number(to.buyRate! / from.sellRate!),
    'PEN → USD': (from) => Number(from.sellRate!),
    'PEN → USDT': (from, to) => Number(from.sellRate! * to.sellRate!),
  };

  /** Spread por defecto (%) para pares no listados en spreadOverrides */
  private readonly DEFAULT_SPREAD = 10;

  /**
   * Mapa de spread personalizado por par de cambio.
   * - Clave: nombre del par (e.g. 'USD → BS')
   * - Valor: porcentaje de spread (0 = sin spread, 5 = 5%, etc.)
   * - Pares NO listados aquí usan DEFAULT_SPREAD (10%)
   */
  private readonly spreadOverrides = new Map<string, number>([
    // 0% spread
    ['USDT → USD', 0],
    ['USDT → EUR', 0],
    ['USD → COP', 0],
    ['USD → BS', 0],
    ['EUR → BS', 0],
    ['BS → USD', 0],
    ['BS → EUR', 0],
    ['ARS → USDT', 0],
    ['CLP → USDT', 0],
    ['BS → USDT', 0],
    ['COP → USDT', 0],
    ['USD → USDT', 0],
    ['EUR → USDT', 0],
    ['PEN → USDT', 0],

    // Ejemplo: pares con spread personalizado
    ['CLP → BS', 7],
    ['ARS → BS', 5],
    ['USD → CLP', 7],
    ['USD → ARS', 7],
    ['USD → PEN', 7],
    ['EUR → COP', 5],
    ['EUR → PEN', 5],
    ['PEN → BS', 7],

  ]);

  /**
   * Devuelve el factor de margen para un par dado.
   * Ej: 10% → 0.90, 5% → 0.95, 0% → 1.00
   */
  private getMarginForPair(exchangePair: string): number {
    const spreadPercent =
      this.spreadOverrides.get(exchangePair) ?? this.DEFAULT_SPREAD;
    return 1 - spreadPercent / 100;
  }

  public generateName(fromCurrency: string, toCurrency: string) {
    return `${fromCurrency} → ${toCurrency}`;
  }

  public getTypeCurrency(exchangePair: string) {
    const pairOne = exchangePair.split(' ')[0];
    const pairTwo = exchangePair.split(' ').findLast((value) => value);

    return {
      pairOne,
      pairTwo,
    };
  }

  public async getBaseRate(rate: string) {
    const res = await this.prisma.currencyBaseRate.findUnique({
      where: { currency: rate.toUpperCase() },
    });

    return res;
  }

  public async calculateRate(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const { pairOne: fromCurrency, pairTwo: toCurrency } =
      this.getTypeCurrency(exchangePair);

    const fromBaseRate = await this.getBaseRate(fromCurrency);
    const toBaseRate = await this.getBaseRate(toCurrency!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }
    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const calculateBase = this.calculationMap[exchangePair];

    if (!calculateBase) {
      throw new BadRequestException(
        `No se encontró lógica de cálculo para el par ${exchangePair}`,
      );
    }

    const base = calculateBase(fromBaseRate, toBaseRate);
    const MARGIN = this.getMarginForPair(exchangePair);

    const buyRate = base * MARGIN;
    const sellRate = base / MARGIN;

    newRate.fromCurrency = fromCurrency;
    newRate.toCurrency = toCurrency!;
    newRate.buyRate = Number(buyRate);
    newRate.sellRate = Number(sellRate);

    return newRate;
  }

  //ARS ✅
  public async calculateArsToBs(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const arsToBs = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(arsToBs.pairOne);
    const toBaseRate = await this.getBaseRate(arsToBs.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(toBaseRate.marketRate! / fromBaseRate.sellRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = arsToBs.pairOne),
      (newRate.toCurrency = arsToBs.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateArsToUsd(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const arsToUsd = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(arsToUsd.pairOne);
    const toBaseRate = await this.getBaseRate(arsToUsd.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.sellRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //este

    ((newRate.fromCurrency = arsToUsd.pairOne),
      (newRate.toCurrency = arsToUsd.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateArsToEur(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const arsToEur = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(arsToEur.pairOne);
    const toBaseRate = await this.getBaseRate(arsToEur.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.sellRate! * toBaseRate.sellRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //este

    ((newRate.fromCurrency = arsToEur.pairOne),
      (newRate.toCurrency = arsToEur.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateArsToCop(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const arsToCop = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(arsToCop.pairOne);
    const toBaseRate = await this.getBaseRate(arsToCop.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.sellRate! / toBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //este en front

    ((newRate.fromCurrency = arsToCop.pairOne),
      (newRate.toCurrency = arsToCop.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateArsToClp(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const arsToClp = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(arsToClp.pairOne);
    const toBaseRate = await this.getBaseRate(arsToClp.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.sellRate! / toBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //este

    ((newRate.fromCurrency = arsToClp.pairOne),
      (newRate.toCurrency = arsToClp.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateArsToPen(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const arsToPen = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(arsToPen.pairOne);
    const toBaseRate = await this.getBaseRate(arsToPen.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.sellRate! / toBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //este

    ((newRate.fromCurrency = arsToPen.pairOne),
      (newRate.toCurrency = arsToPen.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  //CLP ✅
  public async calculateClpToBs(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const clpToBs = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(clpToBs.pairOne);
    const toBaseRate = await this.getBaseRate(clpToBs.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(toBaseRate.marketRate! / fromBaseRate.sellRate!);
    const minusTenPercent = Number(base * 0.9); //este en front
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = clpToBs.pairOne),
      (newRate.toCurrency = clpToBs.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateClpToArs(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const clpToArs = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(clpToArs.pairOne);
    const toBaseRate = await this.getBaseRate(clpToArs.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.sellRate! / toBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //este en front

    ((newRate.fromCurrency = clpToArs.pairOne),
      (newRate.toCurrency = clpToArs.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateClpToCop(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const clpToCop = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(clpToCop.pairOne);
    const toBaseRate = await this.getBaseRate(clpToCop.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.sellRate! / toBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //este en front

    ((newRate.fromCurrency = clpToCop.pairOne),
      (newRate.toCurrency = clpToCop.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateClpToEur(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const clpToEur = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(clpToEur.pairOne);
    const toBaseRate = await this.getBaseRate(clpToEur.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.sellRate! * toBaseRate.sellRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //este en front

    ((newRate.fromCurrency = clpToEur.pairOne),
      (newRate.toCurrency = clpToEur.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateClpToUsd(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const clpToUsd = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(clpToUsd.pairOne);
    const toBaseRate = await this.getBaseRate(clpToUsd.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.sellRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //este en front

    ((newRate.fromCurrency = clpToUsd.pairOne),
      (newRate.toCurrency = clpToUsd.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateClpToPen(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const clpToUsd = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(clpToUsd.pairOne);
    const toBaseRate = await this.getBaseRate(clpToUsd.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.sellRate! / toBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //este en front

    ((newRate.fromCurrency = clpToUsd.pairOne),
      (newRate.toCurrency = clpToUsd.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  //BS ✅
  public async calculateBsToCop(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const bsToCop = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(bsToCop.pairOne);
    const toBaseRate = await this.getBaseRate(bsToCop.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(toBaseRate.buyRate! / fromBaseRate.marketRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = bsToCop.pairOne),
      (newRate.toCurrency = bsToCop.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateBsToArs(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const bsToArs = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(bsToArs.pairOne);
    const toBaseRate = await this.getBaseRate(bsToArs.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.marketRate! / toBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = bsToArs.pairOne),
      (newRate.toCurrency = bsToArs.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateBsToClp(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const bsToClp = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(bsToClp.pairOne);
    const toBaseRate = await this.getBaseRate(bsToClp.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.marketRate! / toBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9); //este en front
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = bsToClp.pairOne),
      (newRate.toCurrency = bsToClp.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateBsToUsd(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const bsToUsd = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(bsToUsd.pairOne);
    const toBaseRate = await this.getBaseRate(bsToUsd.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.marketRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //esta

    ((newRate.fromCurrency = bsToUsd.pairOne),
      (newRate.toCurrency = bsToUsd.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateBsToEur(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const bsToEur = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(bsToEur.pairOne);
    const toBaseRate = await this.getBaseRate(bsToEur.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.marketRate! * toBaseRate.sellRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //esta

    ((newRate.fromCurrency = bsToEur.pairOne),
      (newRate.toCurrency = bsToEur.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateBsToPen(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const bsToPen = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(bsToPen.pairOne);
    const toBaseRate = await this.getBaseRate(bsToPen.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.marketRate! / toBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //este en front segun jose

    ((newRate.fromCurrency = bsToPen.pairOne),
      (newRate.toCurrency = bsToPen.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  //COP ✅
  public async calculateCopToArs(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const copToArs = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(copToArs.pairOne);
    const toBaseRate = await this.getBaseRate(copToArs.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.sellRate! / toBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9); //este jose
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = copToArs.pairOne),
      (newRate.toCurrency = copToArs.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateCopToBs(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const copToBs = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(copToBs.pairOne);
    const toBaseRate = await this.getBaseRate(copToBs.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.sellRate! / toBaseRate.marketRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = copToBs.pairOne),
      (newRate.toCurrency = copToBs.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateCopToEur(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const copToEur = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(copToEur.pairOne);
    const toBaseRate = await this.getBaseRate(copToEur.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.sellRate! * toBaseRate.sellRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //esta en frontent

    ((newRate.fromCurrency = copToEur.pairOne),
      (newRate.toCurrency = copToEur.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateCopToClp(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const copToEur = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(copToEur.pairOne);
    const toBaseRate = await this.getBaseRate(copToEur.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.sellRate! / toBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //esta en frontent

    ((newRate.fromCurrency = copToEur.pairOne),
      (newRate.toCurrency = copToEur.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateCopToUsd(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const copToEur = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(copToEur.pairOne);
    const toBaseRate = await this.getBaseRate(copToEur.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.sellRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //esta en frontent

    ((newRate.fromCurrency = copToEur.pairOne),
      (newRate.toCurrency = copToEur.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateCopToPen(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const copToPen = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(copToPen.pairOne);
    const toBaseRate = await this.getBaseRate(copToPen.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.sellRate! / toBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //esta en frontent

    ((newRate.fromCurrency = copToPen.pairOne),
      (newRate.toCurrency = copToPen.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  //USD ✅
  public async calculateUsdToArs(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const usdToArs = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(usdToArs.pairOne);
    const toBaseRate = await this.getBaseRate(usdToArs.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(toBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9); //este
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = usdToArs.pairOne),
      (newRate.toCurrency = usdToArs.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateUsdToBs(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const usdToBs = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(usdToBs.pairOne);
    const toBaseRate = await this.getBaseRate(usdToBs.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(toBaseRate.marketRate!);
    const minusTenPercent = Number(base * 0.9); //esta
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = usdToBs.pairOne),
      (newRate.toCurrency = usdToBs.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateUsdToCop(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const usdToCop = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(usdToCop.pairOne);
    const toBaseRate = await this.getBaseRate(usdToCop.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(toBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9); //esta
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = usdToCop.pairOne),
      (newRate.toCurrency = usdToCop.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateUsdToClp(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const usdToClp = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(usdToClp.pairOne);
    const toBaseRate = await this.getBaseRate(usdToClp.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(toBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9); //esta
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = usdToClp.pairOne),
      (newRate.toCurrency = usdToClp.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateUsdToEur(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const usdToEur = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(usdToEur.pairOne);
    const toBaseRate = await this.getBaseRate(usdToEur.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.marketRate! / toBaseRate.sellRate!);
    const minusTenPercent = Number(base * 0.9); //esta
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = usdToEur.pairOne),
      (newRate.toCurrency = usdToEur.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateUsdToPen(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const usdToPen = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(usdToPen.pairOne);
    const toBaseRate = await this.getBaseRate(usdToPen.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(toBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9); //esta
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = usdToPen.pairOne),
      (newRate.toCurrency = usdToPen.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  //EUR ✅
  public async calculateEurToUsd(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const eurToUsd = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(eurToUsd.pairOne);
    const toBaseRate = await this.getBaseRate(eurToUsd.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.buyRate! * toBaseRate.marketRate!);
    const minusTenPercent = Number(base * 0.9); //esta
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = eurToUsd.pairOne),
      (newRate.toCurrency = eurToUsd.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateEurToArs(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const eurToArs = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(eurToArs.pairOne);
    const toBaseRate = await this.getBaseRate(eurToArs.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(toBaseRate.buyRate! * fromBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9); //esta
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = eurToArs.pairOne),
      (newRate.toCurrency = eurToArs.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateEurToClp(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const eurToClp = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(eurToClp.pairOne);
    const toBaseRate = await this.getBaseRate(eurToClp.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(toBaseRate.buyRate! * fromBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9); //esta
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = eurToClp.pairOne),
      (newRate.toCurrency = eurToClp.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateEurToBs(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const eurToBs = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(eurToBs.pairOne);
    const toBaseRate = await this.getBaseRate(eurToBs.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(toBaseRate.marketRate! * fromBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9); //esta
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = eurToBs.pairOne),
      (newRate.toCurrency = eurToBs.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateEurToCop(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const eurToCop = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(eurToCop.pairOne);
    const toBaseRate = await this.getBaseRate(eurToCop.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(toBaseRate.buyRate! * fromBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9); //esta
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = eurToCop.pairOne),
      (newRate.toCurrency = eurToCop.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculateEurToPen(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const eurToPen = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(eurToPen.pairOne);
    const toBaseRate = await this.getBaseRate(eurToPen.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.buyRate! * toBaseRate.buyRate!);
    const minusTenPercent = Number(base * 0.9); //esta
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = eurToPen.pairOne),
      (newRate.toCurrency = eurToPen.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  //SOLES ✅
  public async calculatePenToArs(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const penToArs = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(penToArs.pairOne);
    const toBaseRate = await this.getBaseRate(penToArs.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(toBaseRate.buyRate! / fromBaseRate.sellRate!);
    const minusTenPercent = Number(base * 0.9); //este jose
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = penToArs.pairOne),
      (newRate.toCurrency = penToArs.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculatePenToCop(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const penToCop = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(penToCop.pairOne);
    const toBaseRate = await this.getBaseRate(penToCop.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(toBaseRate.buyRate! / fromBaseRate.sellRate!);
    const minusTenPercent = Number(base * 0.9); //este jose
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = penToCop.pairOne),
      (newRate.toCurrency = penToCop.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculatePenToBs(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const penToBs = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(penToBs.pairOne);
    const toBaseRate = await this.getBaseRate(penToBs.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(toBaseRate.marketRate! / fromBaseRate.sellRate!);
    const minusTenPercent = Number(base * 0.9); //este segun jose
    const plusTenPercent = Number(base / 0.9);

    ((newRate.fromCurrency = penToBs.pairOne),
      (newRate.toCurrency = penToBs.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculatePenToEur(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const penToEur = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(penToEur.pairOne);
    const toBaseRate = await this.getBaseRate(penToEur.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.sellRate! * toBaseRate.sellRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //esta en frontent

    ((newRate.fromCurrency = penToEur.pairOne),
      (newRate.toCurrency = penToEur.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculatePenToClp(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const penToClp = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(penToClp.pairOne);
    const toBaseRate = await this.getBaseRate(penToClp.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(toBaseRate.buyRate! / fromBaseRate.sellRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //esta en frontent

    ((newRate.fromCurrency = penToClp.pairOne),
      (newRate.toCurrency = penToClp.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }

  public async calculatePenToUsd(
    exchangePair: string,
    newRate: Record<string, string | number>,
  ) {
    const penToUsd = this.getTypeCurrency(exchangePair);
    const fromBaseRate = await this.getBaseRate(penToUsd.pairOne);
    const toBaseRate = await this.getBaseRate(penToUsd.pairTwo!);

    if (!fromBaseRate?.id || !toBaseRate?.id) {
      throw new BadRequestException(
        'Una o ambas monedas no existen en las tasas base',
      );
    }

    if (!fromBaseRate.isActive || !toBaseRate.isActive) {
      throw new BadRequestException('Una o ambas monedas no están activas');
    }

    const base = Number(fromBaseRate.sellRate!);
    const minusTenPercent = Number(base * 0.9);
    const plusTenPercent = Number(base / 0.9); //esta en frontent

    ((newRate.fromCurrency = penToUsd.pairOne),
      (newRate.toCurrency = penToUsd.pairTwo!));
    newRate.buyRate = minusTenPercent;
    newRate.sellRate = plusTenPercent;

    return newRate;
  }
}
