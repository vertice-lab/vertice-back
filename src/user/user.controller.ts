import {
  Controller,
  Get,
  Body,
  Patch,
  Ip,
  UseGuards,
  Post,
  Param,
} from '@nestjs/common';

import { UpdateProfileDto, ConfirmDeleteAccountDto } from './dto';
import { AuthGuard } from 'src/auth/guards/auth/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { RoleProtected, ValidRoles } from 'src/auth/decorators/role-protected/role-protected.decorator';
import { GetUser } from 'src/auth/decorators/user/user.decorator';
import { UserAuth } from 'src/auth/interfaces/user/user-auth';
import { UserService } from './services/user/user.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { Delete } from '@nestjs/common';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('ip')
  getIp(@Ip() ip: string) {
    return ip;
  }

  // !BORRAR
  @Post('role')
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.userService.createRole(createRoleDto);
  }

  // Update profile para usuarios autenticados
  @Patch('profile')
  @UseGuards(AuthGuard)
  updateProfile(
    @GetUser() user: UserAuth,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.userService.updateOwnProfile(user.sub, updateProfileDto);
  }

  @Post('request-delete-account')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  requestDeleteAccount(@GetUser() user: UserAuth) {
    return this.userService.requestDeleteAccount(user.sub);
  }

  @Get('validate-delete-account/:token')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  validateDeleteAccount(
    @GetUser() user: UserAuth,
    @Param('token') token: string,
  ) {
    return this.userService.validateDeleteToken(user.sub, token);
  }

  @Post('confirm-delete-account')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  confirmDeleteAccount(
    @GetUser() user: UserAuth,
    @Body() confirmDto: ConfirmDeleteAccountDto,
  ) {
    return this.userService.confirmDeleteAccount(user.sub, confirmDto);
  }
}
