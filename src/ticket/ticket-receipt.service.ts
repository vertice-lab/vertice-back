import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { CreateTicketReceiptNotificationDto } from './dto/create-ticket-receipt-notification.dto';
import { UpdateTicketReceiptNotificationStatusDto } from './dto/update-ticket-receipt-notification-status.dto';
import { TicketReceiptStatus } from 'generated/prisma/client';
import { ChatGateway } from 'src/chat/chat/chat.gateway';

@Injectable()
export class TicketReceiptService {
  constructor(
    private readonly prisma: PrismaClientService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async createForAssessor(
    dto: CreateTicketReceiptNotificationDto,
    assessorId: string,
  ) {
    const { ticketNumber, selectedImageUrl } = dto;

    const ticket = await this.prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        chat: {
          include: {
            messages: {
              select: { fileUrl: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    if (ticket.assessorId !== assessorId) {
      throw new ForbiddenException(
        'No puedes crear notificaciones para este ticket',
      );
    }

    const candidateUrls = new Set<string>();
    if (ticket.receiptImage) {
      candidateUrls.add(ticket.receiptImage);
    }
    if (ticket.chat?.messages) {
      for (const msg of ticket.chat.messages) {
        if (msg.fileUrl) {
          candidateUrls.add(msg.fileUrl);
        }
      }
    }

    if (!candidateUrls.has(selectedImageUrl)) {
      throw new ForbiddenException(
        'La imagen seleccionada no pertenece a este ticket',
      );
    }

    const assessorUser = await this.prisma.user.findUnique({
      where: { id: assessorId },
      include: { team: true },
    });

    if (!assessorUser || !assessorUser.team || !assessorUser.team.managerId) {
      throw new NotFoundException('No se encontró un manager para el asesor');
    }

    const teamManagerId = assessorUser.team.managerId;

    const notification = await this.prisma.ticketReceiptNotification.create({
      data: {
        ticketId: ticket.id,
        assessorId,
        managerId: teamManagerId,
        selectedImageUrl,
        status: TicketReceiptStatus.PAYMENT_VERIFIED,
      },
    });

    // TODO: aquí podrías llamar a un servicio dedicado para notificar a ICBA
    // this.icbaNotificationService.notifyPaymentReceiptCreated(notification);

    this.chatGateway.notifyTicketReceiptCreated(teamManagerId, {
      id: notification.id,
      ticketNumber,
      assessorId,
      selectedImageUrl,
      status: notification.status,
      createdAt: notification.createdAt,
    });

    return { ok: true, data: notification };
  }

  async listForManager(managerId: string, status?: TicketReceiptStatus) {
    const where: any = { managerId };
    if (status) {
      where.status = status;
    }

    const notifications = await this.prisma.ticketReceiptNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        ticket: {
          select: {
            ticketNumber: true,
            amountSent: true,
            totalDepositRequired: true,
            totalToReceive: true,
            status: true,
            currencyRate: true,
          },
        },
        assessor: {
          select: { id: true, name: true, lastName: true, image: true },
        },
      },
    });

    return { ok: true, data: notifications };
  }

  async listForAssessor(ticketNumber: string, assessorId: string) {
    const notifications = await this.prisma.ticketReceiptNotification.findMany({
      where: {
        ticket: { ticketNumber },
        assessorId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        manager: {
          select: { id: true, name: true, lastName: true, image: true },
        },
      },
    });

    return { ok: true, data: notifications };
  }

  async updateStatus(
    id: string,
    managerId: string,
    dto: UpdateTicketReceiptNotificationStatusDto,
  ) {
    const notification = await this.prisma.ticketReceiptNotification.findUnique(
      {
        where: { id },
      },
    );

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    // We fetch the ticket to get its ticketNumber for the socket event
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: notification.ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket asociado no encontrado');
    }

    if (notification.managerId !== managerId) {
      throw new ForbiddenException('No puedes modificar esta notificación');
    }

    const updated = await this.prisma.ticketReceiptNotification.update({
      where: { id },
      data: {
        status: dto.status,
        managerNote: dto.managerNote,
        managerResponseImageUrl: dto.managerResponseImageUrl,
      },
    });

    this.chatGateway.notifyTicketReceiptUpdated(notification.assessorId, {
      id: updated.id,
      ticketId: updated.ticketId,
      ticketNumber: ticket.ticketNumber,
      status: updated.status,
      managerNote: updated.managerNote,
      managerResponseImageUrl: updated.managerResponseImageUrl,
      updatedAt: updated.updatedAt,
    });

    if (dto.status === TicketReceiptStatus.REJECTED) {
      await this.prisma.ticket.update({
        where: { id: notification.ticketId },
        data: { status: 'CANCELLED' },
      });

      this.chatGateway.notifyTicketRejected(ticket.ticketNumber, {
        ticketNumber: ticket.ticketNumber,
        status: 'CANCELLED',
        message:
          'Tu comprobante de pago ha sido rechazado y el ticket ha sido cancelado.',
      });
    }

    if (dto.status === TicketReceiptStatus.CUSTOMER_PAID) {
      await this.prisma.ticket.update({
        where: { id: notification.ticketId },
        data: {
          ...(dto.managerResponseImageUrl && {
            receiptImage: dto.managerResponseImageUrl,
          }),
          ...(dto.managerNote && { referenceNumber: dto.managerNote }),
        },
      });
    }

    return { ok: true, data: updated };
  }
}
