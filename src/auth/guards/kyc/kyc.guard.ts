import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';

@Injectable()
export class KycGuard implements CanActivate {
  constructor(private prisma: PrismaClientService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.sub) {
      throw new ForbiddenException('No estás autenticado');
    }

    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { kycStatus: true },
    });

    if (!userRecord) {
      throw new ForbiddenException('Usuario no encontrado');
    }

    if (userRecord.kycStatus !== 'APPROVED') {
      throw new ForbiddenException(
        'Necesitas completar la verificación de identidad (KYC) para realizar esta operación.',
      );
    }

    return true;
  }
}
