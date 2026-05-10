import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { EncryptService } from 'src/auth/services/encrypt/encrypt.service';
import { UserService } from 'src/user/services/user/user.service';
import { ChatGateway } from 'src/chat/chat/chat.gateway';
import { PrismaClient } from 'generated/prisma/internal/class';
import { DefaultArgs } from '@prisma/client/runtime/client';
import { ValidRoles } from 'src/auth/decorators/role-protected/role-protected.decorator';
import { AssessorStatus, TicketStatus } from './enums/ticket-status.enum';

@Injectable()
export class TicketService {
  constructor(
    private prisma: PrismaClientService,
    private encryptService: EncryptService,
    private userService: UserService,
    private readonly chatGateway: ChatGateway,
  ) { }

  private readonly CALCULATION_MAP: Record<string, '*_RATE' | '/_RATE'> = {
    'ARS → BS': '*_RATE',
    'USDT → BS': '*_RATE',
    'USDT → ARS': '*_RATE',
    'USDT → COP': '*_RATE',
    'USDT → PEN': '*_RATE',
    'USDT → CLP': '*_RATE',
    'USDT → EUR': '*_RATE',

    'CLP → BS': '*_RATE',
    'USD → ARS': '*_RATE',
    'USD → COP': '*_RATE',
    'USD → CLP': '*_RATE',
    'USD → BS': '*_RATE',
    'USD → EUR': '*_RATE',
    'USD → PEN': '*_RATE',
    'USD → USDT': '*_RATE',
    'EUR → USD': '*_RATE',
    'EUR → COP': '*_RATE',
    'EUR → ARS': '*_RATE',
    'EUR → CLP': '*_RATE',
    'EUR → BS': '*_RATE',
    'EUR → PEN': '*_RATE',
    'EUR → USDT': '*_RATE',
    'BS → COP': '*_RATE',
    'PEN → ARS': '*_RATE',
    'PEN → COP': '*_RATE',
    'PEN → BS': '*_RATE',
    'PEN → CLP': '*_RATE',
    'PEN → USDT': '/_RATE',

    'ARS → COP': '/_RATE',
    'ARS → CLP': '/_RATE',
    'ARS → USD': '/_RATE',
    'ARS → EUR': '/_RATE',
    'ARS → PEN': '/_RATE',
    'ARS → USDT': '/_RATE',
    'CLP → ARS': '/_RATE',
    'CLP → USD': '/_RATE',
    'CLP → EUR': '/_RATE',
    'CLP → COP': '/_RATE',
    'CLP → PEN': '/_RATE',
    'COP → ARS': '/_RATE',
    'COP → EUR': '/_RATE',
    'COP → USD': '/_RATE',
    'COP → USDT': '/_RATE',
    'COP → BS': '/_RATE',
    'COP → CLP': '/_RATE',
    'COP → PEN': '/_RATE',
    'BS → ARS': '/_RATE',
    'BS → CLP': '/_RATE',
    'BS → EUR': '/_RATE',
    'BS → USD': '/_RATE',
    'BS → PEN': '/_RATE',
    'BS → USDT': '/_RATE',
    'PEN → EUR': '/_RATE',
    'PEN → USD': '/_RATE',
    'CLP → USDT': '/_RATE',

    'USDT → USD': '/_RATE',
  };

