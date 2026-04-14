import { Module } from '@nestjs/common';
import { UserService } from './services/user/user.service';
import { UserController } from './user.controller';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [UserService, PrismaClientService],
  exports: [UserService],
})
export class UserModule {}
