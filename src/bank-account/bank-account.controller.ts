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
import { BankAccountService } from './bank-account.service';
import { CreateBankAccountDto, UpdateBankAccountDto } from './dto';
import { AuthGuard } from 'src/auth/guards/auth/auth.guard';
import { GetUser } from 'src/auth/decorators/user/user.decorator';
import { UserAuth } from 'src/auth/interfaces/user/user-auth';
import {
  RoleProtected,
  ValidRoles,
} from 'src/auth/decorators/role-protected/role-protected.decorator';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { KycGuard } from 'src/auth/guards/kyc/kyc.guard';

@Controller('bank-account')
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  @Post('create')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard, KycGuard)
  createBankAccount(
    @GetUser() user: UserAuth,
    @Body() createBankAccountDto: CreateBankAccountDto,
  ) {
    return this.bankAccountService.createBankAccount(
      user.sub,
      createBankAccountDto,
    );
  }

  @Get('list')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  getUserBankAccounts(@GetUser() user: UserAuth) {
    return this.bankAccountService.getUserBankAccounts(user.sub);
  }

  @Get('search')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  searchBankAccounts(
    @GetUser() user: UserAuth,
    @Query('currency') currency: string,
  ) {
    return this.bankAccountService.findBankAccountsByCurrency(
      user.sub,
      currency,
    );
  }

  @Get(':id')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  getBankAccountById(@GetUser() user: UserAuth, @Param('id') id: string) {
    return this.bankAccountService.getBankAccountById(user.sub, id);
  }

  @Patch(':id')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  updateBankAccount(
    @GetUser() user: UserAuth,
    @Param('id') id: string,
    @Body() updateBankAccountDto: UpdateBankAccountDto,
  ) {
    return this.bankAccountService.updateBankAccount(
      user.sub,
      id,
      updateBankAccountDto,
    );
  }

  @Delete(':id')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  deleteBankAccount(@GetUser() user: UserAuth, @Param('id') id: string) {
    return this.bankAccountService.deleteBankAccount(user.sub, id);
  }

  @Patch(':id/toggle-status')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  toggleBankAccountStatus(@GetUser() user: UserAuth, @Param('id') id: string) {
    return this.bankAccountService.toggleBankAccountStatus(user.sub, id);
  }
}
