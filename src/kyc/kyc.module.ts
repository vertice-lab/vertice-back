import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { AuthModule } from 'src/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { KycGateway } from './kyc.gateway';


@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [KycController],
  providers: [KycService, PrismaClientService, KycGateway],
})
export class KycModule { }
