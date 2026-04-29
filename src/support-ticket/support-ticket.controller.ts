import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, ParseEnumPipe } from '@nestjs/common';
import { SupportTicketService } from './support-ticket.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { AuthGuard } from 'src/auth/guards/auth/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { RoleProtected, ValidRoles } from 'src/auth/decorators/role-protected/role-protected.decorator';
import { GetUser } from 'src/auth/decorators/user/user.decorator';
import { UserAuth } from 'src/auth/interfaces/user/user-auth';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { TicketStatus } from 'src/ticket/enums/ticket-status.enum';

@Controller('support-ticket')
export class SupportTicketController {
  constructor(private readonly supportTicketService: SupportTicketService) { }

  @Post('create')
  @RoleProtected(ValidRoles.client, ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  create(@Body() createSupportTicketDto: CreateSupportTicketDto, @GetUser() user: UserAuth) {
    return this.supportTicketService.create(createSupportTicketDto, user.sub);
  }

  @Get('assessor/list/pending')
  @RoleProtected(ValidRoles.assessor)
  @UseGuards(AuthGuard, RolesGuard)
  findAllPending(
    @Query() paginationDto: PaginationQueryDto,
  ) {
    return this.supportTicketService.findAllPending(paginationDto);
  }

  @Get('assessor/list/my/:status')
  @RoleProtected(ValidRoles.assessor)
  @UseGuards(AuthGuard, RolesGuard)
  findAllByAssessor(
    @GetUser() user: UserAuth,
    @Param('status', new ParseEnumPipe(TicketStatus)) status: TicketStatus,
    @Query() paginationDto: PaginationQueryDto,
  ) {
    return this.supportTicketService.findAllByAssessor(user.sub, status, paginationDto);
  }

  @Patch('assessor/take/:supportNumber')
  @RoleProtected(ValidRoles.assessor)
  @UseGuards(AuthGuard, RolesGuard)
  takeTicket(
    @Param('supportNumber') supportNumber: string,
    @GetUser() user: UserAuth,
  ) {
    return this.supportTicketService.takeTicket(supportNumber, user.sub);
  }

  @Get('list')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  findAll(
    @GetUser() user: UserAuth,
    @Query() paginationDto: PaginationQueryDto,
  ) {
    return this.supportTicketService.findAll(user.sub, paginationDto);
  }

  @Get(':supportNumber')
  @RoleProtected(ValidRoles.client, ValidRoles.assessor, ValidRoles.admin, ValidRoles.manager)
  @UseGuards(AuthGuard, RolesGuard)
  findOne(@Param('supportNumber') supportNumber: string) {
    return this.supportTicketService.findOne(supportNumber);
  }

  @Patch('finalize/:supportNumber')
  @RoleProtected(ValidRoles.client, ValidRoles.admin, ValidRoles.assessor)
  @UseGuards(AuthGuard, RolesGuard)
  finalizeTicket(
    @Param('supportNumber') supportNumber: string,
  ) {
    return this.supportTicketService.finalizeTicket(supportNumber);
  }

  @Patch('assessor/finalize/:supportNumber')
  @RoleProtected(ValidRoles.assessor)
  @UseGuards(AuthGuard, RolesGuard)
  finalizeTicketAssessor(
    @Param('supportNumber') supportNumber: string,
  ) {
    return this.supportTicketService.finalizeTicket(supportNumber);
  }
}
