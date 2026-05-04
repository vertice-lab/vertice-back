import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './auth.controller';
import { EmailServiceService } from './services/email-service/email-service.service';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { EncryptService } from './services/encrypt/encrypt.service';
import { UserService } from 'src/user/services/user/user.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailServiceService,
    PrismaClientService,
    UserService,
    EncryptService,
  ],
  exports: [EncryptService, EmailServiceService],
})
export class AuthModule {}
