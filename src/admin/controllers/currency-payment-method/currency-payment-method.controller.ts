import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

import { CurrencyPaymentMethodService } from 'src/admin/service/currency-payment-method/currency-payment-method.service';
import {
  RoleProtected,
  ValidRoles,
} from 'src/auth/decorators/role-protected/role-protected.decorator';
import { GetUser } from 'src/auth/decorators/user/user.decorator';
import { AuthGuard } from 'src/auth/guards/auth/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { UserAuth } from 'src/auth/interfaces/user/user-auth';
import {
  CreateCurrencyPaymentMethodDto,
  UpdateCurrencyPaymentMethodDto,
  UpdateIsActiveCurrencyPaymentMethodDto,
  GetPaymentMethodsByRateDto,
} from '../../dto/rate-payment-method/currency-rate-payment-method.dto';

@Controller('currency-payment-method')
export class CurrencyPaymentMethodController {
  constructor(
    private currencyPaymentMethodService: CurrencyPaymentMethodService,
  ) {}

  // PUBLIC - Get all currency payment methods
  @Get()
  async getAllCurrencyPaymentMethods() {
    return this.currencyPaymentMethodService.getAllCurrencyPaymentMethods();
  }

  // PUBLIC - Get currency payment method by ID
  @Get(':id')
  async getCurrencyPaymentMethodById(@Param('id') id: string) {
    return this.currencyPaymentMethodService.getCurrencyPaymentMethodById(id);
  }

  @SkipThrottle({ default: false })
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  @Get('by-rate/:currencyRateId/:currency')
  async getPaymentMethodsByRate(
    @Param('currencyRateId') currencyRateId: string,
    @Param('currency') currency: string,
  ) {
    return this.currencyPaymentMethodService.getPaymentMethodsByCurrencyRate(
      currencyRateId,
      currency,
    );
  }

  // PRIVATE - Create currency payment method (admin only)
  @SkipThrottle({ default: false })
  @Post('create')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  createCurrencyPaymentMethod(
    @Body() createCurrencyPaymentMethodDto: CreateCurrencyPaymentMethodDto,
    @GetUser() userAuthAdmin: UserAuth,
  ) {
    return this.currencyPaymentMethodService.createCurrencyPaymentMethod(
      createCurrencyPaymentMethodDto,
      userAuthAdmin,
    );
  }

  // PRIVATE - Update currency payment method (admin only)
  @SkipThrottle({ default: false })
  @Patch('update/:id')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  updateCurrencyPaymentMethod(
    @Param('id') id: string,
    @Body() updateCurrencyPaymentMethodDto: UpdateCurrencyPaymentMethodDto,
    @GetUser() userAuthAdmin: UserAuth,
  ) {
    return this.currencyPaymentMethodService.updateCurrencyPaymentMethod(
      id,
      updateCurrencyPaymentMethodDto,
      userAuthAdmin,
    );
  }

  // PRIVATE - Update only isActive flag (admin only)
  @SkipThrottle({ default: false })
  @Patch('update-active/:id')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  updateCurrencyPaymentMethodActive(
    @Param('id') id: string,
    @Body() updateIsActiveDto: UpdateIsActiveCurrencyPaymentMethodDto,
    @GetUser() userAuthAdmin: UserAuth,
  ) {
    return this.currencyPaymentMethodService.updateCurrencyPaymentMethodActive(
      id,
      updateIsActiveDto,
      userAuthAdmin,
    );
  }

  // PRIVATE - Delete currency payment method (admin only)
  @SkipThrottle({ default: false })
  @Delete('delete/:id')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  deleteCurrencyPaymentMethod(
    @Param('id') id: string,
    @GetUser() userAuthAdmin: UserAuth,
  ) {
    return this.currencyPaymentMethodService.deleteCurrencyPaymentMethod(
      id,
      userAuthAdmin,
    );
  }
}
