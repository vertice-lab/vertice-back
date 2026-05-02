import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  Logger,
  UnauthorizedException,
  RawBodyRequest,
  Body,
  UseGuards,
  Query,
  Get,
  Request,
  Param,
  Patch,
} from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import { KycService } from './kyc.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { RoleProtected, ValidRoles } from 'src/auth/decorators/role-protected/role-protected.decorator';
import { AuthGuard } from 'src/auth/guards/auth/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { ListUsersQueryDto } from './dto/get-list-users.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('kyc')
export class KycController {
  private readonly logger = new Logger(KycController.name);

  constructor(private readonly kycService: KycService) { }

  @Post('session')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  async createSession(@Body() payload: CreateSessionDto, @Request() req) {
    const userId = req.user.sub;
    return this.kycService.createDiditSession(payload, userId);
  }

  @Get('status')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  async getKycStatus(@Request() req) {
    const userId = req.user.sub;
    return this.kycService.getKycStatus(userId);
  }

  @Get('list-users')
  @RoleProtected(ValidRoles.admin, ValidRoles.manager)
  @UseGuards(AuthGuard, RolesGuard)
  async listUsers(@Query() payload: ListUsersQueryDto) {
    return this.kycService.getListUsers(payload);
  }

  @Post('webhook/didit')
  async handleDiditWebhook(
    @Req() req: RawBodyRequest<ExpressRequest>,
    @Res() res: Response,
    @Headers('x-signature-v2') signature: string,
    @Headers('x-timestamp') timestamp: string,
  ) {
    try {
      // this.logger.log(`Headers -> Signature-V2: ${signature || 'FALTA'}, Timestamp: ${timestamp || 'FALTA'}`);

      if (!signature) {
        this.logger.warn('Cabeceras de Didit no encontradas');
        throw new UnauthorizedException('Cabeceras de Didit no encontradas');
      }

      const rawBody = req.rawBody;

      if (!rawBody) {
        // this.logger.error('Raw body no habilitado en la configuración de la aplicación NestJS. No se puede verificar la firma.');
        throw new UnauthorizedException('Payload inválido');
      }

      const payload = JSON.parse(rawBody.toString('utf8'));


      const isValid = this.kycService.validateSignature(
        rawBody,
        signature,
        timestamp,
      );

      if (!isValid) {
        this.logger.error('Invalid signature for webhook from Didit');
        throw new UnauthorizedException('Invalid signature');
      }


      this.kycService.handleDiditWebhook(payload).catch((err) => {
        this.logger.error('Error in async webhook processing', err);
      });

      return res.status(200).send('Webhook received');
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return res.status(401).send('Unauthorized');
      }
      this.logger.error('Error handling webhook', error);
      return res.status(500).send('Internal Server Error');
    }
  }

  @Get('session-decision-user')
  @RoleProtected(ValidRoles.client)
  @UseGuards(AuthGuard, RolesGuard)
  async getSessionDecisionUser(@Request() req) {
    const userId = req.user.sub;
    return this.kycService.getSessionDecisionForUser(userId);
  }

  @Get('session/:sessionId/decision')
  @RoleProtected(ValidRoles.client, ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  async getSessionDecision(@Request() req, @Param('sessionId') sessionId: string) {
   
    const userId = req.user?.sub || 'usuario-de-prueba';

    return this.kycService.getRetrieveSessionDecision(sessionId, userId);
  }

  @Patch('session/:sessionId/update-status')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  async updateStatus(@Param('sessionId') sessionId: string, @Body() payload: UpdateStatusDto) {
    return this.kycService.updateStatus(sessionId, payload);
  }

  @Patch('admin/reset-kyc/:userId')
  @RoleProtected(ValidRoles.admin)
  @UseGuards(AuthGuard, RolesGuard)
  async resetKyc(@Param('userId') userId: string) {
    return this.kycService.resetKycForUser(userId);
  }
}
