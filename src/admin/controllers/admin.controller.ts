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
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CurrencyRateService } from '../service/currency-rate/currency-rate.service';
import { CurrencyBaseService } from '../service/currency-base/currency-base.service';
import { OurPaymentMethodService } from '../service/our-payment-method/our-payment-method.service';
import { CurrencyRateHistoryService } from '../service/currency-rate-history/currency-rate-history.service';
import { UserService } from 'src/user/services/user/user.service';
import {
  RoleProtected,
  ValidRoles,
} from 'src/auth/decorators/role-protected/role-protected.decorator';
import { AuthGuard } from 'src/auth/guards/auth/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { UserAuth } from 'src/auth/interfaces/user/user-auth';
import { GetUser } from 'src/auth/decorators/user/user.decorator';
import {
  CreateCurrencyRateDto,
  DestroyCurrencyRate,
  GetCurrencyRateByUsdDto,
  GetCurrencyRateDto,
  GetCurrencyRatePaymentMethodDto,
  UpdateIsActiveRateDto,
} from '../dto/rate/currency-rate.dto';
import {
  CreateCurrencyBaseDto,
  CurrencyBaseDto,
  UpdateAllCurrencyBaseDto,
} from '../dto/rate-base/currency-base.dto';
import {
  CreateOurPaymentMethodDto,
  UpdateOurPaymentMethodDto,
} from '../dto/our-payment-method/our-payment-method.dto';
import { GetPaymentMethodParamDto } from '../dto/our-payment-method/get-payment-method-param.dto';
import { GetCurrencyRateHistoryDto } from '../dto/rate-history/get-currency-rate-history.dto';
import {
  CreateUserAdminDto,
  UpdateUserAdminDto,
  GetUsersQueryDto,
  ChangeRoleDto,
  SetActiveDto,
  ResetPasswordDto,
} from 'src/user/dto';

@SkipThrottle()
@Controller('admin')
export class AdminController {
  constructor(
    private currencyRateService: CurrencyRateService,
    private currencyBaseService: CurrencyBaseService,
    private ourPaymentMethodService: OurPaymentMethodService,
    private currencyRateHistoryService: CurrencyRateHistoryService,
    private userService: UserService,
  ) {}

  //CURRENCY RATES (exchanges)
  // PUBLIC
  @Get('currency-rates/currency-rate-single')
  getCurrencyByPairs(@Query() getCurrencyRateDto: GetCurrencyRateDto) {
    return this.currencyRateService.getRate(getCurrencyRateDto);
  }

  @Get('currency-rates/currency-rate-single-method')
  getCurrencyByPairsAndMethod(
    @Query() getCurrencyRatePaymentMethodDto: GetCurrencyRatePaymentMethodDto,
  ) {
    return this.currencyRateService.getRateCurrencyPaymentMethod(
      getCurrencyRatePaymentMethodDto,
    );
  }

  @Get('currency-rates/currency-rate-usd')
  getCurrencyFromCurrency(
    @Query() getCurrencyRateUsdDto: GetCurrencyRateByUsdDto,
  ) {
    return this.currencyRateService.getRateByUsd(getCurrencyRateUsdDto);
  }

  // PRIVATE - CURRENCY RATES updateAllRateBase
  @Get('currency-rates/all-currency-rates')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  getAllCurrencyRate(@GetUser() userAuthAdmin: UserAuth) {
    return this.currencyRateService.getAllCurrencyRates(userAuthAdmin);
  }

  @SkipThrottle({ default: false })
  @Post('currency-rates/create-rate')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  createCurrencyRate(
    @Body() createCurrencyRateIdDto: CreateCurrencyRateDto,
    @GetUser() userAuthAdmin: UserAuth,
  ) {
    return this.currencyRateService.createCurrencyRates(
      createCurrencyRateIdDto,
      userAuthAdmin,
    );
  }

  @SkipThrottle({ default: false })
  @Patch('currency-rates/update-rates/:id')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  updateAllRates(
    @Param('id') rateId,
    @Body() updateIsActiveRate: UpdateIsActiveRateDto,
    @GetUser() userAuthAdmin: UserAuth,
  ) {
    return this.currencyRateService.updateIsActiveRate(
      rateId,
      updateIsActiveRate,
      userAuthAdmin,
    );
  }

  @SkipThrottle({ default: false })
  @Delete('currency-rates/destroy-rate')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  destroyCurrencyRate(@Query() destroyCurrencyRate: DestroyCurrencyRate) {
    return this.currencyRateService.destroyCurrencyRate(destroyCurrencyRate);
  }
  //END

  // CURRENCY RATE HISTORY - only admin
  // @SkipThrottle({ default: false }) //TODO PARA PRODUCCION SI
  @Get('currency-rates/:id/history')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  getCurrencyRateHistory(
    @Param('id') rateId: string,
    @Query() query: GetCurrencyRateHistoryDto,
    @GetUser() userAuthAdmin?: UserAuth,
  ) {
    return this.currencyRateHistoryService.findAll(
      rateId,
      query.page,
      query.limit,
      query.startDate,
      query.endDate,
      userAuthAdmin,
    );
  }

  //CURRENCY RATES BASE - start
  @Get('currency-base/all-currency-base')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  getAllCurrencyBase(@GetUser() userAuthAdmin: UserAuth) {
    return this.currencyBaseService.getAllRateBase(userAuthAdmin);
  }

  @Get('currency-base/currency-base-single/:currency')
  getCurrentBase(@Param() currencyBaseDto: CurrencyBaseDto) {
    return this.currencyBaseService.getRateBase(currencyBaseDto);
  }

