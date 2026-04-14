import { Module } from '@nestjs/common';
import { RecipientService } from './recipient.service';
import { RecipientController } from './recipient.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';

@Module({
  imports: [AuthModule],
  controllers: [RecipientController],
  providers: [RecipientService, PrismaClientService],
})
export class RecipientModule {}
