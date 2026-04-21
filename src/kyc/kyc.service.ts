import {
  Injectable,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  HttpException,
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
import { GetRetrieveSessionResponse } from './interfaces/get-retrieve-session';
import { FeatureType } from './type/types.enum';
import { UpdateStatusDto } from './dto/update-status.dto';
import { KycGateway } from './kyc.gateway';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);
  private readonly DIDIT_API_URL?: string;
  private readonly DIDIT_API_KEY?: string;


  private readonly WEBHOOK_SECRET = process.env.DIDIT_WEBHOOK_SECRET || '';

  constructor(
    private prisma: PrismaClientService,
    private configService: ConfigService,
    private kycGateway: KycGateway,
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

    if (!rawBody || !signatureGiven) {
      return false;
    }

    if (timestampStr) {
      const timestamp = parseInt(timestampStr, 10);
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - timestamp) > 300) {
        this.logger.warn(`Webhook timestamp is too old or in the future: ${timestamp}`);
        return false;
      }
    }

    const expectedHash = crypto
      .createHmac('sha256', this.WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    this.logger.log(`🔍 Firma calculada (V2): ${expectedHash} | 🔑 Firma de Didit (V2): ${signatureGiven}`);

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


  private hasFraudWarnings(decision: any): string[] {
    if (!decision) return [];

    const found: string[] = [];
    const dangerousRisks = ['DUPLICATED_FACE', 'POSSIBLE_DUPLICATED_USER'];
    const sections = [
      ...(decision.liveness_checks || []),
      ...(decision.id_verifications || []),
      ...(decision.face_matches || []),
    ];
    for (const section of sections) {
      for (const warning of (section.warnings || [])) {
        if (dangerousRisks.includes(warning.risk)) {
          found.push(warning.risk);
        }
      }
    }
    return found;
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

      if (decision) {
        this.logger.log(`Decision received for session: ${JSON.stringify(decision)}`);
      }

      // ── Detección de fraude ──
      const fraudWarnings = this.hasFraudWarnings(decision);
      let finalStatus = mappedStatus;
      if (fraudWarnings.length > 0) {
        this.logger.warn(`🚨 FRAUDE DETECTADO para sesión ${session_id}: ${fraudWarnings.join(', ')}`);
        await this.prisma.user.update({
          where: { kycSessionId: session_id },
          data: {
            kycStatus: KycStatus.DECLINED,
            active: false,
          },
        });
        finalStatus = KycStatus.DECLINED;
      }

      // ── Sincronizar datos del usuario con los del KYC (solo si fue aprobado y no hubo fraude) ──
      if (finalStatus === KycStatus.APPROVED && decision) {
        await this.syncUserDataFromKyc(session_id, decision);
      }

      const user = await this.prisma.user.findUnique({
        where: { kycSessionId: session_id },
        select: { id: true },
      });
      if (user) {
        this.kycGateway.notifyKycStatusUpdated(user.id, finalStatus);
      }
    } catch (error: any) {
      throw new InternalServerErrorException(error.message)
    }
  }

  /**
   * Compara los datos del KYC (nombre, apellido, documento) con los de la DB.
   * Solo actualiza si el KYC fue aprobado Y el valor del KYC es válido (no vacío, mínimo 2 caracteres).
   */
  private async syncUserDataFromKyc(sessionId: string, decision: any): Promise<void> {
    // Tomamos la primera verificación de identidad (la principal)
    const idVerification = decision.id_verifications?.[0];
    if (!idVerification) {
      this.logger.warn(`No hay id_verifications en la decisión para sesión ${sessionId}`);
      return;
    }

    const kycFirstName = idVerification.first_name?.trim() || null;
    const kycLastName = idVerification.last_name?.trim() || null;
    const kycDocumentNumber = idVerification.document_number?.trim() || null;
    const kycDocumentType = idVerification.document_type?.trim() || null;

    const currentUser = await this.prisma.user.findUnique({
      where: { kycSessionId: sessionId },
      select: {
        id: true,
        name: true,
        lastName: true,
        information: {
          select: {
            documentNumber: true,
            documentType: true,
          },
        },
      },
    });

    if (!currentUser) {
      this.logger.warn(`Usuario no encontrado para sesión ${sessionId} al sincronizar datos`);
      return;
    }

    const userUpdates: Record<string, string> = {};

    if (this.isValidKycValue(kycFirstName) && kycFirstName !== currentUser.name) {
      this.logger.log(`📝 Actualizando nombre: "${currentUser.name}" → "${kycFirstName}"`);
      userUpdates.name = kycFirstName;
    }

    if (this.isValidKycValue(kycLastName) && kycLastName !== currentUser.lastName) {
      this.logger.log(`📝 Actualizando apellido: "${currentUser.lastName}" → "${kycLastName}"`);
      userUpdates.lastName = kycLastName;
    }

    if (Object.keys(userUpdates).length > 0) {
      await this.prisma.user.update({
        where: { kycSessionId: sessionId },
        data: userUpdates,
      });
    }

    const infoUpdates: Record<string, string> = {};

    if (this.isValidKycValue(kycDocumentNumber) && kycDocumentNumber !== currentUser.information?.documentNumber) {
      this.logger.log(`📝 Actualizando documento: "${currentUser.information?.documentNumber}" → "${kycDocumentNumber}"`);
      infoUpdates.documentNumber = kycDocumentNumber;
    }

    if (this.isValidKycValue(kycDocumentType) && kycDocumentType !== currentUser.information?.documentType) {
      this.logger.log(`📝 Actualizando tipo documento: "${currentUser.information?.documentType}" → "${kycDocumentType}"`);
      infoUpdates.documentType = kycDocumentType;
    }

    if (Object.keys(infoUpdates).length > 0 && currentUser.information) {
      await this.prisma.informationUser.update({
        where: { userId: currentUser.id },
        data: infoUpdates,
      });
    }

    this.logger.log(`✅ Sincronización de datos KYC completada para sesión ${sessionId}`);
  }


  private isValidKycValue(value: string | null): value is string {
    if (!value) return false;
    if (value.length < 2) return false;
    const invalidPlaceholders = ['N/A', 'NA', 'NONE', 'NULL', 'UNKNOWN', '-', '--', '..'];
    if (invalidPlaceholders.includes(value.toUpperCase())) return false;
    return true;
  }


  async createDiditSession(payload: CreateSessionDto, userId: string): Promise<CreateSessionResponse> {
    try {
      const finalPayload = {
        ...payload,
        workflow_id: payload.workflow_id || this.configService.get<string>('DIDIT_WORKFLOW_ID'),
        callback: payload.callback || this.configService.get<string>('DIDIT_CALLBACK_URL')
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

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          kycSessionId: data.session_id,
          kycStatus: KycStatus.IN_PROGRESS,
        },
      });

      this.logger.log(`Didit session created and linked to user ${userId}`);
      return data;
    } catch (error: any) {
      this.logger.error('Error creating Didit session', error?.response?.data || error.message);
      throw new InternalServerErrorException(
        'Failed to create Didit session',
        error?.response?.data || error.message,
      );
    }
  }

  async getKycStatus(userId: string) {

    try {
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

    } catch (error: any) {
      throw new InternalServerErrorException(
        'Error get status',
        error?.response?.data || error.message,
      );
    }
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
    } catch (error: any) {
      this.logger.error('Error retrieving Didit users list', error.stack); this.logger.error('Error', error?.response?.data || error.message);
      throw new InternalServerErrorException(
        'Failed to retrieve Didit users list',
        error?.response?.data || error.message,
      );
    }
  }


  async getRetrieveSessionDecision(sessionId: string, userId: string) {
    try {
      if (!sessionId) return

      const { data } = await axios.get<GetRetrieveSessionResponse>(
        `${this.DIDIT_API_URL}/v3/session/${sessionId}/decision`,
        {
          headers: {
            'x-api-key': this.DIDIT_API_KEY,
            'Content-Type': 'application/json',
          },
        },
      );


      const id_verificationsStatus = data.id_verifications.flatMap((v) => {

        return {
          status: v.status,
          matches: v.matches.map((m) => m),
          warnings: v.warnings.flatMap((w) => w),
        }
      });
      const liveness_checksStatus = data.liveness_checks.flatMap((v) => {

        return {
          status: v.status,
          matches: v.matches.map((m) => m),
          warnings: v.warnings.flatMap((w) => w),
        }
      });
      const face_matchesStatus = data.face_matches.flatMap((v) => {

        return {
          status: v.status,
          score: v.score,
          warnings: v.warnings.flatMap((w) => w),
        }
      });

      const ip_analysesStatus = data.ip_analyses.flatMap((v) => {

        return {
          status: v.status,
          device_brand: v.device_brand,
          warnings: v.warnings.flatMap((w) => w),
          browser_family: v.browser_family,
          os_family: v.os_family,
          platform: v.platform,
          ip_country_code: v.ip_country_code,
          ip_state: v.ip_state,
          ip_city: v.ip_city,
          isp: v.isp,
          organization: v.organization,
          is_vpn_or_tor: v.is_vpn_or_tor,
          is_data_center: v.is_data_center,
        }
      });




      const features = data.features as FeatureType[] || [];
      const userInformation = data.id_verifications.map((v) => ({
        firstName: v.first_name,
        lastName: v.last_name,
        documentType: v.document_type,
        documentNumber: v.document_number,
        frontImage: v.front_image,
        age: v.age,
        dateOfBirth: v.date_of_birth,
        expirationDate: v.expiration_date,
        dateOfIssue: v.date_of_issue,
        issuingState: v.issuing_state,
        issuingStateName: v.issuing_state_name
      })) || [];


      return {
        ok: true,
        sessionNumber: data.session_number,
        status: data.status,
        vendorData: data.vendor_data,
        features: features,
        user: userInformation,
        id_verification: id_verificationsStatus,
        liveness: liveness_checksStatus,
        face_matches: face_matchesStatus,
        ip_analyses: ip_analysesStatus
      }

    } catch (error: any) {
      this.logger.error(`Error retrieving decision for session ${sessionId}`, error.stack);
      throw new InternalServerErrorException(
        `Failed to retrieve decision for session ${sessionId}`,
        error?.response?.data || error.message,
      );
    }
  }

  async updateStatus(sessionId: string, payload: UpdateStatusDto) {
    try {
      const { data } = await axios.patch<{ session_id: string }>(
        `${this.DIDIT_API_URL}/v3/session/${sessionId}/update-status`,
        payload,
        {
          headers: {
            'x-api-key': this.DIDIT_API_KEY,
            'Content-Type': 'application/json',
          },
        },
      );

      return data;
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail || 'Error en Didit API';

        if (status === 400) {
          throw new BadRequestException(detail);
        } else if (status === 404) {
          throw new NotFoundException(detail);
        } else {
          throw new HttpException(detail, status);
        }
      }

      throw new InternalServerErrorException('Error general al actualizar el estado de la sesión, no se pudo contactar a Didit');
    }
  }
}
