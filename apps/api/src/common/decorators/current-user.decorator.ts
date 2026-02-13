import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface CurrentUserData {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext): CurrentUserData | unknown => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as CurrentUserData;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
