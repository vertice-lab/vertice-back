import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import {
  RoleProtected,
  ValidRoles,
} from 'src/auth/decorators/role-protected/role-protected.decorator';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { AuthGuard } from 'src/auth/guards/auth/auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':ticketNumber/messages')
  @RoleProtected(ValidRoles.client, ValidRoles.assessor)
  @UseGuards(AuthGuard, RolesGuard)
  async getMessages(@Param('ticketNumber') ticketNumber: string, @Request() req) {
    const userId = req.user.sub;
    return await this.chatService.getMessages(ticketNumber, userId);
  }
}
