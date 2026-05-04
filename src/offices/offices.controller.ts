import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
  Query,
} from '@nestjs/common';
import { OfficesService } from './offices.service';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import {
  RoleProtected,
  ValidRoles,
} from 'src/auth/decorators/role-protected/role-protected.decorator';
import { AuthGuard } from 'src/auth/guards/auth/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('offices')
export class OfficesController {
  constructor(private readonly officesService: OfficesService) {}

  @SkipThrottle({ default: false })
  @Post('create')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  create(@Body() createOfficeDto: CreateOfficeDto) {
    return this.officesService.create(createOfficeDto);
  }

  @SkipThrottle({ default: false })
  @Patch('update/:id')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  update(@Param('id') id: string, @Body() updateOfficeDto: UpdateOfficeDto) {
    return this.officesService.update(id, updateOfficeDto);
  }

  @SkipThrottle({ default: false })
  @Put('status/:id')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() updateOfficeDto: UpdateOfficeDto,
  ) {
    return this.officesService.changeStatusActive(id, updateOfficeDto);
  }

  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('list')
  @RoleProtected(ValidRoles.client, ValidRoles.admin, ValidRoles.assessor)
  @UseGuards(AuthGuard, RolesGuard)
  findAll() {
    return this.officesService.findAllOffices();
  }

  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('list-public')
  findAllPublic() {
    return this.officesService.findAllOffices();
  }

  @Get('by/pairs')
  @RoleProtected(ValidRoles.client, ValidRoles.admin, ValidRoles.assessor)
  @UseGuards(AuthGuard, RolesGuard)
  findOfficeByPairs(@Query("fromCurrency") fromCurrency: string, @Query("toCurrency") toCurrency: string) {
    return this.officesService.findOfficeByPairs(fromCurrency, toCurrency);
  }

  @SkipThrottle({ default: false })
  @Delete('destroy/:id')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  destroyOffice(@Param('id') id: string) {
    return this.officesService.remove(id);
  }
}
