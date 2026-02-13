import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface TenantContext {
  tenantId: string;
  userId: string;
}

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    // This will be populated by the auth guard after validating the JWT
    return {
      tenantId: request.tenantId,
      userId: request.userId,
    };
  },
);
