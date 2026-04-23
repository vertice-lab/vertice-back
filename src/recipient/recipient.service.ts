import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateRecipientDto } from './dto/create-recipient.dto';
import { UpdateRecipientDto } from './dto/update-recipient.dto';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { EncryptService } from 'src/auth/services/encrypt/encrypt.service';

@Injectable()
export class RecipientService {
  constructor(
    private prisma: PrismaClientService,
    private encryptService: EncryptService
  ) {}

  private async decryptRecipient(recipient: any) {
    if (!recipient) return recipient;
    const fieldsToDecrypt = ['identificationNumber', 'phone', 'email'] as const;
    for (const field of fieldsToDecrypt) {
      const encryptedValue = recipient[field];
      if (encryptedValue && encryptedValue.includes(':')) {
        try {
          recipient[field] = await this.encryptService.decrypt(encryptedValue);
        } catch (error) {
          console.error(`Error decrypting field ${field}`, error);
        }
      }
    }
    return recipient;
  }

  async create(createRecipientDto: CreateRecipientDto) {
    try {
      const { paymentDetails, ...recipientData } = createRecipientDto;

      const recipient = await this.prisma.recipient.create({
        data: {
          ...(recipientData as any),
          lastName: recipientData.lastName || '',
          email: recipientData.email || `${recipientData.identificationNumber}@noemail.com`,
          ...(paymentDetails && paymentDetails.length > 0 && {
            paymentDetails: {
              create: paymentDetails as any,
            },
          }),
        },
        include: { paymentDetails: true },
      });

      return {
        ok: true,
        data: await this.decryptRecipient(recipient),
        msg: 'Destinatario creado exitosamente',
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Ya existe un destinatario con este documento o correo');
      }
      throw new InternalServerErrorException('Error al crear el destinatario');
    }
  }

  async findAll(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const [totalRecipients, recipients] = await Promise.all([
        this.prisma.recipient.count(),
        this.prisma.recipient.findMany({
          skip,
          take: limit,
          include: { paymentDetails: true },
          orderBy: { createdAt: 'desc' },
        })
      ]);

      const decryptedRecipients = await Promise.all(
        recipients.map((r) => this.decryptRecipient(r))
      );

      return {
        ok: true,
        data: decryptedRecipients,
        meta: {
          totalRecipients,
          currentPage: page,
          totalPages: Math.ceil(totalRecipients / limit),
          limit,
        }
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los destinatarios');
    }
  }

  async findOne(id: string) {
    try {
      const recipient = await this.prisma.recipient.findUnique({
        where: { id },
        include: { paymentDetails: true },
      });

      if (!recipient) {
        throw new NotFoundException(`Destinatario no encontrado`);
      }

      return {
        ok: true,
        data: await this.decryptRecipient(recipient),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al obtener el destinatario');
    }
  }

  async update(id: string, updateRecipientDto: UpdateRecipientDto) {
    try {
      const { paymentDetails, ...recipientData } = updateRecipientDto;

      // Update recipient personal data
      await this.prisma.recipient.update({
        where: { id },
        data: recipientData as any,
      });

      // Handle payment details: upsert by id or create new
      if (paymentDetails && paymentDetails.length > 0) {
        for (const pd of paymentDetails) {
          const pdAny = pd as any;
          if (pdAny.id) {
            // Update existing payment detail
            await this.prisma.paymentDetail.update({
              where: { id: pdAny.id },
              data: pd as any,
            });
          } else {
            // Create new payment detail
            await this.prisma.paymentDetail.create({
              data: {
                ...(pd as any),
                recipientId: id,
              },
            });
          }
        }
      }

      const updatedRecipient = await this.prisma.recipient.findUnique({
        where: { id },
        include: { paymentDetails: true },
      });

      return {
        ok: true,
        data: await this.decryptRecipient(updatedRecipient),
        msg: 'Destinatario actualizado exitosamente',
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Destinatario no encontrado');
      }
      throw new InternalServerErrorException('Error al actualizar el destinatario');
    }
  }

  async findPaymentDetailsByRecipient(recipientId: string, toCurrency?: string) {
    const recipient = await this.prisma.recipient.findUnique({
      where: { id: recipientId },
      include: { paymentDetails: true },
    });

    if (!recipient) {
      throw new NotFoundException('Destinatario no encontrado');
    }

    let details = recipient.paymentDetails;

    // Filter by country based on currency if provided
    if (toCurrency) {
      const countryForCurrency = this.getCountryByCurrency(toCurrency);
      if (countryForCurrency) {
        details = details.filter((pd: any) => pd.country === countryForCurrency);
      }
    }

    return { ok: true, data: details };
  }

  private getCountryByCurrency(currency: string): string | null {
    const map: Record<string, string> = {
      'BS': 'Venezuela',
      'COP': 'Colombia',
      'ARS': 'Argentina',
      'CLP': 'Chile',
      'PEN': 'Perú',
      'USD': 'Estados Unidos',
      'EUR': 'Unión Europea',
      'USDT': 'Cripto',
    };
    return map[currency] || null;
  }

  async remove(id: string) {
    try {
      // Delete all payment details for this recipient
      await this.prisma.paymentDetail.deleteMany({ where: { recipientId: id } });

      await this.prisma.recipient.delete({
        where: { id },
      });

      return {
        ok: true,
        msg: 'Destinatario eliminado exitosamente',
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Destinatario no encontrado');
      }
      throw new InternalServerErrorException('Error al eliminar el destinatario');
    }
  }
}
