import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaClientService) {}

  async create(createReviewDto: CreateReviewDto, clientId: string) {
    const { ticketId, stars, comment } = createReviewDto;

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    if (ticket.userId !== clientId) {
      throw new BadRequestException(
        'No puedes calificar un ticket que no es tuyo',
      );
    }

    if (!ticket.assessorId) {
      throw new BadRequestException(
        'El ticket no tiene un asesor asignado para calificar',
      );
    }

    const existingReview = await this.prisma.review.findUnique({
      where: { ticketId },
    });

    if (existingReview) {
      throw new BadRequestException('Este ticket ya ha sido calificado');
    }

    const review = await this.prisma.review.create({
      data: {
        stars,
        comment,
        ticketId,
        assessorId: ticket.assessorId,
      },
    });

    return {
      ok: true,
      msg: 'Calificación guardada exitosamente',
      review,
    };
  }
}
