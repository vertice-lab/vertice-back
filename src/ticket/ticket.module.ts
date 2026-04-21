import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { AuthModule } from 'src/auth/auth.module';
import { UserService } from 'src/user/services/user/user.service';
import { ChatModule } from 'src/chat/chat.module';
import { TicketReceiptService } from './ticket-receipt.service';
import { TicketReceiptController } from './ticket-receipt.controller';
import { KycGuard } from 'src/auth/guards/kyc/kyc.guard';

@Module({
  imports: [AuthModule, ChatModule],
  controllers: [TicketController, TicketReceiptController],
  providers: [
    TicketService,
    TicketReceiptService,
    PrismaClientService,
    UserService,
    KycGuard,
  ],
})
export class TicketModule {}
