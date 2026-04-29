import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { ValidRoles } from 'src/auth/decorators/role-protected/role-protected.decorator';
import { ChatGateway } from 'src/chat/chat/chat.gateway';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { TicketStatus, AssessorStatus } from 'src/ticket/enums/ticket-status.enum';
import { Priority } from './enums/priority.enum';

@Injectable()
export class SupportTicketService {
  constructor(
    private prisma: PrismaClientService,
    private readonly chatGateway: ChatGateway,
  ) { }

  async create(createSupportTicketDto: CreateSupportTicketDto, userId: string) {
    const { title, description, relatedTicketId, evidenceImage, priority = Priority.MEDIUM } = createSupportTicketDto;

    const supportNumber = `SUP-${Date.now()}-${Math.random() * Date.now()}`.slice(0, 16);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const bestAssessor = await this.findBestAssessor(tx, 'soporte');

        const supportTicket = await tx.supportTicket.create({
          data: {
            supportNumber,
            title,
            description,
            priority,
            evidenceImage,
            userId,
            relatedTicketId,
            assignedToId: bestAssessor?.id || null,
            status: bestAssessor ? TicketStatus.PROCESSING : TicketStatus.PENDING,
            chat: bestAssessor ? { create: {} } : undefined,
          },
        });

        if (bestAssessor) {
          await tx.user.update({
            where: { id: bestAssessor.id },
            data: { lastAssignedAt: new Date() },
          });

          // Notificar vía sockets (usando el supportNumber como sala)
          this.chatGateway.server.to(supportNumber).emit('ticket-status-response', {
            canOpenChat: true,
            status: TicketStatus.PROCESSING,
            assessorId: bestAssessor.id,
            ticketNumber: supportNumber,
          });
        }

        return {
          ok: true,
          msg: bestAssessor ? 'Ticket de soporte asignado' : 'Ticket de soporte en espera',
          supportTicketId: supportTicket.id,
          supportNumber: supportTicket.supportNumber,
        };
      });
    } catch (error: any) {
      console.error('Error creando ticket de soporte:', error);
      throw new InternalServerErrorException(`Error al crear ticket de soporte: ${error.message}`);
    }
  }

  async findAllPending(paginationDto: PaginationQueryDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    try {
      const [tickets, total] = await Promise.all([
        this.prisma.supportTicket.findMany({
          where: { assignedToId: null, status: 'PENDING' },
          take: limit,
          skip: skip,
          orderBy: { createdAt: 'desc' },
          include: { user: true, relatedTicket: true },
        }),
        this.prisma.supportTicket.count({ where: { assignedToId: null, status: 'PENDING' } }),
      ]);

      return {
        ok: true,
        data: tickets,
        meta: {
          total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener tickets pendientes');
    }
  }

  async findAllByAssessor(assessorId: string, status: TicketStatus, paginationDto: PaginationQueryDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    try {
      const [tickets, total] = await Promise.all([
        this.prisma.supportTicket.findMany({
          where: { assignedToId: assessorId, status },
          take: limit,
          skip: skip,
          orderBy: { createdAt: 'desc' },
          include: { user: true, relatedTicket: true },
        }),
        this.prisma.supportTicket.count({ where: { assignedToId: assessorId, status } }),
      ]);

      return {
        ok: true,
        data: tickets,
        meta: {
          total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener tus tickets de soporte');
    }
  }

  async findAll(userId: string, paginationDto: PaginationQueryDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    try {
      const [tickets, total] = await Promise.all([
        this.prisma.supportTicket.findMany({
          where: { userId },
          take: limit,
          skip: skip,
          orderBy: { createdAt: 'desc' },
          include: { assignedTo: true, relatedTicket: true },
        }),
        this.prisma.supportTicket.count({ where: { userId } }),
      ]);

      return {
        ok: true,
        data: tickets,
        meta: {
          total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener tus tickets de soporte');
    }
  }

  async findOne(supportNumber: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { supportNumber },
      include: {
        user: { select: { name: true, lastName: true, email: true, image: true } },
        assignedTo: { select: { name: true, lastName: true, image: true } },
        relatedTicket: true,
      },
    });

    if (!ticket) throw new NotFoundException('Ticket de soporte no encontrado');

    return { ok: true, data: ticket };
  }

  async takeTicket(supportNumber: string, assessorId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { supportNumber },
    });

    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    try {
      const updatedTicket = await this.prisma.supportTicket.update({
        where: { supportNumber },
        data: {
          assignedToId: assessorId,
          status: TicketStatus.PROCESSING,
          chat: {
            connectOrCreate: {
              where: { supportTicketId: ticket.id },
              create: {},
            },
          },
        },
      });

      this.chatGateway.server.to(supportNumber).emit('ticket-status-response', {
        canOpenChat: true,
        status: updatedTicket.status,
        assessorId: updatedTicket.assignedToId,
        ticketNumber: supportNumber,
      });

      return { ok: true, msg: 'Ticket de soporte tomado correctamente' };
    } catch (error) {
      throw new InternalServerErrorException('Error al tomar ticket de soporte');
    }
  }

  async finalizeTicket(supportNumber: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { supportNumber },
    });

    if (!ticket) throw new NotFoundException('Ticket de soporte no encontrado');

    try {
      await this.prisma.supportTicket.update({
        where: { supportNumber },
        data: { status: TicketStatus.SUCCESS },
      });

      // Notificar vía sockets
      this.chatGateway.server.to(supportNumber).emit('ticket-finalized', {
        ticketNumber: supportNumber,
        status: TicketStatus.SUCCESS,
      });

      return { ok: true, msg: 'Ticket de soporte finalizado correctamente' };
    } catch (error) {
      throw new InternalServerErrorException('Error al finalizar el ticket de soporte');
    }
  }

  private async findBestAssessor(tx: any, teamName: string) {
    return await tx.user.findFirst({
      where: {
        role: { name: ValidRoles.assessor },
        status: AssessorStatus.AVAILABLE,
        online: true,
        team: { name: teamName },
      },
      orderBy: { lastAssignedAt: 'asc' },
    });
  }
}
