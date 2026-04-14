import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserAuth } from 'src/auth/interfaces/user/user-auth';

export interface RequestWithUser extends Request {
  user: UserAuth;
}

export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserAuth => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    return request.user;
  },
);
