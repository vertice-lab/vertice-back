import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
  ParseEnumPipe,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import {
  RoleProtected,
  ValidRoles,
} from 'src/auth/decorators/role-protected/role-protected.decorator';
import { AuthGuard } from 'src/auth/guards/auth/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { GetUser } from 'src/auth/decorators/user/user.decorator';
import { UserAuth } from 'src/auth/interfaces/user/user-auth';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { TicketStatus } from './enums/ticket-status.enum';
import { KycGuard } from 'src/auth/guards/kyc/kyc.guard';

@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post('create')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard, KycGuard)
  create(@Body() createTicketDto: CreateTicketDto, @GetUser() user: UserAuth) {
    return this.ticketService.create(createTicketDto, user.sub);
  }

  @Get('list')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  findAll(
    @GetUser() user: UserAuth,
    @Query() paginationQueryDto: PaginationQueryDto,
  ) {
    return this.ticketService.findAll(user.sub, paginationQueryDto);
  }

  @Get('all')
  @RoleProtected(ValidRoles.admin, ValidRoles.manager)
  @UseGuards(AuthGuard, RolesGuard)
  findAllTickets(@Query() paginationQueryDto: PaginationQueryDto) {
    return this.ticketService.findAllTickets(paginationQueryDto);
  }

  @Get(':ticketNumber')
  @RoleProtected(
    ValidRoles.client,
    ValidRoles.assessor,
    ValidRoles.admin,
    ValidRoles.manager,
  )
  @UseGuards(AuthGuard, RolesGuard)
  findOneTicketInfo(@Param('ticketNumber') ticketNumber: string) {
    return this.ticketService.findOneTicketInfo(ticketNumber);
  }

  @Get('assessor/list')
  @RoleProtected(ValidRoles.assessor)
  @UseGuards(AuthGuard, RolesGuard)
  findAllTicketsWithoutAssessor(
    @Query() paginationQueryDto: PaginationQueryDto,
  ) {
    return this.ticketService.findAllTicketsWithoutAssessor(paginationQueryDto);
  }

  @Get('assessor/my-ticket/:status')
  @RoleProtected(ValidRoles.assessor)
  @UseGuards(AuthGuard, RolesGuard)
  findAllMyTickets(
    @Param('status', new ParseEnumPipe(TicketStatus)) status: TicketStatus,
    @Query() paginationDto: PaginationQueryDto,
    @GetUser() user: UserAuth,
  ) {
    return this.ticketService.findAllMyTicketsByStatus(
      status,
      paginationDto,
      user.sub,
    );
  }

  @Patch('assessor/take-ticket/:ticketNumber')
  @RoleProtected(ValidRoles.assessor)
  @UseGuards(AuthGuard, RolesGuard)
  takeTicketByAssessor(
    @Param('ticketNumber') ticketNumber: string,
    @GetUser() user: UserAuth,
  ) {
    return this.ticketService.takeTicket(ticketNumber, user.sub);
  }

  @Post('assessor/finalize/:ticketNumber')
  @RoleProtected(ValidRoles.assessor)
  @UseGuards(AuthGuard, RolesGuard)
  finalizeTicket(
    @Param('ticketNumber') ticketNumber: string,
    @GetUser() user: UserAuth,
  ) {
    return this.ticketService.finalizeTicket(ticketNumber, user.sub);
  }

  @Get('user-summary')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  getUserSummary(@GetUser() user: UserAuth) {
    return this.ticketService.getUserSummary(user.sub);
  }
}
