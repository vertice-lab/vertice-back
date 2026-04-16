import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { TicketStatus } from 'src/ticket/enums/ticket-status.enum';
import { OurPaymentMethod } from 'generated/prisma/client';

interface BankDetailRule {
  match: (country: string, institution: string) => boolean;
  format: (bank: OurPaymentMethod) => string;
}

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaClientService) {}

  async getTicketChatStatus(ticketNumber: string, userId: string) {
    const [ticket, user] = await Promise.all([
      this.prisma.ticket.findUnique({
        where: { ticketNumber },
        select: { status: true, assessorId: true, userId: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: { select: { name: true } } },
      }),
    ]);

    if (!ticket)
      return {
        canOpenChat: false,
        status: TicketStatus.PENDING,
        assessorId: null,
      };

    if (user) {
      const isAdminOrManager = user.role.name === 'admin' || user.role.name === 'manager';
      if (!isAdminOrManager && ticket.userId !== userId && ticket.assessorId !== userId) {
        throw new UnauthorizedException('Status denegado: no autorizado');
      }
    }

    const canOpenChat =
      ticket.status === TicketStatus.PROCESSING && ticket.assessorId !== null;

    return {
      canOpenChat,
      status: ticket.status,
      assessorId: ticket.assessorId,
    };
  }

  async saveMessage(
    ticketNumber: string,
    senderId: string,
    content?: string,
    fileUrl?: string,
    fileType?: string,
  ) {
    const [ticket, sender] = await Promise.all([
      this.prisma.ticket.findUnique({
        where: { ticketNumber },
        include: { chat: true },
      }),
      this.prisma.user.findUnique({
        where: { id: senderId },
        select: { role: { select: { name: true } } },
      }),
    ]);

    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    if (!ticket.chat)
      throw new NotFoundException('Chat no iniciado para este ticket');
    if (!sender) throw new UnauthorizedException('Usuario no válido');

    const isAdminOrManager = sender.role.name === 'admin' || sender.role.name === 'manager';
    if (!isAdminOrManager && ticket.userId !== senderId && ticket.assessorId !== senderId) {
      throw new UnauthorizedException('No tienes permiso para interactuar con este ticket');
    }

    return await this.prisma.message.create({
      data: {
        content,
        fileUrl,
        fileType,
        senderId,
        chatId: ticket.chat.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            lastName: true,
            role: { select: { name: true } },
          },
        },
      },
    });
  }

  async getMessages(ticketNumber: string, userId: string) {
    const [ticket, user] = await Promise.all([
      this.prisma.ticket.findUnique({
        where: { ticketNumber },
        include: { chat: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: { select: { name: true } } },
      }),
    ]);

    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    if (!user) throw new UnauthorizedException('Usuario no válido');
    
    const isAdminOrManager = user.role.name === 'admin' || user.role.name === 'manager';
    if (!isAdminOrManager && ticket.userId !== userId && ticket.assessorId !== userId) {
      throw new UnauthorizedException('No tienes permiso para leer este ticket');
    }

    if (!ticket.chat) return [];

    return await this.prisma.message.findMany({
      where: { chatId: ticket.chat.id },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            lastName: true,
            role: { select: { name: true } },
          },
        },
      },
    });
  }

  private readonly bankDetailRules: BankDetailRule[] = [
    {
      match: (country, inst) =>
        country === 'ARGENTINA' || inst.includes('NARANJA X'),
      format: (bank) => `🏦 **Banco:** ${bank.financialInstitutionName}
            🔢 **CBU:** ${bank.accountNumberOrCode || 'N/A'}
            🏷️ **Alias:** ${bank.aliasOrReference || 'N/A'}
            📄 **Tipo de Cuenta:** ${bank.bankAccountType || 'N/A'}
            👤 **Nombre del Titular:** ${bank.accountHolderName || 'N/A'}
            🆔 **CUIL:** ${bank.accountHolderId || 'N/A'}`,
    },
    {
      match: (country, inst) => country === 'SPAIN' || inst.includes('NICKEL'),
      format: (bank) => `
            🔢 **Número de Cuenta:** ${bank.accountNumberOrCode || 'N/A'}
            👤 **Nombre del Titular:** ${bank.accountHolderName || 'N/A'}`,
    },
    {
      match: (_, inst) =>
        inst.includes('PAGO MÓVIL') || inst.includes('PAGO MOVIL'),
      format: (bank) => `
            🏦 **Banco:** ${bank.financialInstitutionName}
            🆔 **ID/Cédula:** ${bank.accountHolderId || 'N/A'}
            📱 **Número de Teléfono:** ${bank.phoneNumber || 'N/A'}`,
    },
    {
      match: (country, inst) =>
        country === 'COLOMBIA' && inst.includes('BANCOLOMBIA'),
      format: (bank) => `
                👤 **Nombre del Titular:** ${bank.accountHolderName || 'N/A'}
                📄 **Tipo de Cuenta:** ${bank.bankAccountType || 'N/A'}
                🔢 **Número de Cuenta:** ${bank.accountNumberOrCode || 'N/A'}
                🆔 **Pasaporte/Documento:** ${bank.accountHolderId || 'N/A'}`,
    },
    {
      match: (country, inst) =>
        country === 'COLOMBIA' && inst.includes('NEQUI'),
      format: (bank) => `
                📱 **Número de Teléfono:** ${bank.phoneNumber || 'N/A'}
                👤 **Nombre del Titular:** ${bank.accountHolderName || 'N/A'}`,
    },
    {
      match: (country, _) => country === 'COLOMBIA',
      format: (bank) => `
                🏦 **Banco:** ${bank.financialInstitutionName}
                👤 **Nombre del Titular:** ${bank.accountHolderName || 'N/A'}
                🔢 **Número de Cuenta:** ${bank.accountNumberOrCode || 'N/A'}`,
    },
    {
      match: (_, inst) => inst.includes('BINANCE'),
      format: (bank) => `
            📧 **Email:** ${bank.emailAddress || 'N/A'}
            🏷️ **Alias:** ${bank.aliasOrReference || 'N/A'}`,
    },
    {
      match: (_, inst) => inst.includes('ZELLE') || inst.includes('WISE'),
      format: (bank) => `
            📧 **Email:** ${bank.emailAddress || 'N/A'}
            👤 **Nombre del Titular:** ${bank.accountHolderName || 'N/A'}
            📱 **Número de Teléfono:** ${bank.phoneNumber || 'N/A'}`,
    },
  ];

  private formatDefaultDetails(bank: OurPaymentMethod): string {
    return `
            🏦 **Banco:** ${bank.financialInstitutionName}
            👤 **Nombre del Titular:** ${bank.accountHolderName || 'N/A'}
            🆔 **ID/Cédula:** ${bank.accountHolderId || 'N/A'}
            🔢 **Número de Cuenta/Teléfono:** ${bank.accountNumberOrCode || bank.phoneNumber || 'N/A'}
            📧 **Email:** ${bank.emailAddress || 'N/A'}`;
  }

  async sendWelcomeMessage(ticketNumber: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        chat: {
          include: {
            messages: { take: 1 },
          },
        },
        user: {
          select: { name: true, lastName: true },
        },
        ourPaymentMethod: true,
        assessor: true,
      },
    });

    if (
      !ticket ||
      !ticket.chat ||
      !ticket.assessorId ||
      !ticket.ourPaymentMethod
    )
      return null;

    if (ticket.chat.messages.length > 0) return null;

    const clientName = ticket.user.name || 'Client';
    const bank = ticket.ourPaymentMethod;
    const country = bank.country?.toUpperCase() || '';
    const institution = bank.financialInstitutionName.toUpperCase();

    const matchingRule = this.bankDetailRules.find((rule) =>
      rule.match(country, institution),
    );
    const details = matchingRule
      ? matchingRule.format(bank)
      : this.formatDefaultDetails(bank);

    const welcomeText = `Hola ${clientName}, bienvenido al chat de soporte para tu ticket ${ticketNumber}. Mi nombre es ${ticket.assessor?.name || 'Asesor'} y estaré asistiendo con tu consulta:
        ${details}
        Una vez enviando la imagen del comprobante de pago, por favor espera a que el asesor revise la información y se comunique contigo a través de este chat. ¡Gracias por tu paciencia!`;

    return await this.saveMessage(ticketNumber, ticket.assessorId, welcomeText);
  }

  async autoFinalizeTicket(ticketNumber: string) {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { ticketNumber },
        include: { chat: { include: { messages: { orderBy: { createdAt: 'desc' } } } } },
      });

      if (!ticket || ticket.status !== TicketStatus.PROCESSING) return null;

      let currentReceiptImage = ticket.receiptImage;
      if (!currentReceiptImage && ticket.chat && ticket.chat.messages.length > 0) {
        const lastImageMsg = ticket.chat.messages.find(m => m.fileUrl && m.senderId === ticket.assessorId);
        if (lastImageMsg) {
          currentReceiptImage = lastImageMsg.fileUrl;
        }
      }

      if (!currentReceiptImage) {
        // Can't auto finalize properly if missing proof.
        return null;
      }

      const updatedTicket = await this.prisma.ticket.update({
        where: { ticketNumber },
        data: {
          status: TicketStatus.SUCCESS,
          ...(ticket.receiptImage !== currentReceiptImage && {
            receiptImage: currentReceiptImage,
          }),
        },
      });

      return updatedTicket;
    } catch (e) {
      console.error('Error auto-finalizing ticket:', e);
      return null;
    }
  }
}
