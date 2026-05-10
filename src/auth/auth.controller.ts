import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Request,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './services/auth.service';
import {
  GoogleCallbackDto,
  LoginAuthDto,
  RegisterAuthDto,
  TempRegisterAuthDto,
  TokenAuthDto,
  UpdatePasswordDto,
  UserEmailAuthDto,
  SupportFormDto,
} from './dto/auth.dto';
import { AuthGuard } from './guards/auth/auth.guard';
import {
  RoleProtected,
  ValidRoles,
} from './decorators/role-protected/role-protected.decorator';
import { RolesGuard } from './guards/roles/roles.guard';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('temp')
  tempUser(@Body() tempRegister: TempRegisterAuthDto) {
    return this.authService.tempRegister(tempRegister);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('temp/mobile')
  tempUserMobile(@Body() tempRegister: TempRegisterAuthDto) {
    return this.authService.tempRegisterMobile(tempRegister);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('temp/verify-otp')
  verifyOtpMobile(@Body() body: { email: string; token: string }) {
    if (!body.email || !body.token) {
      throw new BadRequestException('Email y token son requeridos');
    }
    return this.authService.verifyOtpMobile(body.email, body.token);
  }
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  signIn(@Body() registerAuthDto: RegisterAuthDto) {
    return this.authService.register(registerAuthDto);
  }
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  singUp(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @Post('google/callback')
  async googleRegisterCallback(@Body() googleData: GoogleCallbackDto) {
    return this.authService.syncGoogleUser(googleData);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Get('token/:token')
  getTokenAuthTemp(@Param() params: TokenAuthDto) {
    return this.authService.isValidTokenTempUser(params);
  }
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('change-password/send-email')
  sendTokenEmail(@Body() userEmailDto: UserEmailAuthDto) {
    return this.authService.sendEmailchangePassword(userEmailDto);
  }
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Get('change-password/:token')
  isValidTokenAuthUser(@Param() params: TokenAuthDto) {
    return this.authService.isValidTokenAuthUser(params);
  }
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('change-password/updated')
  changePasswordNew(@Body() newPassword: UpdatePasswordDto) {
    return this.authService.updateChangePassword(newPassword);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('change-password/mobile/send-otp')
  sendForgotPasswordOtp(@Body() userEmailDto: UserEmailAuthDto) {
    return this.authService.sendForgotPasswordOtpMobile(userEmailDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('change-password/mobile/verify-otp')
  verifyForgotPasswordOtp(@Body() body: { email: string; token: string }) {
    if (!body.email || !body.token) {
      throw new BadRequestException('Email y token son requeridos');
    }
    return this.authService.verifyForgotPasswordOtp(body.email, body.token);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('change-password/mobile/update')
  updatePasswordMobile(@Body() body: { email: string; newPassword: string }) {
    if (!body.email || !body.newPassword) {
      throw new BadRequestException('Email y nueva contraseña son requeridos');
    }
    return this.authService.updatePasswordByEmail(body.email, body.newPassword);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfileAuth(@Request() req) {
    return this.authService.getProfileClient(req);
  }

  //PRIVATE - ROLE ASSESSORS
  @Get('assessor')
  @RoleProtected(ValidRoles.assessor)
  @UseGuards(AuthGuard, RolesGuard)
  async getProfileAssessor(@Request() req) {
    return this.authService.getProfileAssessor(req);
  }

  //PRIVATE - ROLE ADMIN
  @Get('admin')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  async getProfileAdmin(@Request() req) {
    return this.authService.getProfileAdmin(req);
  }

  //PRIVATE - ROLE MANAGER
  @Get('manager')
  @RoleProtected(ValidRoles.manager)
  @UseGuards(AuthGuard, RolesGuard)
  async getProfileManager(@Request() req) {
    return this.authService.getProfileManager(req);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('support/contact')
  async sendSupportTicket(@Body() supportFormDto: SupportFormDto) {
    return this.authService.sendSupportTicket(supportFormDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  @Post('password/request-otp')
  async requestChangePasswordOtp(@Request() req: any) {
    const profile = await this.authService.getProfileClient(req);
    if (!profile || !profile.user?.email) {
      throw new UnauthorizedException('No se pudo obtener el email del usuario');
    }

    if (profile.user.providers && profile.user.providers.length > 0) {
      throw new BadRequestException(
        'Los usuarios registrados con proveedores externos no pueden cambiar su contraseña directamente.',
      );
    }

    return this.authService.requestChangePasswordOtp(profile.user.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  @Post('password/verify-otp')
  async verifyChangePasswordOtp(
    @Request() req: any,
    @Body() body: { token: string },
  ) {
    if (!body.token) throw new BadRequestException('Token requerido');
    const profile = await this.authService.getProfileClient(req);
    if (!profile || !profile.user?.email) {
      throw new UnauthorizedException('No se pudo obtener el email del usuario');
    }

    if (profile.user.providers && profile.user.providers.length > 0) {
      throw new BadRequestException(
        'Los usuarios registrados con proveedores externos no pueden realizar esta acción.',
      );
    }

    return this.authService.verifyChangePasswordOtp(
      profile.user.email,
      body.token,
    );
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  @Post('password/update')
  async updatePasswordAuthenticated(
    @Request() req: any,
    @Body() body: { newPassword: string },
  ) {
    if (!body.newPassword)
      throw new BadRequestException('Nueva contraseña requerida');
    const profile = await this.authService.getProfileClient(req);
    if (!profile || !profile.user?.email) {
      throw new UnauthorizedException('No se pudo obtener el email del usuario');
    }

    if (profile.user.providers && profile.user.providers.length > 0) {
      throw new BadRequestException(
        'Los usuarios registrados con proveedores externos no pueden cambiar su contraseña directamente.',
      );
    }

    return this.authService.updatePasswordAuthenticated(
      profile.user.email,
      body.newPassword,
    );
  }
}
