import { Injectable } from '@nestjs/common';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { initialData } from './data/seed-data';
import { countries } from './data/countries';
import * as argon2 from 'argon2';
import { offices } from './data/offices';

@Injectable()
export class SeedService {
  constructor(private prisma: PrismaClientService) { }

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
      async (tx) => {
        await Promise.all(
          initialData.roles.map((role) =>
            tx.role.upsert({
              where: { name: role.name },
              create: role,
              update: { level: role.level },
            }),
          )
        );
      },
      { maxWait: 20000, timeout: 60000 }
    );
  }

  private async seedCountries() {
    await this.prisma.$transaction(
      async (tx) => {
        await Promise.all(
          countries.map((c) =>
            tx.country.upsert({
              where: { country_code: c.country_code },
              create: c,
              update: { country_name: c.country_name },
            }),
          )
        );
      },
      { maxWait: 20000, timeout: 60000 }
    );
  }

  private async seedCurrencyBaseRates() {
    await this.prisma.$transaction(
      async (tx) => {
        await Promise.all(
          initialData.currencyBaseRate.map((c) =>
            tx.currencyBaseRate.upsert({
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
          )
        );
      },
      { maxWait: 20000, timeout: 60000 }
    );
  }



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

    const [hashedAdmin, hashedAssessor, hashedClient] = await Promise.all([
      argon2.hash(process.env.SECRET_PASSWORD_ADMIN!),
      argon2.hash(process.env.SECRET_PASSWORD_ASSESSOR!),
      argon2.hash(process.env.SECRET_PASSWORD_CLIENT!),
    ]);

    // Create admin user
    const adminUser = await this.prisma.user.upsert({
      where: { email: 'admin@verticeapp.io' },
      create: {
        name: 'Jose',
        lastName: 'Rodriguez',
        email: 'admin@verticeapp.io',
        password: hashedAdmin,
        verified: true,
        active: true,
        roleId: adminRole.id,
        countryCode: country.country_code,
        information: {
          create: {
            phone: '+5497732345678',
            dateBirth: '1990-01-01',
            acceptedTerms: true,
            receiveMarketingEmails: false,
          },
        },
      },
      update: {
        name: 'Jose',
        lastName: 'Rodriguez',
        password: hashedAdmin,
        verified: true,
        active: true,
        roleId: adminRole.id,
        countryCode: country.country_code,
        information: {
          upsert: {
            create: {
              phone: '+54919175678',
              dateBirth: '1990-01-01',
              acceptedTerms: true,
              receiveMarketingEmails: false,
            },
            update: {
              phone: '+5491793145678',
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
      where: { email: 'jesus.user@verticeapp.io' },
      create: {
        name: 'Jesus',
        lastName: 'User',
        email: 'jesus.user@verticeapp.io',
        password: hashedAssessor,
        verified: true,
        active: true,
        roleId: assessorRole.id,
        countryCode: country.country_code,
        information: {
          create: {
            phone: '+549134792532',
            dateBirth: '1992-05-15',
            acceptedTerms: true,
            receiveMarketingEmails: true,
          },
        },
      },
      update: {
        name: 'Jesus',
        lastName: 'User',
        password: hashedAssessor,
        verified: true,
        active: true,
        roleId: assessorRole.id,
        countryCode: country.country_code,
        information: {
          upsert: {
            create: {
              phone: '+549143971432',
              dateBirth: '1992-05-15',
              acceptedTerms: true,
              receiveMarketingEmails: true,
            },
            update: {
              phone: '+549143971432',
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
        where: { email: 'jesus.client@verticeapp.io' },
        create: {
          name: 'Jesus 2',
          lastName: 'User 2',
          email: 'jesus.client@verticeapp.io',
          password: hashedClient,
          verified: true,
          active: true,
          roleId: clientRole.id,
          countryCode: country.country_code,
          information: {
            create: {
              phone: '+5491136476789',
              dateBirth: '1995-03-20',
              acceptedTerms: true,
              receiveMarketingEmails: true,
            },
          },
        },
        update: {
          name: 'Jesus 2',
          lastName: 'User 2',
          password: hashedClient,
          verified: true,
          active: true,
          roleId: clientRole.id,
          countryCode: country.country_code,
          information: {
            upsert: {
              create: {
                phone: '+54913547956789',
                dateBirth: '1995-03-20',
                acceptedTerms: true,
                receiveMarketingEmails: true,
              },
              update: {
                phone: '+5491793145456789',
                dateBirth: '1995-03-20',
                acceptedTerms: true,
                receiveMarketingEmails: true,
              },
            },
          },
        },
      }),
      this.prisma.user.upsert({
        where: { email: 'jesus.client2@verticeapp.io' },
        create: {
          name: 'Jesus 3',
          lastName: 'User 3',
          email: 'jesus.client2@verticeapp.io',
          password: hashedClient,
          verified: true,
          active: true,
          roleId: clientRole.id,
          countryCode: country.country_code,
          information: {
            create: {
              phone: '+549146327890',
              dateBirth: '1998-07-10',
              acceptedTerms: true,
              receiveMarketingEmails: false,
            },
          },
        },
        update: {
          name: 'Jesus 3',
          lastName: 'User 3',
          password: hashedClient,
          verified: true,
          active: true,
          roleId: clientRole.id,
          countryCode: country.country_code,
          information: {
            upsert: {
              create: {
                phone: '+247227272',
                dateBirth: '1998-07-10',
                acceptedTerms: true,
                receiveMarketingEmails: false,
              },
              update: {
                phone: '+002271446',
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
        password: process.env.SECRET_PASSWORD_ADMIN!,
        role: 'admin',
      },
      assessor: {
        email: assessorUser.email,
        password: process.env.SECRET_PASSWORD_ASSESSOR!,
        role: 'assessor',
      },
      clients: clientUsers.map((user) => ({
        email: user.email,
        password: process.env.SECRET_PASSWORD_CLIENT!,
        role: 'client',
      })),
    };
  }
}
