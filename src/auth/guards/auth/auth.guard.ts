import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UserAuth } from 'src/auth/interfaces/user/user-auth';
import { EncryptService } from 'src/auth/services/encrypt/encrypt.service';

interface RequestWithUser extends Request {
  user: UserAuth;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private encryptService: EncryptService,
  ) {}

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

      request.user = { ...payload, sub: decryptedUserId };
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}
