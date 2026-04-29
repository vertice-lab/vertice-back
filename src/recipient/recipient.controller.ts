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
import { RecipientService } from './recipient.service';
import { CreateRecipientDto } from './dto/create-recipient.dto';
import { UpdateRecipientDto } from './dto/update-recipient.dto';
import { SkipThrottle } from '@nestjs/throttler';
import {
  RoleProtected,
  ValidRoles,
} from 'src/auth/decorators/role-protected/role-protected.decorator';
import { AuthGuard } from 'src/auth/guards/auth/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';

@Controller('recipient')
export class RecipientController {
  constructor(private readonly recipientService: RecipientService) {}

  @SkipThrottle({ default: false })
  @Post('create')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  create(@Body() createRecipientDto: CreateRecipientDto) {
    return this.recipientService.create(createRecipientDto);
  }

  @Get()
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.recipientService.findAll(pageNumber, limitNumber);
  }

  @Get(':id')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  findOne(@Param('id') id: string) {
    return this.recipientService.findOne(id);
  }

  @Get(':id/payment-details')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  findPaymentDetails(
    @Param('id') id: string,
    @Query('toCurrency') toCurrency?: string,
  ) {
    return this.recipientService.findPaymentDetailsByRecipient(id, toCurrency);
  }

  @Patch(':id')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  update(
    @Param('id') id: string,
    @Body() updateRecipientDto: UpdateRecipientDto,
  ) {
    return this.recipientService.update(id, updateRecipientDto);
  }

  @Delete(':id')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.recipientService.remove(id);
  }
}
