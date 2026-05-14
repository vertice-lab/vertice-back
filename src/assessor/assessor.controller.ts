import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { CreateAssessorDto } from './dto/create-assessor.dto';
import { UpdateAssessorDto } from './dto/update-assessor.dto';
import { AssessorService } from './assessor.service';
import { RoleProtected, ValidRoles } from 'src/auth/decorators/role-protected/role-protected.decorator';
import { AuthGuard } from 'src/auth/guards/auth/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { UserAuth } from 'src/auth/interfaces/user/user-auth';
import { GetUser } from 'src/auth/decorators/user/user.decorator';

@Controller('assessor')
export class AsessorController {
  constructor(private readonly asessorService: AssessorService) { }

  @Get('profile')
  @RoleProtected(ValidRoles.assessor)
  @UseGuards(AuthGuard, RolesGuard)
  getAssessorProfile(@GetUser() user: UserAuth) {
    return this.asessorService.getProfileAssessor(user.sub)
  }


  @Get('statistics')
  @RoleProtected(ValidRoles.assessor)
  @UseGuards(AuthGuard, RolesGuard)
  getStatistics(@GetUser() user: UserAuth, @Query() paginationQueryDto: PaginationQueryDto) {
    return this.asessorService.getStatistics(user.sub, paginationQueryDto)
  }

  @Get('tickets')
  @RoleProtected(ValidRoles.assessor)
  @UseGuards(AuthGuard, RolesGuard)
  getTicketsByFilter(@GetUser() user: UserAuth, @Query() paginationQueryDto: PaginationQueryDto) {
    return this.asessorService.getTicketsByFilter(user.sub, paginationQueryDto)
  }
}
