import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UserAuth } from 'src/auth/interfaces/user/user-auth';
import { EncryptService } from 'src/auth/services/encrypt/encrypt.service';
import { PrismaClientService } from 'src/prisma-client/prisma-client.service';


interface RequestWithUser extends Request {
  user: UserAuth;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private encryptService: EncryptService,
    private prisma: PrismaClientService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const secret = this.configService.get<string>('SECRET_JWT');
      if (!secret) {
        throw new UnauthorizedException('JWT secret not configured');
      }

      const payload = await this.jwtService.verifyAsync<UserAuth>(token, {
        secret,
      });

      const decryptedUserId = await this.encryptService.decrypt(payload.sub);

      const userRecord = await this.prisma.user.findUnique({
        where: { id: decryptedUserId },
        select: { active: true },
      });

      if (!userRecord || !userRecord.active) {
        throw new ForbiddenException('ACCOUNT_BLOCKED');
      }

      request.user = { ...payload, sub: decryptedUserId };

    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}
