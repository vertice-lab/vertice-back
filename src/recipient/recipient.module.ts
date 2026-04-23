import { Module } from '@nestjs/common';
import { RecipientService } from './recipient.service';
import { RecipientController } from './recipient.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { KycGuard } from 'src/auth/guards/kyc/kyc.guard';

@Module({
  imports: [AuthModule],
  controllers: [RecipientController],
  providers: [RecipientService, PrismaClientService, KycGuard],
})
export class RecipientModule {}
