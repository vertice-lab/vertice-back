import { Injectable } from '@nestjs/common';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { initialData } from './data/seed-data';
import { countries } from './data/countries';
import * as argon2 from 'argon2';
import { offices } from './data/offices';

@Injectable()
export class SeedService {
  constructor(private prisma: PrismaClientService) {}

  async runSeed() {
    // Base data (idempotente)
    await this.seedRoles();
    await this.seedCountries();
    await this.seedCurrencyBaseRates();
    // const currencyRatesCreated = await this.seedCurrencyRatesFromBaseRates();
    const officesCreated = await this.seedOffices();

    // Users de prueba (idempotente)
    const usersCreated = await this.createTestUsers();

    return {
      message: 'Seed executed successfully',
      roles: initialData.roles.length,
      countries: countries.length,
      currencyBaseRates: initialData.currencyBaseRate.length,
      // currencyRates: currencyRatesCreated,
      offices: officesCreated,
      users: usersCreated,
    };
  }

  private async seedRoles() {
    await this.prisma.$transaction(
      initialData.roles.map((role) =>
        this.prisma.role.upsert({
          where: { name: role.name },
          create: role,
          update: { level: role.level },
        }),
      ),
    );
  }

  private async seedCountries() {
    await this.prisma.$transaction(
      countries.map((c) =>
        this.prisma.country.upsert({
          where: { country_code: c.country_code },
          create: c,
          update: { country_name: c.country_name },
        }),
      ),
    );
  }

  private async seedCurrencyBaseRates() {
    await this.prisma.$transaction(
      initialData.currencyBaseRate.map((c) =>
        this.prisma.currencyBaseRate.upsert({
          where: { currency: c.currency },
          create: {
            ...c,
            isCripto: c.isCripto ?? false,
          },
          update: {
            countryName: c.countryName,
            name: c.name,
            buyRate: c.buyRate,
            sellRate: c.sellRate,
            marketRate: c.marketRate,
            dolarBcvRate: c.dolarBcvRate,
            eurBcvRate: c.eurBcvRate,
            isActive: c.isActive,
            isBase: c.isBase,
            isVolatile: c.isVolatile,
            isCripto: c.isCripto ?? false,
          },
        }),
      ),
    );
  }

  // private async seedCurrencyRatesFromBaseRates(): Promise<number> {
  //   const baseRates = await this.prisma.currencyBaseRate.findMany({
  //     where: { isActive: true },
  //     select: {
  //       currency: true,
  //       name: true,
  //       buyRate: true,
  //       sellRate: true,
  //       marketRate: true,
  //       dolarBcvRate: true,
  //       eurBcvRate: true,
  //     },
  //   });

  //   const usd = baseRates.find((c) => c.currency === 'USD');
  //   if (!usd) {
  //     throw new Error('No existe moneda base USD en CurrencyBaseRate.');
  //   }

  //   const getUsdToCurBuy = (cur: (typeof baseRates)[number]) =>
  //     cur.buyRate ?? cur.marketRate ?? 0;
  //   const getUsdToCurSell = (cur: (typeof baseRates)[number]) =>
  //     cur.sellRate ?? cur.marketRate ?? cur.buyRate ?? 0;

  //   const pairs = baseRates
  //     .filter((c) => c.currency !== 'USD')
  //     .flatMap((cur) => {
  //       const usdToCurBuy = getUsdToCurBuy(cur);
  //       const usdToCurSell = getUsdToCurSell(cur);

  //       if (!usdToCurBuy || !usdToCurSell) return [];

  //       const curToUsdBuy = 1 / usdToCurSell;
  //       const curToUsdSell = 1 / usdToCurBuy;

  //       return [
  //         {
  //           fromCurrency: 'USD',
  //           toCurrency: cur.currency,
  //           buyRate: usdToCurBuy,
  //           sellRate: usdToCurSell,
  //           marketRate: cur.marketRate ?? null,
  //           dolarBcvRate: cur.dolarBcvRate ?? null,
  //           eurBcvRate: cur.eurBcvRate ?? null,
  //           name: `USD → ${cur.currency}`,
  //           isActive: true,
  //         },
  //         {
  //           fromCurrency: cur.currency,
  //           toCurrency: 'USD',
  //           buyRate: curToUsdBuy,
  //           sellRate: curToUsdSell,
  //           marketRate: null,
  //           dolarBcvRate: null,
  //           eurBcvRate: null,
  //           name: `${cur.currency} → USD`,
  //           isActive: true,
  //         },
  //       ];
  //     });

  //   await this.prisma.$transaction(
  //     pairs.map((p) =>
  //       this.prisma.currencyRate.upsert({
  //         where: {
  //           fromCurrency_toCurrency: {
  //             fromCurrency: p.fromCurrency,
  //             toCurrency: p.toCurrency,
  //           },
  //         },
  //         create: p,
  //         update: {
  //           buyRate: p.buyRate,
  //           sellRate: p.sellRate,
  //           marketRate: p.marketRate,
  //           dolarBcvRate: p.dolarBcvRate,
  //           eurBcvRate: p.eurBcvRate,
  //           name: p.name,
  //           isActive: p.isActive,
  //         },
  //       }),
  //     ),
  //   );

  //   return pairs.length;
  // }

  private async seedOffices(): Promise<number> {
    let createdOrUpdated = 0;

    for (const o of offices) {
      const existing = await this.prisma.office.findFirst({
        where: {
          country: o.country,
          city: o.city,
          address: o.address,
        },
      });

      if (!existing) {
        await this.prisma.office.create({
          data: o,
        });
        createdOrUpdated++;
        continue;
      }

      await this.prisma.office.update({
        where: { id: existing.id },
        data: {
          openingTime: o.openingTime,
          closingTime: o.closingTime,
          isActive: o.isActive,
        },
      });
      createdOrUpdated++;
    }

    return createdOrUpdated;
  }

