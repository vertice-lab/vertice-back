import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaClientService } from './prisma-client/prisma-client.service';
import { UserModule } from './user/user.module';
import { BankAccountModule } from './bank-account/bank-account.module';
import { CommonModule } from './common/common.module';
import { SeedModule } from './seed/seed.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminModule } from './admin/admin.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { OfficesModule } from './offices/offices.module';
import { RecipientModule } from './recipient/recipient.module';
import { TicketModule } from './ticket/ticket.module';
import { ChatModule } from './chat/chat.module';
import { PrismaClientModule } from './prisma-client/prisma-client.module';
import { FilesModule } from './files/files.module';
import { TeamModule } from './team/team.module';
import { ReviewModule } from './review/review.module';
import { KycModule } from './kyc/kyc.module';
import { AsessorModule } from './assessor/assessor.module';
import { SupportTicketModule } from './support-ticket/support-ticket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    AuthModule,
    UserModule,
    BankAccountModule,
    CommonModule,
    AdminModule,
    SeedModule,

    PassportModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('SECRET_JWT'),
        signOptions: { expiresIn: '3d' },
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 15000,
          limit: 50,
        },
      ],
    }),

    OfficesModule,

    RecipientModule,

    TicketModule,

    ChatModule,

    PrismaClientModule,

    FilesModule,

    TeamModule,

    ReviewModule,

    KycModule,

    AsessorModule,

    SupportTicketModule,
  ],
  controllers: [],
  providers: [
    PrismaClientService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
