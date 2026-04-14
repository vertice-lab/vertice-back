import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TicketReceiptService } from './ticket-receipt.service';
import {
  RoleProtected,
  ValidRoles,
} from 'src/auth/decorators/role-protected/role-protected.decorator';
import { AuthGuard } from 'src/auth/guards/auth/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { GetUser } from 'src/auth/decorators/user/user.decorator';
import { UserAuth } from 'src/auth/interfaces/user/user-auth';
import { CreateTicketReceiptNotificationDto } from './dto/create-ticket-receipt-notification.dto';
import { UpdateTicketReceiptNotificationStatusDto } from './dto/update-ticket-receipt-notification-status.dto';
import { TicketReceiptStatus } from 'generated/prisma/client';

@Controller('ticket/receipt')
export class TicketReceiptController {
  constructor(private readonly ticketReceiptService: TicketReceiptService) {}

  @Post()
  @RoleProtected(ValidRoles.assessor)
  @UseGuards(AuthGuard, RolesGuard)
  createForAssessor(
    @Body() dto: CreateTicketReceiptNotificationDto,
    @GetUser() user: UserAuth,
  ) {
    return this.ticketReceiptService.createForAssessor(dto, user.sub);
  }

  @Get('manager')
  @RoleProtected(ValidRoles.manager)
  @UseGuards(AuthGuard, RolesGuard)
  listForManager(
    @GetUser() user: UserAuth,
    @Query('status') status?: TicketReceiptStatus,
  ) {
    return this.ticketReceiptService.listForManager(user.sub, status);
  }

  @Get('assessor/:ticketNumber')
  @RoleProtected(ValidRoles.assessor)
  @UseGuards(AuthGuard, RolesGuard)
  listForAssessor(
    @Param('ticketNumber') ticketNumber: string,
    @GetUser() user: UserAuth,
  ) {
    return this.ticketReceiptService.listForAssessor(ticketNumber, user.sub);
  }

  @Patch('manager/:id')
  @RoleProtected(ValidRoles.manager)
  @UseGuards(AuthGuard, RolesGuard)
  updateStatus(
    @Param('id') id: string,
    @GetUser() user: UserAuth,
    @Body() dto: UpdateTicketReceiptNotificationStatusDto,
  ) {
    return this.ticketReceiptService.updateStatus(id, user.sub, dto);
  }
}
