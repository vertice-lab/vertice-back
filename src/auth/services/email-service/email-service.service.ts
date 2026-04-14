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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      this.logger.error(`Email sending failed: ${error.message}`);
      throw new InternalServerErrorException('Email sending failed');
    }
  }

  private async emailConfig(
    type: string,
    subject: string,
    to: string,
    html: string,
  ) {
    const { data, error } = await this.resend.emails.send({
      from: `${type}@verticexchange.com`,
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      this.logger.error(`Resend error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Failed to send email');
    }

    return data;
  }
}
