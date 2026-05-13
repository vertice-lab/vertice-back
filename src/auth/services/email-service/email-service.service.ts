import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { UserEmailAuthDto } from 'src/auth/dto/auth.dto';
import {
  sendEmailChangePassword,
  sendEmailTemplate,
  sendOtpEmailTemplate,
  sendOtpForgotPasswordTemplate,
  sendDeleteAccountTemplate,
  sendDeleteAccountOtpTemplate,
  sendSupportTemplate,
} from 'src/auth/emails/emails';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailServiceService {
  private readonly logger = new Logger(EmailServiceService.name);
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('API_KEY_RESEND');
    if (!apiKey) {
      throw new Error('Resend API key is not configured');
    }
    this.resend = new Resend(apiKey);
  }

  async sendTempEmail(tempRegister: UserEmailAuthDto, token: string) {
    try {
      await this.emailConfig(
        'support',
        'Bienvenido a Vertice',
        tempRegister.email,
        sendEmailTemplate({ email: tempRegister.email, token }),
      );
    } catch (error: any) {
      this.logger.error(`Email sending failed: ${error.message}`);
      throw new InternalServerErrorException('Email sending failed');
    }
  }

  async sendOtpEmail(email: string, token: string) {
    try {
      await this.emailConfig(
        'support',
        'Verifica tu correo electrónico - Vértice',
        email,
        sendOtpEmailTemplate({ email, token }),
      );
    } catch (error: any) {
      this.logger.error(`Email sending failed: ${error.message}`);
      throw new InternalServerErrorException('Email sending failed');
    }
  }

  async sendOtpForgotPasswordEmail(email: string, token: string) {
    try {
      await this.emailConfig(
        'support',
        'Restablecer contraseña - Vértice',
        email,
        sendOtpForgotPasswordTemplate({ email, token }),
      );
    } catch (error: any) {
      this.logger.error(`Email sending failed: ${error.message}`);
      throw new InternalServerErrorException('Email sending failed');
    }
  }

  async sendEmailChangePassword(email: string, token: string) {
    try {
      await this.emailConfig(
        'support',
        `Hola, ${email}`,
        email,
        sendEmailChangePassword({ email: email, token }),
      );
    } catch (error: any) {
      this.logger.error(`Email sending failed: ${error.message}`);
      throw new InternalServerErrorException('Email sending failed');
    }
  }

  async sendDeleteAccountEmail(email: string, token: string) {
    try {
      await this.emailConfig(
        'support',
        'Eliminar cuenta permanentemente - Vértice',
        email,
        sendDeleteAccountTemplate({ email, token }),
      );
    } catch (error: any) {
      this.logger.error(`Email sending failed: ${error.message}`);
      throw new InternalServerErrorException('Email sending failed');
    }
  }

  async sendDeleteAccountOtpEmail(email: string, token: string) {
    try {
      await this.emailConfig(
        'support',
        'Código de verificación - Eliminar cuenta - Vértice',
        email,
        sendDeleteAccountOtpTemplate({ email, token }),
      );
    } catch (error: any) {
      this.logger.error(`Email sending failed: ${error.message}`);
      throw new InternalServerErrorException('Email sending failed');
    }
  }

  async sendSupportEmailToCorporate(supportDto: { name: string; email: string; subject: string; message: string; }) {
    try {
      const htmlContent = sendSupportTemplate(supportDto);
      await this.emailConfig(
        'support',
        `Nuevo ticket de soporte: ${supportDto.subject}`,
        'soporte@verticeapp.io', // Cambia a tu correo corporativo final si es diferente
        htmlContent,
        supportDto.email,
      );
    } catch (error: any) {
      this.logger.error(`Email sending failed: ${error.message}`);
      throw new InternalServerErrorException('Email sending failed');
    }
  }

  private async emailConfig(
    type: string,
    subject: string,
    to: string,
    html: string,
    replyTo?: string,
  ) {
    const payload: any = {
      from: `${type}@verticeapp.io`,
      to: [to],
      subject: subject,
      html: html,
    };

    if (replyTo) {
      payload.reply_to = replyTo;
    }

    const { data, error } = await this.resend.emails.send(payload);

    if (error) {
      this.logger.error(`Resend error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Failed to send email');
    }

    return data;
  }
}

