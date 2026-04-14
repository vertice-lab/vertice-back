import {
  Injectable,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateCurrencyRateHistoryDto } from 'src/admin/dto/rate-history/currency-rate-history.dto';
import { OperationMethod } from 'generated/prisma/client';
import { Roles } from 'src/auth/interfaces/enums/roles';
import { UserAuth } from 'src/auth/interfaces/user/user-auth';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';
import { UserService } from 'src/user/services/user/user.service';
import { buildPaginationMeta } from 'src/common/helpers/pagination.helper';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { CurrencyRateHistoryDto } from 'src/admin/dto/rate-history/currency-rate-history.dto';

@Injectable()
export class CurrencyRateHistoryService {
  private readonly logger = new Logger(CurrencyRateHistoryService.name);

  constructor(
    private prisma: PrismaClientService,
    private userService: UserService,
  ) {}

  async findAll(
    rateId: string,
    page: number = 1,
    limit: number = 5,
    startDate?: string,
    endDate?: string,
    userAuthAdmin?: UserAuth,
  ): Promise<{ ok: true } & PaginatedResponse<CurrencyRateHistoryDto>> {
    try {
      if (userAuthAdmin) {
        const { sub, iat, exp } = userAuthAdmin as {
          sub: string;
          iat: number;
          exp: number;
        };

        const userAdmin = await this.userService.getUserById(sub, iat, exp);

        if (userAdmin.user.role.name !== Roles.admin) {
          throw new UnauthorizedException(
            'Unauthorized Access - You need authorization',
          );
        }
      }

      const where: any = { currencyRateId: rateId };

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          const [sy, sm, sd] = startDate.split('-').map(Number);
          const start = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0, 0));
          where.createdAt.gte = start;
        }
        if (endDate) {
          const [ey, em, ed] = endDate.split('-').map(Number);
          const end = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999));
          where.createdAt.lte = end;
        }
      }

      const skip = (page - 1) * limit;

      const [histories, total] = await Promise.all([
        this.prisma.currencyRateHistory.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            userModifier: {
              select: {
                id: true,
                name: true,
                lastName: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.currencyRateHistory.count({ where }),
      ]);

      const data = histories as unknown as CurrencyRateHistoryDto[];

      const response: { ok: true } & PaginatedResponse<CurrencyRateHistoryDto> =
        {
          ok: true,
          data,
          pagination: buildPaginationMeta(total, page - 1, limit),
        };

      return response;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error('Error fetching currency rate history', error);
      throw new InternalServerErrorException('Error fetching history');
    }
  }

  async create(
    createDto: CreateCurrencyRateHistoryDto,
    userAuthAdmin?: UserAuth,
  ) {
    try {
      let adminId: string | undefined;

      if (userAuthAdmin) {
        const { sub, iat, exp } = userAuthAdmin as {
          sub: string;
          iat: number;
          exp: number;
        };

        const userAdmin = await this.userService.getUserById(sub, iat, exp);

        if (userAdmin.user.role.name !== Roles.admin) {
          throw new UnauthorizedException(
            'Unauthorized Access - You need authorization',
          );
        }

        adminId = sub;
      }

      const userIdToStore = adminId ?? createDto.userId;

      if (!userIdToStore) {
        this.logger.error(
          'Attempt to create currency rate history without userId',
        );
        throw new InternalServerErrorException(
          'Missing userId to create history',
        );
      }

      // Mapear
      const dataToCreate = {
        operation: createDto.operation,
        method: createDto.method as any,
        firstCreatedAt: new Date(createDto.firstCreatedAt),
        buyRate: createDto.buyRate,
        isActive: createDto.isActive,
        name: createDto.name,
        sellRate: createDto.sellRate,
        newUpdatedAt: new Date(createDto.newUpdatedAt),
        fromCurrency: createDto.fromCurrency,
        toCurrency: createDto.toCurrency,
        marketRate: createDto.marketRate ?? undefined,
        dolarBcvRate: createDto.dolarBcvRate ?? undefined,
        eurBcvRate: createDto.eurBcvRate ?? undefined,
        userId: userIdToStore,
        currencyRateId: createDto.currencyRateId,
      };

      await this.prisma.currencyRateHistory.create({
        data: dataToCreate,
      });

      return {
        ok: true,
        msg: 'Historial creado correctamente',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error('Error creating currency rate history', error);
      throw new InternalServerErrorException('Error creating history');
    }
  }

  // Helper llamado desde CurrencyRateService para crear una entrada de historial
  async createFromCurrencyRate(
    operation: string,
    method: OperationMethod | 'CREATE' | 'UPDATE',
    currencyRateId: string,
    payload: Partial<CreateCurrencyRateHistoryDto>,
    userAuthAdmin?: UserAuth,
  ) {
    if (!operation?.trim()) {
      throw new InternalServerErrorException(
        'Operation description is required for history',
      );
    }
    if (!currencyRateId) {
      throw new InternalServerErrorException(
        'Currency rate ID is required for history',
      );
    }

    // Normalizar fechas a ISO strings
    const toIsoString = (value?: string | Date): string => {
      if (!value) return new Date().toISOString();
      try {
        const date = value instanceof Date ? value : new Date(value);
        if (isNaN(date.getTime())) return new Date().toISOString();
        return date.toISOString();
      } catch {
        return new Date().toISOString();
      }
    };

    // Construir dto para mantener valores normalizados y seguros
    const dto: CreateCurrencyRateHistoryDto = {
      operation: operation.trim(),
      firstCreatedAt: toIsoString(payload.firstCreatedAt),
      buyRate: payload.buyRate ?? 0,
      isActive: payload.isActive ?? true,
      name: payload.name ?? '',
      sellRate: payload.sellRate ?? 0,
      newUpdatedAt: toIsoString(payload.newUpdatedAt),
      fromCurrency: String(payload.fromCurrency ?? '').toUpperCase(),
      toCurrency: String(payload.toCurrency ?? '').toUpperCase(),
      marketRate: payload.marketRate,
      dolarBcvRate: payload.dolarBcvRate,
      eurBcvRate: payload.eurBcvRate,
      userId: payload.userId,
      currencyRateId,
      method: method as 'CREATE' | 'UPDATE',
    };

    return this.create(dto, userAuthAdmin);
  }
}