  private readonly RATE_TYPE_MAP: Record<string, 'buyRate' | 'sellRate'> = {
    'ARS → BS': 'buyRate',
    'ARS → USDT': 'sellRate',

    'CLP → BS': 'buyRate',
    'CLP → USDT': 'sellRate',

    'USD → ARS': 'buyRate',
    'USD → COP': 'buyRate',
    'USD → CLP': 'buyRate',
    'USD → EUR': 'buyRate',
    'USD → PEN': 'buyRate',
    'USD → BS': 'buyRate',
    'USD → USDT': 'buyRate',

    'EUR → USD': 'buyRate',
    'EUR → ARS': 'buyRate',
    'EUR → CLP': 'buyRate',
    'EUR → COP': 'buyRate',
    'EUR → BS': 'buyRate',
    'EUR → PEN': 'buyRate',
    'EUR → USDT': 'buyRate',

    'BS → COP': 'buyRate',
    'BS → USDT': 'sellRate',

    'PEN → ARS': 'buyRate',
    'PEN → COP': 'buyRate',
    'PEN → CLP': 'buyRate',
    'PEN → BS': 'buyRate',
    'PEN → USDT': 'sellRate',

    'USDT → COP': 'buyRate',
    'USDT → EUR': 'buyRate',
    'USDT → ARS': 'buyRate',
    'USDT → PEN': 'buyRate',
    'USDT → BS': 'buyRate',
    'USDT → CLP': 'buyRate',

    'USDT → USD': 'sellRate',

    'ARS → COP': 'sellRate',
    'ARS → CLP': 'sellRate',
    'ARS → USD': 'sellRate',
    'ARS → EUR': 'sellRate',
    'ARS → PEN': 'sellRate',
    'CLP → ARS': 'sellRate',
    'CLP → COP': 'sellRate',
    'CLP → EUR': 'sellRate',
    'CLP → USD': 'sellRate',
    'CLP → PEN': 'sellRate',
    'COP → ARS': 'sellRate',
    'COP → EUR': 'sellRate',
    'COP → CLP': 'sellRate',
    'COP → BS': 'sellRate',
    'COP → USD': 'sellRate',
    'COP → PEN': 'sellRate',
    'COP → USDT': 'sellRate',

    'BS → ARS': 'sellRate',
    'BS → CLP': 'sellRate',
    'BS → USD': 'sellRate',
    'BS → EUR': 'sellRate',
    'BS → PEN': 'sellRate',
    'PEN → USD': 'sellRate',
    'PEN → EUR': 'sellRate',
  };

