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
  constructor(private prisma: PrismaClientService) { }

  async getTicketChatStatus(ticketNumber: string, userId: string) {
    const isSupport = ticketNumber.startsWith('SUP-');

    const [ticket, supportTicket, user] = await Promise.all([
      !isSupport ? this.prisma.ticket.findUnique({
        where: { ticketNumber },
        select: { status: true, assessorId: true, userId: true },
      }) : null,
      isSupport ? this.prisma.supportTicket.findUnique({
        where: { supportNumber: ticketNumber },
        select: { status: true, assignedToId: true, userId: true },
      }) : null,
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: { select: { name: true } } },
      }),
    ]);

    const activeTicket = ticket || supportTicket;
    const activeAssessorId = ticket ? ticket.assessorId : supportTicket?.assignedToId;

    if (!activeTicket)
      return {
        canOpenChat: false,
        status: TicketStatus.PENDING,
        assessorId: null,
      };

    if (user) {
      const isAdminOrManager = user.role.name === 'admin' || user.role.name === 'manager';
      if (!isAdminOrManager && activeTicket.userId !== userId && activeAssessorId !== userId) {
        throw new UnauthorizedException('Status denegado: no autorizado');
      }
    }

    const canOpenChat =
      activeTicket.status === TicketStatus.PROCESSING && activeAssessorId !== null;

    return {
      canOpenChat,
      status: activeTicket.status,
      assessorId: activeAssessorId,
      ticketNumber: ticketNumber,
    };
  }

  async saveMessage(
    ticketNumber: string,
    senderId: string,
    content?: string,
    fileUrl?: string,
    fileType?: string,
  ) {
    const isSupport = ticketNumber.startsWith('SUP-');

    const [ticket, supportTicket, sender] = await Promise.all([
      !isSupport ? this.prisma.ticket.findUnique({
        where: { ticketNumber },
        include: { chat: true },
      }) : null,
      isSupport ? this.prisma.supportTicket.findUnique({
        where: { supportNumber: ticketNumber },
        include: { chat: true },
      }) : null,
      this.prisma.user.findUnique({
        where: { id: senderId },
        select: { role: { select: { name: true } } },
      }),
    ]);

    const activeTicket = ticket || supportTicket;
    const activeAssessorId = ticket ? ticket.assessorId : supportTicket?.assignedToId;

    if (!activeTicket) throw new NotFoundException('Ticket no encontrado');
    if (!activeTicket.chat)
      throw new NotFoundException('Chat no iniciado para este ticket');
    if (!sender) throw new UnauthorizedException('Usuario no válido');

    const isAdminOrManager = sender.role.name === 'admin' || sender.role.name === 'manager';
    if (!isAdminOrManager && activeTicket.userId !== senderId && activeAssessorId !== senderId) {
      throw new UnauthorizedException('No tienes permiso para interactuar con este ticket');
    }

    return await this.prisma.message.create({
      data: {
        content,
        fileUrl,
        fileType,
        senderId,
        chatId: activeTicket.chat.id,
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
    const isSupport = ticketNumber.startsWith('SUP-');

    const [ticket, supportTicket, user] = await Promise.all([
      !isSupport ? this.prisma.ticket.findUnique({
        where: { ticketNumber },
        include: { chat: true },
      }) : null,
      isSupport ? this.prisma.supportTicket.findUnique({
        where: { supportNumber: ticketNumber },
        include: { chat: true },
      }) : null,
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: { select: { name: true } } },
      }),
    ]);

    const activeTicket = ticket || supportTicket;

    if (!activeTicket) throw new NotFoundException('Ticket no encontrado');
    if (!user) throw new UnauthorizedException('Usuario no válido');


    if (!activeTicket.chat) return [];

    return await this.prisma.message.findMany({
      where: { chatId: activeTicket.chat.id },
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
      format: (bank) => `🔢 **Número de Cuenta:** ${bank.accountNumberOrCode || 'N/A'}
👤 **Nombre del Titular:** ${bank.accountHolderName || 'N/A'}`,
    },
    {
      match: (_, inst) =>
        inst.includes('PAGO MÓVIL') || inst.includes('PAGO MOVIL'),
      format: (bank) => `🏦 **Banco:** ${bank.financialInstitutionName}
🆔 **ID/Cédula:** ${bank.accountHolderId || 'N/A'}
📱 **Número de Teléfono:** ${bank.phoneNumber || 'N/A'}`,
    },
    {
      match: (country, inst) =>
        country === 'COLOMBIA' && inst.includes('BANCOLOMBIA'),
      format: (bank) => `👤 **Nombre del Titular:** ${bank.accountHolderName || 'N/A'}
📄 **Tipo de Cuenta:** ${bank.bankAccountType || 'N/A'}
🔢 **Número de Cuenta:** ${bank.accountNumberOrCode || 'N/A'}
🆔 **Pasaporte/Documento:** ${bank.accountHolderId || 'N/A'}`,
    },
    {
      match: (country, inst) =>
        country === 'COLOMBIA' && inst.includes('NEQUI'),
      format: (bank) => `📱 **Número de Teléfono:** ${bank.phoneNumber || 'N/A'}
👤 **Nombre del Titular:** ${bank.accountHolderName || 'N/A'}`,
    },
    {
      match: (country, _) => country === 'COLOMBIA',
      format: (bank) => `🏦 **Banco:** ${bank.financialInstitutionName}
👤 **Nombre del Titular:** ${bank.accountHolderName || 'N/A'}
🔢 **Número de Cuenta:** ${bank.accountNumberOrCode || 'N/A'}`,
    },
    {
      match: (_, inst) => inst.includes('TRC20') || inst.includes('BEP20'),
      format: (bank) => `🏦 **Red:** ${bank.financialInstitutionName}
🔗 **Dirección (Wallet):** ${bank.accountNumberOrCode || bank.aliasOrReference || 'N/A'}`,
    },
    {
      match: (_, inst) => inst === 'BINANCE',
      format: (bank) => `📧 **Email:** ${bank.emailAddress || 'N/A'}
🏷️ **Alias:** ${bank.aliasOrReference || 'N/A'}`,
    },
    {
      match: (_, inst) => inst.includes('ZELLE') || inst.includes('WISE'),
      format: (bank) => `📧 **Email:** ${bank.emailAddress || 'N/A'}
👤 **Nombre del Titular:** ${bank.accountHolderName || 'N/A'}
📱 **Número de Teléfono:** ${bank.phoneNumber || 'N/A'}`,
    },
    {
      match: (_, inst) => inst.includes('PAYPAL'),
      format: () => `Para procesar tu pago a través de PayPal, por favor compártenos los siguientes datos:
👤 **Nombre completo:**
📧 **Correo electrónico vinculado a PayPal:**`,
    },
  ];

  private formatDefaultDetails(bank: OurPaymentMethod): string {
    return `🏦 **Banco:** ${bank.financialInstitutionName}
👤 **Nombre del Titular:** ${bank.accountHolderName || 'N/A'}
🆔 **ID/Cédula:** ${bank.accountHolderId || 'N/A'}
🔢 **Número de Cuenta/Teléfono:** ${bank.accountNumberOrCode || bank.phoneNumber || 'N/A'}
📧 **Email:** ${bank.emailAddress || 'N/A'}`;
  }

  async sendWelcomeMessage(ticketNumber: string) {
    const isSupport = ticketNumber.startsWith('SUP-');

    if (isSupport) {
      const supportTicket = await this.prisma.supportTicket.findUnique({
        where: { supportNumber: ticketNumber },
        include: {
          chat: { include: { messages: { take: 1 } } },
          user: { select: { name: true, lastName: true } },
          assignedTo: true,
        },
      });

      if (!supportTicket || !supportTicket.chat || !supportTicket.assignedToId) return null;
      if (supportTicket.chat.messages.length > 0) return null;

      const clientName = supportTicket.user.name || 'Cliente';
      const welcomeText = `Hola ${clientName}, bienvenido al chat de soporte técnico para tu ticket ${ticketNumber}. Mi nombre es ${supportTicket.assignedTo?.name || 'Asesor'} y estaré asistiendo con tu incidencia. Por favor, descríbenos tu problema con el mayor detalle posible.`;

      return await this.saveMessage(ticketNumber, supportTicket.assignedToId, welcomeText);
    }

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

    const welcomeText = `Hola ${clientName}, bienvenido. Para proceder con su ticket, por favor realice el pago mediante los siguientes pasos, según el método de pago seleccionado:

${details}

⚠️ **Importante:** Solo realizamos transferencias a cuentas cuyo titular sea el mismo usuario registrado en nuestra plataforma.

Una vez enviando la imagen del comprobante de pago, por favor espera a que el asesor revise la información y se comunique contigo a través de este chat. ¡Gracias por tu paciencia!`;

    const fileUrl = institution.includes('BINANCE') && bank.fileUrl ? bank.fileUrl : undefined;
    const fileType = fileUrl ? 'image/png' : undefined;

    return await this.saveMessage(ticketNumber, ticket.assessorId, welcomeText, fileUrl, fileType);
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
