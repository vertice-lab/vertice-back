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
} from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import { KycService } from './kyc.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { RoleProtected, ValidRoles } from 'src/auth/decorators/role-protected/role-protected.decorator';
import { AuthGuard } from 'src/auth/guards/auth/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { ListUsersQueryDto } from './dto/get-list-users.dto';

@Controller('kyc')
export class KycController {
  private readonly logger = new Logger(KycController.name);

  constructor(private readonly kycService: KycService) {}

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
  ) {
    try {
      const signature = (req.headers['x-signature-v2'] || req.headers['x-signature']) as string;
      const timestamp = req.headers['x-timestamp'] as string;
      const destinationId = req.headers['x-destination-id'] || req.headers['destination-id'];

      this.logger.log('--- 🚀 NUEVO WEBHOOK ENTRANTE DE DIDIT ---');
      this.logger.log(`Headers -> Signature: ${signature || 'FALTA'}, Timestamp: ${timestamp || 'FALTA'}, Destination: ${destinationId || 'FALTA'}`);
      
      if (!signature || !timestamp) {
        this.logger.warn('Missing Didit headers');
        throw new UnauthorizedException('Missing headers');
      }

      const rawBody = req.rawBody;

      if (!rawBody) {
        this.logger.error('Raw body is not enabled in NestJS app configuration. Cannot verify signature.');
        throw new UnauthorizedException('Invalid payload');
      }

      const isValid = this.kycService.validateSignature(
        rawBody,
        signature,
        timestamp,
      );

      if (!isValid) {
        this.logger.error('Invalid signature for webhook from Didit');
        throw new UnauthorizedException('Invalid signature');
      }

      // Si la firma es válida, parseamos el JSON original
      const payload = JSON.parse(rawBody.toString('utf8'));
      
      // Importante: Procesar asíncronamente si toma mucho tiempo, o enviar la respuesta 200 de inmediato
      // ya que Didit puede hacer retries si la conexión tarda.
      this.kycService.handleDiditWebhook(payload).catch((err) => {
        this.logger.error('Error in async webhook processing', err);
      });

      // Retornar código 200 a Didit rápidamente para confirmar la recepción
      return res.status(200).send('Webhook received');
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return res.status(401).send('Unauthorized');
      }
      this.logger.error('Error handling webhook', error);
      return res.status(500).send('Internal Server Error');
    }
  }
}
