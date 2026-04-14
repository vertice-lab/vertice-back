import {
  Controller,
  Get,
  Body,
  Patch,
  Ip,
  UseGuards,
  Post,
} from '@nestjs/common';

import { UpdateProfileDto } from './dto';
import { AuthGuard } from 'src/auth/guards/auth/auth.guard';
import { GetUser } from 'src/auth/decorators/user/user.decorator';
import { UserAuth } from 'src/auth/interfaces/user/user-auth';
import { UserService } from './services/user/user.service';
import { CreateRoleDto } from './dto/create-role.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
}
