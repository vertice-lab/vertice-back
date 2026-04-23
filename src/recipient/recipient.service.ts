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
          ...(paymentDetails && {
            paymentDetail: {
              create: paymentDetails as any,
            },
          }),
        },
        include: { paymentDetail: true },
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
          include: { paymentDetail: true },
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
        include: { paymentDetail: true },
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

      const recipient = await this.prisma.recipient.update({
        where: { id },
        data: {
          ...(recipientData as any),
          ...(paymentDetails && {
            paymentDetail: {
              upsert: {
                create: paymentDetails as any,
                update: paymentDetails as any,
              },
            },
          }),
        },
        include: { paymentDetail: true },
      });

      return {
        ok: true,
        data: await this.decryptRecipient(recipient),
        msg: 'Destinatario actualizado exitosamente',
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Destinatario no encontrado');
      }
      throw new InternalServerErrorException('Error al actualizar el destinatario');
    }
  }

  async remove(id: string) {
    try {
      // paymentDetail is deleted via cascading or we need to delete it manually first?
      // Let's delete paymentDetail first just in case there's no Cascade delete setup in schema
      const paymentDetail = await this.prisma.paymentDetail.findUnique({ where: { recipientId: id } });
      if (paymentDetail) {
        await this.prisma.paymentDetail.delete({ where: { recipientId: id } });
      }

      const recipient = await this.prisma.recipient.delete({
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
