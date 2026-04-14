import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat/chat.gateway';
import { PrismaClientModule } from '../prisma-client/prisma-client.module';
import { AuthModule } from 'src/auth/auth.module';
import { UserService } from 'src/user/services/user/user.service';
import { ChatController } from './chat.controller';
import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [PrismaClientModule, AuthModule, FilesModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, UserService],
  exports: [ChatGateway],
})
export class ChatModule {}
