import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';

@Injectable()
export class OfficesService {
  private logger = new Logger(OfficesService.name);

  constructor(private prisma: PrismaClientService) { }



  async create(createOfficeDto: CreateOfficeDto) {
    try {
      const office = await this.prisma.office.findFirst({
        where: {
          country: createOfficeDto.country,
          city: createOfficeDto.city,
          address: {
            contains: createOfficeDto.address,
          },
        },
      });

      if (office) {
        throw new BadRequestException(
          `La oficina en ${createOfficeDto.address}, ${createOfficeDto.city}, ${createOfficeDto.country} ya existe.`,
        );
      }

      await this.prisma.office.create({
        data: {
          country: createOfficeDto.country,
          city: createOfficeDto.city,
          address: createOfficeDto.address,
          isActive: createOfficeDto.isActive,
          openingTime: createOfficeDto.openingTime,
          closingTime: createOfficeDto.closingTime,
        },
      });

      return {
        ok: true,
        msg: 'Creado Exitosamente!',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  async findAllOffices() {
    try {
      const office = await this.prisma.office.findMany();

      return {
        ok: true,
        data: office,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  async findOne(id: string) {
    try {
      const office = this.prisma.office.findUnique({
        where: {
          id: id,
        },
      });

      if (!office) {
        throw new BadRequestException(`La oficina con el id: ${id} no existe.`);
      }

      return {
        ok: true,
        data: office,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  async findOfficeByPairs(fromCurrency: string, toCurrency: string) {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    const allowedPairs = new Set([
      'USD-USD',
      'USD-ARS',
      'ARS-USD',
      'COP-USD',
      'USD-COP',
    ]);

    const isAllowed = to === 'ARS' || allowedPairs.has(`${from}-${to}`);

    if (!isAllowed) {
      throw new BadRequestException(
        `El par de divisas ${from}-${to} no está permitido.`,
      );
    }

    const countriesMapping: Record<string, string[]> = {
      ARS: ['Argentina'],
      COP: ['Colombia'],
      USD: ['Argentina', 'Colombia'],
    };

    const countries =
      to === 'USD' ? countriesMapping[from] || [] : countriesMapping[to] || [];

    if (countries.length === 0) {
      throw new BadRequestException(
        `No se pudo determinar el país para el par ${from}-${to}`,
      );
    }

    try {
      const rate = await this.prisma.currencyRate.findUnique({
        where: {
          fromCurrency_toCurrency: {
            fromCurrency: from,
            toCurrency: to,
          },
        },
      });

      if (!rate) {
        throw new BadRequestException(
          `No existe un tipo de cambio configurado para el par ${from}-${to}`,
        );
      }

      const offices = await this.prisma.office.findMany({
        where: {
          country: {
            in: countries,
          },
        },
      });

      if (!offices || offices.length === 0) {
        throw new NotFoundException(
          `No se encontró una oficina física en: ${countries.join(', ')}`,
        );
      }

      return {
        ok: true,
        data: offices,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(error);
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  async update(id: string, updateOfficeDto: UpdateOfficeDto) {
    try {
      const office = await this.prisma.office.findUnique({
        where: {
          id: id,
        },
      });

      if (!office) {
        throw new BadRequestException(`Oficina no encontrada`);
      }

      await this.prisma.office.update({
        where: { id: id },
        data: {
          country: updateOfficeDto.country || office.country,
          city: updateOfficeDto.city || office.city,
          address: updateOfficeDto.address || office.address,
          isActive: updateOfficeDto.isActive || office.isActive,
          openingTime: updateOfficeDto.openingTime || office.openingTime,
          closingTime: updateOfficeDto.closingTime || office.closingTime,
        },
      });

      return {
        ok: true,
        msg: 'Oficina Actualizada exitosamente',
      };
    } catch (error) {
      throw new InternalServerErrorException(`Error `);
    }
  }

  async changeStatusActive(id: string, updateOfficeDto: UpdateOfficeDto) {
    try {
      const office = await this.prisma.office.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
        },
      });

      if (!office) {
        throw new BadRequestException(`Oficina no encontrada`);
      }

      await this.prisma.office.update({
        where: { id: id },
        data: {
          isActive: updateOfficeDto.isActive,
        },
      });

      return {
        ok: true,
        msg: 'Estado de la oficina actualizado exitosamente',
      };
    } catch (error) {
      throw new InternalServerErrorException(`Error `);
    }
  }

  async remove(id: string) {
    try {
      const office = await this.prisma.office.findUnique({
        where: {
          id: id,
        },
      });

      if (!office) {
        throw new NotFoundException(`Oficiona no encontrada`);
      }

      await this.prisma.office.delete({
        where: {
          id: id,
        },
      });

      return {
        ok: true,
        msg: 'Oficina eliminada exitosamente',
      };
    } catch (error) {
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }
}
