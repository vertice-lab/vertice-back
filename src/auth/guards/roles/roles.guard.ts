import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ROLES_KEY,
  ValidRoles,
} from 'src/auth/decorators/role-protected/role-protected.decorator';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaClientService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ValidRoles[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.sub) {
      throw new ForbiddenException('No tiene los permisos necesarios.');
    }

    const userWithRole = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: {
        role: {
          select: { name: true },
        },
      },
    });

    const userRole = userWithRole?.role?.name;
    const hasRequiredRole = requiredRoles.includes(userRole as ValidRoles);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Rol no autorizado. Solo ${requiredRoles.join(', ')} pueden acceder a esta ruta.`,
      );
    }

    return true;
  }
}
