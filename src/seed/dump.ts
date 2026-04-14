import 'dotenv/config';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

async function bootstrap() {
  const prisma = new PrismaClientService();

  try {
    const snapshot = {
      dumpedAt: new Date().toISOString(),
      roles: await prisma.role.findMany({
        select: { name: true, level: true },
        orderBy: { level: 'asc' },
      }),
      countries: await prisma.country.findMany({
        select: { country_code: true, country_name: true },
        orderBy: { country_name: 'asc' },
      }),
      currencyBaseRates: await prisma.currencyBaseRate.findMany({
        select: {
          currency: true,
          name: true,
          countryName: true,
          buyRate: true,
          sellRate: true,
          marketRate: true,
          dolarBcvRate: true,
          eurBcvRate: true,
          isActive: true,
          isBase: true,
          isVolatile: true,
          isCripto: true,
        },
        orderBy: { currency: 'asc' },
      }),
      currencyRates: await prisma.currencyRate.findMany({
        select: {
          fromCurrency: true,
          toCurrency: true,
          buyRate: true,
          sellRate: true,
          marketRate: true,
          dolarBcvRate: true,
          eurBcvRate: true,
          name: true,
          isActive: true,
        },
        orderBy: [{ fromCurrency: 'asc' }, { toCurrency: 'asc' }],
      }),
      offices: await prisma.office.findMany({
        select: {
          country: true,
          city: true,
          address: true,
          openingTime: true,
          closingTime: true,
          isActive: true,
        },
        orderBy: [{ country: 'asc' }, { city: 'asc' }],
      }),
    };

    const outDir = path.resolve(process.cwd(), '.tmp');
    await fs.mkdir(outDir, { recursive: true });

    const outPath = path.join(outDir, 'seed-snapshot.json');
    await fs.writeFile(outPath, JSON.stringify(snapshot, null, 2), 'utf8');

    console.log(`✅ Snapshot de seed guardado en: ${outPath}`);
  } finally {
    await prisma.$disconnect();
  }
}

bootstrap().catch((err) => {
  console.error('❌ Error generando snapshot:', err);
  process.exitCode = 1;
});
