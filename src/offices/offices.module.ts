import { Module } from '@nestjs/common';
import { OfficesService } from './offices.service';
import { OfficesController } from './offices.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';

@Module({
  imports: [AuthModule],
  controllers: [OfficesController],
  providers: [OfficesService, PrismaClientService],
})
export class OfficesModule {}
