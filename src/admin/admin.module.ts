import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { CurrencyRateService } from './service/currency-rate/currency-rate.service';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { UserService } from 'src/user/services/user/user.service';
import { CurrencyBaseService } from './service/currency-base/currency-base.service';
import { ExchangeRateService } from './service/exchange-rate/exchange-rate.service';
import { OurPaymentMethodService } from './service/our-payment-method/our-payment-method.service';
import { CurrencyRateHistoryService } from './service/currency-rate-history/currency-rate-history.service';
import { EncryptService } from 'src/auth/services/encrypt/encrypt.service';
import { CurrencyPaymentMethodController } from './controllers/currency-payment-method/currency-payment-method.controller';
import { CurrencyPaymentMethodService } from './service/currency-payment-method/currency-payment-method.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AdminController, CurrencyPaymentMethodController],
  providers: [
    CurrencyRateService,
    CurrencyBaseService,
    UserService,
    PrismaClientService,
    ExchangeRateService,
    OurPaymentMethodService,
    CurrencyRateHistoryService,
    EncryptService,
    CurrencyPaymentMethodService,
  ],
})
export class AdminModule {}
