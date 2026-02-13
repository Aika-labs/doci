import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface TenantContext {
  tenantId: string;
  userId: string;
}

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return {
      tenantId: request.tenantId!,
      userId: request.userId!,
    };
  },
);