  async create(createTicketDto: CreateTicketDto, userId: string) {
    const { quote, account, paymentDetails, ticketNumber } = createTicketDto;

    const MAX_PENDING_TICKETS = 10;

    const pendingCount = await this.prisma.ticket.count({
      where: {
        userId: userId,
        status: TicketStatus.PENDING,
      },
    });

    if (pendingCount >= MAX_PENDING_TICKETS) {
      throw new BadRequestException(
        `Has alcanzado el límite de ${MAX_PENDING_TICKETS} tickets pendientes. Por favor, espera a que se procesen los anteriores.`,
      );
    }
    const ticketTypeValue =
      quote.transferType === 'isSelf' ? 'SELF' : 'THIRD_PARTY';

    try {
      return await this.prisma.$transaction(async (tx) => {
        const currencyRate = await tx.currencyRate.findUnique({
          where: { id: quote.rateId },
          include: { paymentMethods: { include: { ourPaymentMethod: true } } },
        });

        if (!currencyRate)
          throw new BadRequestException('Tasa de cambio no válida');

        const { receiveAmount, totalToPay, appliedRate, feePercentage } =
          this.validateAndCalculate(
            quote.sendAmount,
            currencyRate,
            paymentDetails?.financialInstitutionName || '',
          );

        const bestAssessor = await this.findBestAssessor(tx, 'ticket');

        const ourAccount = await tx.ourPaymentMethod.findFirst({
          where: {
            financialInstitutionName: paymentDetails?.financialInstitutionName,
            isActive: true,
          },
        });

        if (!ourAccount) {
          throw new BadRequestException(
            `No aceptamos pagos mediante ${paymentDetails?.financialInstitutionName} actualmente`,
          );
        }

        const paymentMethodUsedId = ourAccount.id;
        let recipientId: string;

        if (quote.transferType === 'isSelf') {
          const bankAccount = await tx.bankAccount.findUnique({
            where: { id: account.accountId },
            include: { user: true },
          });

          if (!bankAccount)
            throw new BadRequestException(
              'La cuenta bancaria propia no existe',
            );

          const selfEmail =
            bankAccount.emailAddress || bankAccount.user.email;
          const selfIdentificationNumber =
            bankAccount.accountHolderId || userId;


          const existingRecipient = await tx.recipient.findFirst({
            where: {
              OR: [
                { identificationNumber: selfIdentificationNumber },
                { email: selfEmail },
              ],
            },
          });

          const selfRecipient = existingRecipient
            ? existingRecipient
            : await tx.recipient.create({
              data: {
                firstName:
                  bankAccount.accountHolderName ||
                  bankAccount.user.name ||
                  'Titular',
                lastName: bankAccount.user.lastName || '',
                identificationType: account.documentType,
                identificationNumber: selfIdentificationNumber,
                phone: bankAccount.phoneNumber || 'N/A',
                email: selfEmail,
              },
            });
          recipientId = selfRecipient.id;
        } else {
          // --- TERCEROS (1:N PaymentDetail) ---
          const existingRecipient = await tx.recipient.findFirst({
            where: { identificationNumber: account.thirdPartyId! },
            include: { paymentDetails: true },
          });

          let thirdPartyRecipientId: string;

          const paymentDetailData = {
            paymentMethod: 'TRANSFER' as any,
            bank: account.institutionName,
            accountNumber:
              account.thirdPartyAccountNumberOrCode ||
              account.thirdPartyPhone,
            accountType: account.typeInstitution,
            aliasOrReference: account.thirdPartyAlias,
          };

          if (existingRecipient) {
            // Check if a compatible PaymentDetail already exists
            const existingPD = existingRecipient.paymentDetails.find(
              (pd) =>
                pd.bank === account.institutionName &&
                pd.accountType === account.typeInstitution,
            );

            if (existingPD) {
              await tx.paymentDetail.update({
                where: { id: existingPD.id },
                data: paymentDetailData,
              });
            } else {
              await tx.paymentDetail.create({
                data: {
                  ...paymentDetailData,
                  recipientId: existingRecipient.id,
                },
              });
            }

            // Update recipient personal data
            await tx.recipient.update({
              where: { id: existingRecipient.id },
              data: {
                firstName: account.thirdPartyName!,
                phone: account.thirdPartyPhone || '',
              },
            });

            thirdPartyRecipientId = existingRecipient.id;
          } else {
            // Create new recipient with PaymentDetail
            const newRecipient = await tx.recipient.create({
              data: {
                firstName: account.thirdPartyName!,
                lastName: '',
                identificationType: account.documentType,
                identificationNumber: account.thirdPartyId!,
                phone: account.thirdPartyPhone || '',
                email:
                  account.thirdPartyEmail ||
                  `${account.thirdPartyId}@noemail.com`,
                paymentDetails: {
                  create: paymentDetailData,
                },
              },
            });
            thirdPartyRecipientId = newRecipient.id;
          }

          recipientId = thirdPartyRecipientId;
        }

        // 5. Crear Ticket Final
        const ticket = await tx.ticket.create({
          data: {
            ticketNumber,
            userId,
            recipientId,
            currencyRateId: currencyRate.id,
            paymentMethodId: paymentMethodUsedId,
            paymentMethodSnapshot: ourAccount as any,
            amountSent: quote.sendAmount,
            appliedRate: appliedRate,
            ticketType: ticketTypeValue,
            assessorId: bestAssessor?.id || null,
            feePaymentPercentage: feePercentage,
            totalDepositRequired: totalToPay,
            totalToReceive: receiveAmount,
            status: bestAssessor
              ? TicketStatus.PROCESSING
              : TicketStatus.PENDING,
            notes:
              quote.transferType === 'isSelf'
                ? `Auto-envío a cuenta ${account.institutionName}`
                : `Envío a tercero: ${account.thirdPartyName}`,
            chat: bestAssessor
              ? {
                create: {},
              }
              : undefined,
          },
        });

        if (bestAssessor) {
          await tx.user.update({
            where: { id: bestAssessor.id },
            data: { lastAssignedAt: new Date() },
          });

          // NOTIFICAR POR SOCKETS
          this.chatGateway.server
            .to(ticketNumber)
            .emit('ticket-status-response', {
              canOpenChat: true,
              status: TicketStatus.PROCESSING,
              assessorId: bestAssessor.id,
              ticketNumber: ticketNumber,
            });
        }

        return {
          ok: true,
          msg: bestAssessor
            ? 'Ticket asignado a un asesor'
            : 'Ticket en espera de asesor',
          ticketId: ticket.id,
        };
      });
    } catch (error: any) {
      console.error('Error en transacción:', error);
      if (error instanceof BadRequestException) throw error;
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Error al procesar el ticket: ${error.message}`,
      );
    }
  }

  async findAll(userId: string, paginationDto: PaginationQueryDto) {
    const { page = 1, limit = 5 } = paginationDto;

    try {
      const skip = (page - 1) * limit;

      const [tickets, totalTickets] = await Promise.all([
        this.prisma.ticket.findMany({
          where: { userId },
          take: limit,
          skip: skip,
          orderBy: { createdAt: 'desc' },
          include: {
            currencyRate: true,
            recipient: true,
          },
        }),
        this.prisma.ticket.count({ where: { userId } }),
      ]);

      const processedData = await this.decryptRecipientData(tickets);

      return {
        ok: true,
        data: processedData,
        meta: {
          totalTickets,
          currentPage: page,
          totalPages: Math.ceil(totalTickets / limit),
          limit,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener los tickets del usuario',
      );
    }
  }

  async getUserSummary(userId: string) {
    try {
      const tickets = await this.prisma.ticket.findMany({
        where: {
          userId,
          status: TicketStatus.SUCCESS,
        },
        include: {
          currencyRate: true,
        },
      });

      let totalAmountUSD = 0;
      const totalTickets = tickets.length;

      // Caché simple para evitar consultas repetidas de tasas en el mismo día/moneda
      const rateCache = new Map<string, number | null>();

      for (const ticket of tickets) {
        const { amountSent, currencyRate, createdAt } = ticket;
        const fromCurrency = currencyRate.fromCurrency;

        if (fromCurrency === 'USD' || fromCurrency === 'USDT') {
          totalAmountUSD += amountSent;
          continue;
        }

        const dateKey = createdAt.toISOString().split('T')[0];
        const cacheKey = `${fromCurrency}_${dateKey}`;
        let usdRate = rateCache.get(cacheKey);

        if (usdRate === undefined) {
          const ratePair = await this.prisma.currencyRate.findUnique({
            where: {
              fromCurrency_toCurrency: {
                fromCurrency,
                toCurrency: 'USD',
              },
            },
          });

          if (ratePair) {
            const history = await this.prisma.currencyRateHistory.findFirst({
              where: {
                currencyRateId: ratePair.id,
                createdAt: { lte: createdAt },
              },
              orderBy: { createdAt: 'desc' },
            });

            usdRate = history ? history.buyRate : ratePair.buyRate;
          } else {
            usdRate = null;
          }
          rateCache.set(cacheKey, usdRate);
        }

        if (usdRate && usdRate > 0) {
          const pairName = `${fromCurrency} → USD`;
          const operation = this.CALCULATION_MAP[pairName] || '/_RATE';

          const ticketUSD =
            operation === '*_RATE' ? amountSent * usdRate : amountSent / usdRate;
          totalAmountUSD += ticketUSD;
        }
      }

      return {
        ok: true,
        summary: {
          totalTickets,
          totalAmountUSD: Number(totalAmountUSD.toFixed(2)),
        },
      };
    } catch (error) {
      console.error('Error en getUserSummary:', error);
      throw new InternalServerErrorException(
        'Error al calcular el resumen de tickets',
      );
    }
  }

  async findOneTicketInfo(ticketNumber: string) {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { ticketNumber },
        include: {
          currencyRate: true,
          recipient: {
            select: {
              firstName: true,
              lastName: true,
              identificationNumber: true,
              phone: true,
              email: true,
              paymentDetails: true,
            },
          },
          assessor: {
            select: {
              image: true,
              name: true,
              lastName: true,
            },
          },
          user: {
            select: {
              name: true,
              lastName: true,
              country: {
                select: {
                  country_name: true,
                },
              },
              verified: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException(
          `Ticket con número ${ticketNumber} no encontrado`,
        );
      }

      const processedData = await this.decryptRecipientData([ticket]);

      return {
        ok: true,
        data: {
          id: processedData[0].id,
          ticketNumber: processedData[0].ticketNumber,
          amountSent: processedData[0].amountSent,
          appliedRate: processedData[0].appliedRate,
          ticketType: processedData[0].ticketType,
          feePaymentPercentage: processedData[0].feePaymentPercentage,
          totalDepositRequired: processedData[0].totalDepositRequired,
          totalToReceive: processedData[0].totalToReceive,
          status: processedData[0].status,
          receiptImage: processedData[0].receiptImage,
          createdAt: processedData[0].createdAt,
          updatedAt: processedData[0].updatedAt,
          currencyRate: processedData[0].currencyRate,
          ourPaymentMethod: processedData[0].ourPaymentMethod,
          recipient: processedData[0].recipient,
          assessor: processedData[0].assessor,
          user: processedData[0].user,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al obtener el ticket');
    }
  }

  async findAllTickets(paginationDto: PaginationQueryDto) {
    const { page = 1, limit = 5 } = paginationDto;

    try {
      const skip = (page - 1) * limit;

      const [tickets, totalTickets] = await Promise.all([
        this.prisma.ticket.findMany({
          take: limit,
          skip: skip,
          orderBy: { createdAt: 'desc' },
          include: {
            currencyRate: true,
            recipient: true,
          },
        }),
        this.prisma.ticket.count(),
      ]);

      const processedData = await this.decryptRecipientData(tickets);

      return {
        ok: true,
        data: processedData,
        meta: {
          totalTickets,
          currentPage: page,
          totalPages: Math.ceil(totalTickets / limit),
          limit,
        },
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error al obtener todos los tickets',
      );
    }
  }

  async findAllTicketsWithoutAssessor(paginationDto: PaginationQueryDto) {
    const { page = 1, limit = 5 } = paginationDto;

    try {
      const skip = (page - 1) * limit;

      const [tickets, totalTickets] = await Promise.all([
        this.prisma.ticket.findMany({
          take: limit,
          skip: skip,
          where: {
            assessorId: null,
          },
          orderBy: { createdAt: 'desc' },
          include: {
            currencyRate: true,
            recipient: true,
          },
        }),
        this.prisma.ticket.count(),
      ]);

      const processedData = await this.decryptRecipientData(tickets);

      return {
        ok: true,
        data: processedData,
        meta: {
          totalTickets,
          currentPage: page,
          totalPages: Math.ceil(totalTickets / limit),
          limit,
        },
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error al obtener todos los tickets',
      );
    }
  }

  async findAllMyTicketsByStatus(
    status: TicketStatus,
    paginationDto: PaginationQueryDto,
    assessorId: string,
  ) {
    const { page = 1, limit = 5 } = paginationDto;
    const skip = (page - 1) * limit;

    try {
      const filter = {
        status: status,
        assessorId: assessorId,
      };

      const [tickets, totalTickets] = await Promise.all([
        this.prisma.ticket.findMany({
          take: limit,
          skip: skip,
          where: filter,
          orderBy: { createdAt: 'desc' },
          include: {
            currencyRate: true,
            recipient: true,
          },
        }),
        this.prisma.ticket.count({
          where: filter,
        }),
      ]);

      const processedData = await this.decryptRecipientData(tickets);

      return {
        ok: true,
        data: processedData,
        meta: {
          totalTickets,
          currentPage: page,
          totalPages: Math.ceil(totalTickets / limit),
          limit,
        },
      };
    } catch (error) {
      console.error('Error en findAllMyTicketsByStatus:', error);
      throw new InternalServerErrorException('Error al obtener tus tickets');
    }
  }

  async takeTicket(ticketNumber: string, userId: string) {
    const MAX_PROCESSING_TICKET = 6;

    const ticket = await this.prisma.ticket.findUnique({
      where: {
        ticketNumber: ticketNumber,
      },
    });

    if (!ticket) {
      throw new NotFoundException(
        `Ticket con el Número ${ticketNumber} no ha sido encontrado`,
      );
    }

    const assessorId = userId;
    const currentProcessingTickets = await this.prisma.ticket.count({
      where: {
        assessorId: assessorId,
        status: TicketStatus.PROCESSING,
      },
    });

    if (currentProcessingTickets >= MAX_PROCESSING_TICKET) {
      throw new BadRequestException(
        `SOLO PUEDES TENER ${MAX_PROCESSING_TICKET} EN PROGRESO`,
      );
    }

    try {
      const updatedTicket = await this.prisma.ticket.update({
        where: {
          ticketNumber: ticket.ticketNumber,
        },
        data: {
          assessorId: userId,
          status: TicketStatus.PROCESSING,
          chat: {
            connectOrCreate: {
              where: { ticketId: ticket.id },
              create: {},
            },
          },
        },
      });

      this.chatGateway.server.to(ticketNumber).emit('ticket-status-response', {
        canOpenChat: true,
        status: updatedTicket.status,
        assessorId: updatedTicket.assessorId,
        ticketNumber: ticketNumber,
      });

      return {
        ok: true,
        msg: 'Actualizado Correctamente',
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al tomar ticket');
    }
  }

  async finalizeTicket(ticketNumber: string, assessorId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        chat: {
          include: {
            messages: {
              where: {
                senderId: assessorId,
                fileUrl: { not: null },
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(
        `Ticket con el Número ${ticketNumber} no ha sido encontrado`,
      );
    }

    if (ticket.assessorId !== assessorId) {
      throw new BadRequestException(
        'No tienes permisos para finalizar este ticket porque no estás asignado a él',
      );
    }

    if (ticket.status !== TicketStatus.PROCESSING) {
      throw new BadRequestException(
        'El ticket solo puede ser finalizado si está en estado PROCESSING',
      );
    }

    let currentReceiptImage = ticket.receiptImage;

    if (!currentReceiptImage && ticket.chat && ticket.chat.messages.length > 0) {
      currentReceiptImage = ticket.chat.messages[0].fileUrl;
    }

    if (!currentReceiptImage) {
      throw new BadRequestException(
        'No puedes finalizar el ticket sin subir la foto del comprobante de pago',
      );
    }

    try {
      const updatedTicket = await this.prisma.ticket.update({
        where: { ticketNumber },
        data: {
          status: TicketStatus.SUCCESS,
          ...(ticket.receiptImage !== currentReceiptImage && {
            receiptImage: currentReceiptImage,
          }),
        },
      });

      this.chatGateway.server.to(ticketNumber).emit('ticket-finalized', {
        ticketNumber: updatedTicket.ticketNumber,
        status: updatedTicket.status,
      });

      return {
        ok: true,
        msg: 'Ticket finalizado con éxito',
        ticket: updatedTicket,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al finalizar ticket');
    }
  }

  private async findBestAssessor(
    tx: Omit<
      PrismaClient<never, undefined, DefaultArgs>,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
    >,
    teamName: string,
  ) {
    return await tx.user.findFirst({
      where: {
        role: { name: ValidRoles.assessor },
        status: AssessorStatus.AVAILABLE,
        online: true,
        team: {
          name: teamName
        }
      },
      include: {
        _count: {
          select: {
            assignedTickets: {
              where: { status: TicketStatus.PROCESSING },
            },
          },
        },
      },
      orderBy: [
        // Prioridad 1: El que tenga menos tickets en curso
        { assignedTickets: { _count: 'asc' } },
        // Prioridad 2: El que lleve más tiempo sin recibir uno
        { lastAssignedAt: 'asc' },
      ],
    });
  }

  private validateAndCalculate(
    sendAmount: number,
    rateEntry: any,
    methodName: string,
  ) {
    const pair = `${rateEntry.fromCurrency} → ${rateEntry.toCurrency}`;

    const rateType = this.RATE_TYPE_MAP[pair] || 'buyRate';
    const appliedRate = rateEntry[rateType];

    const operation = this.CALCULATION_MAP[pair];
    if (!operation)
      throw new BadRequestException(
        `No hay regla de cálculo para el par ${pair}`,
      );

    // Calcular monto a recibir
    const receiveAmount =
      operation === '*_RATE'
        ? sendAmount * appliedRate
        : sendAmount / appliedRate;

    // Calcular Fee del método de pago
    const methodConfig = rateEntry.paymentMethods.find(
      (m: any) => m.ourPaymentMethod.financialInstitutionName === methodName,
    );
    const feePercentage = methodConfig?.senderFeePercentage ?? 0;
    const totalToPay = sendAmount * (1 + feePercentage / 100);

    return {
      receiveAmount,
      totalToPay,
      appliedRate,
      feePercentage,
    };
  }

  private async decryptRecipientData(tickets: any[]) {
    const recipientFieldsToDecrypt = ['phone', 'identificationNumber'];

    return Promise.all(
      tickets.map(async (ticket) => {
        if (ticket.ticketType !== 'SELF' || !ticket.recipient) {
          return ticket;
        }

        const decryptedRecipient = { ...ticket.recipient };

        for (const field of recipientFieldsToDecrypt) {
          const encryptedValue = ticket.recipient[field];

          if (encryptedValue && encryptedValue.includes(':')) {
            try {
              decryptedRecipient[field] =
                await this.encryptService.decrypt(encryptedValue);
            } catch (error: any) {
              console.error(
                `Error al desencriptar campo ${field} en ticket ${ticket.id}:`,
                error.message,
              );
            }
          }
        }

        const mappedPaymentMethod = ticket.paymentMethodSnapshot || ticket.ourPaymentMethod;

        return { 
          ...ticket, 
          recipient: decryptedRecipient,
          ourPaymentMethod: mappedPaymentMethod,
          paymentMethodSnapshot: undefined
        };
      }),
    );
  }
}
