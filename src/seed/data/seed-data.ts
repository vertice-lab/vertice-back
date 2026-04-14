type Roles = 'admin' | 'assessor' | 'client' | 'manager';

interface RoleSeed {
  name: Roles;
  level: number;
}

interface CurrencyBaseRate {
  currency: string;
  countryName: string;
  name: string;
  buyRate?: number;
  sellRate?: number;
  marketRate?: number;
  dolarBcvRate?: number;
  eurBcvRate?: number;
  isActive: boolean;
  isBase: boolean;
  isVolatile: boolean;
  isCripto?: boolean;
}

interface SeedData {
  roles: RoleSeed[];
  currencyBaseRate: CurrencyBaseRate[];
}

export const initialData: SeedData = {
  roles: [
    {
      name: 'client',
      level: 1,
    },
    {
      name: 'assessor',
      level: 2,
    },

    {
      name: 'manager',
      level: 3,
    },
    {
      name: 'admin',
      level: 10,
    },
  ],

  currencyBaseRate: [
    {
      currency: 'USD',
      countryName: 'Estados Unidos',
      name: 'Dolar',
      marketRate: 1,
      dolarBcvRate: 0,
      eurBcvRate: 0,
      isActive: true,
      isBase: true,
      isVolatile: true,
      isCripto: false,
    },
    {
      currency: 'EUR',
      countryName: 'Union Europea',
      name: 'Euro',
      buyRate: 1.07,
      sellRate: 1.17,
      marketRate: 0,
      dolarBcvRate: 0,
      eurBcvRate: 0,
      isActive: true,
      isBase: false,
      isVolatile: false,
      isCripto: false,
    },
    {
      currency: 'PEN',
      countryName: 'Peru',
      name: 'Sol',
      buyRate: 3.35,
      sellRate: 3.42,
      marketRate: 0,
      dolarBcvRate: 0,
      eurBcvRate: 0,
      isActive: true,
      isBase: false,
      isVolatile: false,
      isCripto: false,
    },
    {
      currency: 'CLP',
      countryName: 'Chile',
      name: 'Peso Chileno',
      buyRate: 980,
      sellRate: 980,
      marketRate: 0,
      dolarBcvRate: 0,
      eurBcvRate: 0,
      isActive: true,
      isBase: false,
      isVolatile: false,
      isCripto: false,
    },
    {
      currency: 'BS',
      countryName: 'Venezuela',
      name: 'Bolivar Soberano',
      marketRate: 510,
      dolarBcvRate: 360.25,
      eurBcvRate: 434.42,
      isActive: true,
      isBase: false,
      isVolatile: true,
      isCripto: false,
    },
    {
      currency: 'ARS',
      countryName: 'Argentina',
      name: 'Peso Argentino',
      buyRate: 1505,
      sellRate: 1510,
      marketRate: 0,
      dolarBcvRate: 0,
      eurBcvRate: 0,
      isActive: true,
      isBase: false,
      isVolatile: false,
      isCripto: false,
    },
    {
      currency: 'COP',
      countryName: 'Colombia',
      name: 'Peso Colombiano',
      buyRate: 3770,
      sellRate: 3779,
      marketRate: 0,
      dolarBcvRate: 0,
      eurBcvRate: 0,
      isActive: true,
      isBase: false,
      isVolatile: false,
      isCripto: false,
    },
  ],
};
