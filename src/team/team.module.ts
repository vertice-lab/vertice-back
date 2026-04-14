import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';

@Module({
  imports: [AuthModule],
  controllers: [TeamController],
  providers: [TeamService, PrismaClientService],
})
export class TeamModule {}
