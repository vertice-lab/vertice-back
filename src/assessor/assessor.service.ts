import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { TicketStatus } from 'src/ticket/enums/ticket-status.enum';

@Injectable()
export class AssessorService {
  constructor(private prisma: PrismaClientService) { }

  getProfileAssessor(userId: string) {
    console.log(userId);
  }

  private getDateFilter(period: string) {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'Hoy':
        start.setHours(0, 0, 0, 0);
        break;
      case 'Semana':
        start.setDate(now.getDate() - 7);
        break;
      case 'Mes':
        start.setMonth(now.getMonth() - 1);
        break;
      default:
        return undefined;
    }

    return { gte: start };
  }

  async getStatistics(userId: string, paginationDto: PaginationQueryDto) {
    const { period = 'Todos' } = paginationDto;
    const dateFilter = this.getDateFilter(period);

    try {
      const whereCondition = {
        assessorId: userId,
        status: TicketStatus.SUCCESS,
        ...(dateFilter && { createdAt: dateFilter }),
      };

      const whereSupport = {
        assignedToId: userId,
        status: TicketStatus.SUCCESS,
        ...(dateFilter && { createdAt: dateFilter }),
      };

      const [totalCompleted, totalSupport, reviews, ticketsForTime] = await Promise.all([
        this.prisma.ticket.count({ where: whereCondition }),
        this.prisma.supportTicket.count({ where: whereSupport }),
        this.prisma.review.aggregate({
          where: { assessorId: userId, ...(dateFilter && { createdAt: dateFilter }) },
          _avg: { stars: true },
        }),
        this.prisma.ticket.findMany({
          where: whereCondition,
          select: { createdAt: true, updatedAt: true },
        }),
      ]);


      let avgResolutionTime = 0;

      if (ticketsForTime.length > 0) {
        const totalMinutes = ticketsForTime.reduce((acc, t) => {
          const diff = t.updatedAt.getTime() - t.createdAt.getTime();
          return acc + diff / 60000;
        }, 0);
        avgResolutionTime = Math.round(totalMinutes / ticketsForTime.length);
      }

      return {
        ok: true,
        data: {
          totalCompleted,
          totalSupportCompleted: totalSupport,
          avgRating: Number(reviews._avg.stars?.toFixed(1) || 0),
          avgResolutionTime: avgResolutionTime > 60
            ? `${Math.floor(avgResolutionTime / 60)}h ${avgResolutionTime % 60}min`
            : `${avgResolutionTime} min`,
        },
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error al obtener las estadísticas');
    }
  }

  async getTicketsByFilter(userId: string, paginationDto: PaginationQueryDto) {
    const { page = 1, limit = 5, period = 'Todos' } = paginationDto;
    const dateFilter = this.getDateFilter(period);
    const skip = (page - 1) * limit;

    try {
      const whereCondition = {
        assessorId: userId,
        status: TicketStatus.SUCCESS,
        ...(dateFilter && { createdAt: dateFilter }),
      };

      const [tickets, totalTickets] = await Promise.all([
        this.prisma.ticket.findMany({
          where: whereCondition,
          take: limit,
          skip: skip,
          orderBy: { updatedAt: 'desc' },
          include: {
            recipient: true,
            currencyRate: true,
          },
        }),
        this.prisma.ticket.count({ where: whereCondition }),
      ]);

      return {
        ok: true,
        data: tickets,
        meta: {
          totalTickets,
          currentPage: page,
          totalPages: Math.ceil(totalTickets / limit),
          limit,
        },
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error al obtener los tickets con filtro');
    }
  }
}