  private async createTestUsers() {
    // Get roles
    const [adminRole, assessorRole, clientRole] = await Promise.all([
      this.prisma.role.findUnique({ where: { name: 'admin' } }),
      this.prisma.role.findUnique({ where: { name: 'assessor' } }),
      this.prisma.role.findUnique({ where: { name: 'client' } }),
    ]);

    // Get a country (Argentina)
    const country = await this.prisma.country.findUnique({
      where: { country_code: 'AR' },
    });

    if (!adminRole || !assessorRole || !clientRole || !country) {
      throw new Error('Roles or country not found. Run seed again.');
    }

    // Hash password (same for all test users: "Abcd123$")
    const hashedPassword = await argon2.hash('Abcd123$');

    // Create admin user
    const adminUser = await this.prisma.user.upsert({
      where: { email: 'admin@vertice.com' },
      create: {
        name: 'Admin',
        lastName: 'Administrador',
        email: 'admin@vertice.com',
        password: hashedPassword,
        verified: true,
        active: true,
        roleId: adminRole.id,
        countryCode: country.country_code,
        information: {
          create: {
            phone: '+5491112345678',
            dateBirth: '1990-01-01',
            acceptedTerms: true,
            receiveMarketingEmails: false,
          },
        },
      },
      update: {
        name: 'Admin',
        lastName: 'Administrador',
        password: hashedPassword,
        verified: true,
        active: true,
        roleId: adminRole.id,
        countryCode: country.country_code,
        information: {
          upsert: {
            create: {
              phone: '+5491112345678',
              dateBirth: '1990-01-01',
              acceptedTerms: true,
              receiveMarketingEmails: false,
            },
            update: {
              phone: '+5491112345678',
              dateBirth: '1990-01-01',
              acceptedTerms: true,
              receiveMarketingEmails: false,
            },
          },
        },
      },
    });

    // Create assessor user
    const assessorUser = await this.prisma.user.upsert({
      where: { email: 'assessor@vertice.com' },
      create: {
        name: 'Asesor',
        lastName: 'Test',
        email: 'assessor@vertice.com',
        password: hashedPassword,
        verified: true,
        active: true,
        roleId: assessorRole.id,
        countryCode: country.country_code,
        information: {
          create: {
            phone: '+5491198765432',
            dateBirth: '1992-05-15',
            acceptedTerms: true,
            receiveMarketingEmails: true,
          },
        },
      },
      update: {
        name: 'Asesor',
        lastName: 'Test',
        password: hashedPassword,
        verified: true,
        active: true,
        roleId: assessorRole.id,
        countryCode: country.country_code,
        information: {
          upsert: {
            create: {
              phone: '+5491198765432',
              dateBirth: '1992-05-15',
              acceptedTerms: true,
              receiveMarketingEmails: true,
            },
            update: {
              phone: '+5491198765432',
              dateBirth: '1992-05-15',
              acceptedTerms: true,
              receiveMarketingEmails: true,
            },
          },
        },
      },
    });

    // Create client users
    const clientUsers = await Promise.all([
      this.prisma.user.upsert({
        where: { email: 'client1@vertice.com' },
        create: {
          name: 'Cliente',
          lastName: 'Uno',
          email: 'client1@vertice.com',
          password: hashedPassword,
          verified: true,
          active: true,
          roleId: clientRole.id,
          countryCode: country.country_code,
          information: {
            create: {
              phone: '+5491123456789',
              dateBirth: '1995-03-20',
              acceptedTerms: true,
              receiveMarketingEmails: true,
            },
          },
        },
        update: {
          name: 'Cliente',
          lastName: 'Uno',
          password: hashedPassword,
          verified: true,
          active: true,
          roleId: clientRole.id,
          countryCode: country.country_code,
          information: {
            upsert: {
              create: {
                phone: '+5491123456789',
                dateBirth: '1995-03-20',
                acceptedTerms: true,
                receiveMarketingEmails: true,
              },
              update: {
                phone: '+5491123456789',
                dateBirth: '1995-03-20',
                acceptedTerms: true,
                receiveMarketingEmails: true,
              },
            },
          },
        },
      }),
      this.prisma.user.upsert({
        where: { email: 'client2@turisto.com' },
        create: {
          name: 'Cliente',
          lastName: 'Dos',
          email: 'client2@turisto.com',
          password: hashedPassword,
          verified: true,
          active: true,
          roleId: clientRole.id,
          countryCode: country.country_code,
          information: {
            create: {
              phone: '+5491134567890',
              dateBirth: '1998-07-10',
              acceptedTerms: true,
              receiveMarketingEmails: false,
            },
          },
        },
        update: {
          name: 'Cliente',
          lastName: 'Dos',
          password: hashedPassword,
          verified: true,
          active: true,
          roleId: clientRole.id,
          countryCode: country.country_code,
          information: {
            upsert: {
              create: {
                phone: '+5491134567890',
                dateBirth: '1998-07-10',
                acceptedTerms: true,
                receiveMarketingEmails: false,
              },
              update: {
                phone: '+5491134567890',
                dateBirth: '1998-07-10',
                acceptedTerms: true,
                receiveMarketingEmails: false,
              },
            },
          },
        },
      }),
    ]);

    return {
      admin: {
        email: adminUser.email,
        password: 'Abcd123$',
        role: 'admin',
      },
      assessor: {
        email: assessorUser.email,
        password: 'Abcd123$',
        role: 'assessor',
      },
      clients: clientUsers.map((user) => ({
        email: user.email,
        password: 'Abcd123$',
        role: 'client',
      })),
    };
  }
}
