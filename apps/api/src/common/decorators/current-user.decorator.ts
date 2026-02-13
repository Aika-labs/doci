import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface ClerkUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  publicMetadata: Record<string, unknown>;
  privateMetadata: Record<string, unknown>;
}

export const CurrentUser = createParamDecorator(
  (data: keyof ClerkUser | undefined, ctx: ExecutionContext): ClerkUser | unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as ClerkUser;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
