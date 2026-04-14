import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const seedService = app.get(SeedService);

  try {
    console.log('🌱 Iniciando seed...\n');
    const result = await seedService.runSeed();
    console.log('✅ Seed ejecutado exitosamente!\n');
    console.log('📊 Resumen:');
    console.log(`   - Roles: ${result.roles}`);
    console.log(`   - Países: ${result.countries}`);
    console.log(`   - Monedas base: ${result.currencyBaseRates}`);
    // if (typeof result.currencyRates === 'number') {
    //   console.log(`   - Tasas (CurrencyRate): ${result.currencyRates}`);
    // }
    if (typeof result.offices === 'number') {
      console.log(`   - Oficinas: ${result.offices}`);
    }
    console.log('\n👤 Usuarios de prueba creados:');
    console.log(
      `   🔴 Admin: ${result.users.admin.email} (password: ${result.users.admin.password})`,
    );
    console.log(
      `   🟡 Asesor: ${result.users.assessor.email} (password: ${result.users.assessor.password})`,
    );
    console.log(
      `   🟢 Cliente 1: ${result.users.clients[0].email} (password: ${result.users.clients[0].password})`,
    );
    console.log(
      `   🟢 Cliente 2: ${result.users.clients[1].email} (password: ${result.users.clients[1].password})`,
    );
    console.log('\n⚠️  Nota: Todas las contraseñas son: Abcd123$');
    console.log('\n');
    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando seed:', error);
    await app.close();
    process.exit(1);
  }
}

bootstrap();
