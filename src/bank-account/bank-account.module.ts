import { Module } from '@nestjs/common';
import { BankAccountService } from './bank-account.service';
import { BankAccountController } from './bank-account.controller';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { AuthModule } from 'src/auth/auth.module';
import { KycGuard } from 'src/auth/guards/kyc/kyc.guard';

@Module({
  imports: [AuthModule],
  controllers: [BankAccountController],
  providers: [BankAccountService, PrismaClientService, KycGuard],
})
export class BankAccountModule { }
