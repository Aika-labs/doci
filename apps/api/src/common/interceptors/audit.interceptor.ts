import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const tenantId = request.tenantId;
    const userId = request.userId;

    // Only audit write operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          // Extract entity info from URL
          const urlParts = url.split('/').filter(Boolean);
          const entity = urlParts[1] || 'unknown'; // e.g., /api/patients -> patients
          const entityId = urlParts[2] || null;

          const actionMap: Record<string, string> = {
            POST: 'CREATE',
            PUT: 'UPDATE',
            PATCH: 'UPDATE',
            DELETE: 'DELETE',
          };

          await this.prisma.auditLog.create({
            data: {
              tenantId,
              userId,
              action: actionMap[method] || method,
              entity: entity.charAt(0).toUpperCase() + entity.slice(1, -1), // patients -> Patient
              entityId: entityId || (response as { id?: string })?.id,
              changes: method === 'DELETE' ? null : request.body,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
            },
          });
        } catch (error) {
          // Don't fail the request if audit logging fails
          console.error('Audit log error:', error);
        }
      }),
    );
  }
}
