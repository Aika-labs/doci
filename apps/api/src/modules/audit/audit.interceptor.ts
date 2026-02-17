import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService, AuditAction } from './audit.service';
import { Reflector } from '@nestjs/core';

export const AUDIT_KEY = 'audit';

export interface AuditOptions {
  action: AuditAction;
  entity: string;
  getEntityId?: (request: unknown, response: unknown) => string | undefined;
  getChanges?: (request: unknown, response: unknown) => { before?: unknown; after?: unknown };
}

/**
 * Decorator to mark a controller method for audit logging
 */
export function Audit(options: AuditOptions) {
  return (target: object, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(AUDIT_KEY, options, descriptor.value as object);
    return descriptor;
  };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private auditService: AuditService,
    private reflector: Reflector
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const handler = context.getHandler();
    const auditOptions = Reflect.getMetadata(AUDIT_KEY, handler) as AuditOptions | undefined;

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId || request.user?.tenantId;
    const userId = request.user?.id || request.user?.userId;

    return next.handle().pipe(
      tap((response) => {
        // Fire and forget - don't await
        void this.auditService.log({
          tenantId,
          userId,
          action: auditOptions.action,
          entity: auditOptions.entity,
          entityId: auditOptions.getEntityId?.(request, response),
          changes: auditOptions.getChanges?.(request, response),
          ipAddress: request.ip,
          userAgent: request.headers?.['user-agent'],
        });
      })
    );
  }
}