  @SkipThrottle({ default: false })
  @Post('currency-base/create-base')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  createCurrencyBase(@Body() createCurrencyBaseDto: CreateCurrencyBaseDto) {
    return this.currencyBaseService.createRateBase(createCurrencyBaseDto);
  }

  @SkipThrottle({ default: false })
  @Patch('currency-base/update-base')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  updateCurrencyBase(
    @Body() updateAllCurrencyBaseDto: UpdateAllCurrencyBaseDto[],
    @GetUser() userAuthAdmin: any,
  ) {
    return this.currencyBaseService.updateAllRateBase(
      updateAllCurrencyBaseDto,
      userAuthAdmin,
    );
  }
  //END

  // Our Payment Method
  // GET - Lista todos los métodos de pago disponibles (PUBLIC)
  @Get('our-payment-method-list')
  getAllPaymentMethods() {
    return this.ourPaymentMethodService.getAllActivePaymentMethods();
  }

  // GET - Obtiene un método de pago por ID o País
  @Get('our-payment-method/:id')
  @RoleProtected(ValidRoles.admin, ValidRoles.assessor, ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  getPaymentMethodByIdOrCountry(@Param() params: GetPaymentMethodParamDto) {
    return this.ourPaymentMethodService.getPaymentMethodByIdOrCountry(
      params.id,
    );
  }

  @SkipThrottle({ default: false })
  @Post('our-payment-method/create')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  createPaymentMethod(
    @Body() createOurPaymentMethodDto: CreateOurPaymentMethodDto,
    @GetUser() userAuthAdmin: UserAuth,
  ) {
    return this.ourPaymentMethodService.createPaymentMethod(
      createOurPaymentMethodDto,
      userAuthAdmin,
    );
  }

  // PATCH - Actualiza un método de pago (PRIVATE - Admin)
  @SkipThrottle({ default: false })
  @Patch('our-payment-method/update/:id')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  updatePaymentMethod(
    @Param('id') id: string,
    @Body() updateOurPaymentMethodDto: UpdateOurPaymentMethodDto,
    @GetUser() userAuthAdmin: UserAuth,
  ) {
    return this.ourPaymentMethodService.updatePaymentMethod(
      id,
      updateOurPaymentMethodDto,
      userAuthAdmin,
    );
  }

  // PATCH - Actualiza solo el estado isActive (PRIVATE - Admin)
  @SkipThrottle({ default: false })
  @Patch('our-payment-method/update-active/:id')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  updatePaymentMethodActive(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
    @GetUser() userAuthAdmin: UserAuth,
  ) {
    return this.ourPaymentMethodService.updatePaymentMethodActive(
      id,
      body.isActive,
      userAuthAdmin,
    );
  }

  // DELETE - Elimina un método de pago (PRIVATE - Admin)
  @SkipThrottle({ default: false })
  @Delete('our-payment-method/delete/:id')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  deletePaymentMethod(
    @Param('id') id: string,
    @GetUser() userAuthAdmin: UserAuth,
  ) {
    return this.ourPaymentMethodService.deletePaymentMethod(id, userAuthAdmin);
  }
  //END

  // USERS MODULE
  // GET - Lista todos los usuarios excluyendo clientes (paginado, con filtros) - PRIVATE (Admin)
  @Get('users')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  getUsers(@Query() query: GetUsersQueryDto) {
    return this.userService.findAll(query);
  }

  // GET - Obtiene un usuario por ID - PRIVATE (Admin)
  @Get('users/:id')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  getUser(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  // POST - Crea un nuevo usuario desde admin con contraseña generada automáticamente - PRIVATE (Admin)
  @SkipThrottle({ default: false })
  @Post('users')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  createUserAdmin(@Body() createUserAdminDto: CreateUserAdminDto) {
    return this.userService.createUserAdmin(createUserAdminDto);
  }

  // PATCH - Actualiza un usuario - PRIVATE (Admin)
  @SkipThrottle({ default: false })
  @Patch('users/:id')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  updateUserAdmin(
    @Param('id') id: string,
    @Body() updateUserAdminDto: UpdateUserAdminDto,
  ) {
    return this.userService.updateUserAdmin(id, updateUserAdminDto);
  }

  // PATCH - Cambia de rol a un usuario - PRIVATE (Admin)
  @SkipThrottle({ default: false })
  @Patch('users/:id/role')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  changeUserRole(
    @Param('id') id: string,
    @Body() changeRoleDto: ChangeRoleDto,
  ) {
    return this.userService.changeRole(id, changeRoleDto);
  }

  // PATCH - Activa/desactiva un usuario - PRIVATE (Admin)
  @SkipThrottle({ default: false })
  @Patch('users/:id/active')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  setUserActive(@Param('id') id: string, @Body() setActiveDto: SetActiveDto) {
    return this.userService.setActive(id, setActiveDto);
  }

  // PATCH - Resetea la contraseña de un usuario - PRIVATE (Admin)
  @SkipThrottle({ default: false })
  @Patch('users/:id/reset-password')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  resetPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.userService.resetPassword(id, resetPasswordDto.password);
  }

  // DELETE - Elimina un usuario - PRIVATE (Admin)
  @SkipThrottle({ default: false })
  @Delete('users/:id')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  deleteUser(@Param('id') id: string) {
    return this.userService.delete(id);
  }
  // END USERS

  // ROLES - GET all roles excluding client
  @Get('roles')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  async getRoles() {
    const roles = await this.userService['prisma'].role.findMany({
      where: {
        name: {
          not: 'client',
        },
      },
      select: {
        id: true,
        name: true,
        level: true,
      },
    });
    return { ok: true, data: roles };
  }
}
