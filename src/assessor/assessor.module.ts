import { Module } from '@nestjs/common';
import { AsessorController } from './assessor.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { AssessorService } from './assessor.service';

@Module({
  imports: [AuthModule],
  controllers: [AsessorController],
  providers: [AssessorService, PrismaClientService],
})
export class AsessorModule {}
