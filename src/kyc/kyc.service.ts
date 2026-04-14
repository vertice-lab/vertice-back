import {
  Injectable,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import axios from 'axios';
import { CreateSessionDto } from './dto/create-session.dto';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { ConfigService } from '@nestjs/config';
import { CreateSessionResponse } from './interfaces/create-session.interface';
import { ListUsersResponse } from './interfaces/get-list-users.interfaces';
import { ListUsersQueryDto } from './dto/get-list-users.dto';
import { KycStatus } from './interfaces/kyc-status.enum';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);
  private readonly DIDIT_API_URL: string;
  private readonly DIDIT_API_KEY: string;

  // Note: the webhook secret should be extracted from ConfigService if possible,
  // but using process.env directly here for simplicity if it's already loaded
  private readonly WEBHOOK_SECRET = process.env.DIDIT_WEBHOOK_SECRET || '';

  constructor(
    private prisma: PrismaClientService,
    private configService: ConfigService
  ) {

    const diditUrl = this.configService.get<string>('DIDIT_BASE_URL');
    if (diditUrl) {
      this.DIDIT_API_URL = diditUrl;
    } else {
      this.logger.warn('DIDIT_API_URL is not set in environment variables. Using default value.');
    }

    const diditApiKey = this.configService.get<string>('DIDIT_API_KEY');
    if (diditApiKey) {
      this.DIDIT_API_KEY = diditApiKey;
    } else {
      this.logger.warn('DIDIT_API_KEY is not set in environment variables. Using default value.');
    }
  }

   
  public validateSignature(
    rawBody: Buffer,
    signatureGiven: string,
    timestampStr: string,
  ): boolean {
    if (!this.WEBHOOK_SECRET) {
      this.logger.error('DIDIT_WEBHOOK_SECRET is not configured in .env');
      throw new InternalServerErrorException('Webhook secret not configured');
    }

    if (!rawBody || !signatureGiven || !timestampStr) {
      return false;
    }

    // Comprobar la frescura del timestamp (5 minutos máximo)
    const timestamp = parseInt(timestampStr, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 300) {
      this.logger.warn(`Webhook timestamp is too old or in the future: ${timestamp}`);
      return false;
    }

    // Calcular nuestro hash esperado
    const expectedHash = crypto
      .createHmac('sha256', this.WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    this.logger.log(`🔍 Firma calculada: ${expectedHash} | 🔑 Firma de Didit: ${signatureGiven}`);

    // Usar timingSafeEqual para evitar ataques de timing
    try {
      const expectedBuffer = Buffer.from(expectedHash, 'hex');
      const givenBuffer = Buffer.from(signatureGiven, 'hex');

      if (expectedBuffer.length !== givenBuffer.length) {
        return false;
      }
      return crypto.timingSafeEqual(expectedBuffer, givenBuffer);
    } catch (e) {
      return false;
    }
  }

  /**
   * Mapea el status que envía Didit al enum KycStatus de Prisma.
   * Didit envía: 'Approved', 'Declined', 'Abandoned', 'In Progress', 'In Review', 'Not Started'
   */
  private mapDiditStatus(diditStatus: string): KycStatus {
    const normalized = diditStatus?.toLowerCase().replace(/\s+/g, '_');
    const statusMap: Record<string, KycStatus> = {
      'approved': KycStatus.APPROVED,
      'declined': KycStatus.DECLINED,
      'abandoned': KycStatus.ABANDONED,
      'in_progress': KycStatus.IN_PROGRESS,
      'in_review': KycStatus.IN_REVIEW,
      'not_started': KycStatus.NOT_STARTED,
    };
    return statusMap[normalized] || KycStatus.IN_PROGRESS;
  }

  public async handleDiditWebhook(payload: any): Promise<void> {
    this.logger.log(`📦 PAYLOAD COMPLETO RECIBIDO:\n${JSON.stringify(payload, null, 2)}`);
    const { session_id, status, decision } = payload;
    this.logger.log(`Processing Webhook for session ${session_id} - status: ${status}`);

    if (!session_id || !status) {
      this.logger.warn('Webhook payload missing session_id or status');
      return;
    }

    try {
      const mappedStatus = this.mapDiditStatus(status);

      await this.prisma.user.update({
        where: { kycSessionId: session_id },
        data: {
          kycStatus: mappedStatus,
          ...(mappedStatus === KycStatus.APPROVED && { verified: true }),
        },
      });

      this.logger.log(`✅ Session ${session_id} updated to ${mappedStatus}.`);

      // Print decision info to logs when available
      if (decision) {
        this.logger.log(`Decision received for session: ${JSON.stringify(decision)}`);
      }
    } catch (error) {
      this.logger.error(`Error updating user for session ${session_id}`, error.stack);
    }
  }

 
  async createDiditSession(payload: CreateSessionDto, userId: string): Promise<CreateSessionResponse> {
    try {
      const finalPayload = {
        ...payload,
        workflow_id: payload.workflow_id || this.configService.get<string>('DIDIT_WORKFLOW_ID'),
        callback: payload.callback || this.configService.get<string>('DIDIT_CALLBACK_URL') || 'https://tu-api.com/kyc/webhook/didit',
      };

      const { data } = await axios.post<CreateSessionResponse>(
        `${this.DIDIT_API_URL}/v3/session`,
        finalPayload,
        {
          headers: {
            'x-api-key': this.DIDIT_API_KEY, 
            'Content-Type': 'application/json',
          },
        },
      );

      // Guardar el session_id en el usuario para que el webhook pueda encontrarlo
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          kycSessionId: data.session_id,
          kycStatus: KycStatus.IN_PROGRESS,
        },
      });

      this.logger.log(`Didit session created and linked to user ${userId}`);
      return data;
    } catch (error) {
      this.logger.error('Error creating Didit session', error?.response?.data || error.message);
      throw new InternalServerErrorException(
        'Failed to create Didit session',
        error?.response?.data || error.message,
      );
    }
  }

  async getKycStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        kycStatus: true,
        kycSessionId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      kycStatus: user.kycStatus,
      kycSessionId: user.kycSessionId,
    };
  }

  async getListUsers(payload: ListUsersQueryDto): Promise<ListUsersResponse> {
    try {
      
      const { data } = await axios.get<ListUsersResponse>(
        `${this.DIDIT_API_URL}/v3/users`,
        
        {
          headers: {
            'x-api-key': this.DIDIT_API_KEY, 
            'Content-Type': 'application/json',
          },
          params: {
            status: payload.status,
            search: payload.search,
            country: payload.country,
            limit: payload.limit,
            offset: payload.offset,
          }
        },
      );
      this.logger.log('Didit users list retrieved successfully');
      return data
    } catch (error) {
      this.logger.error('Error retrieving Didit users list', error.stack);this.logger.error('Error', error?.response?.data || error.message);
      throw new InternalServerErrorException(
        'Failed to retrieve Didit users list',
        error?.response?.data || error.message,
      );
    }
  }
}
