import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'DOWNLOAD'
  | 'UPLOAD'
  | 'PRINT';

export interface AuditLogData {
  tenantId: string;
  userId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  changes?: { before?: unknown; after?: unknown };
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Log an audit event
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: data.tenantId,
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          changes: data.changes ? JSON.parse(JSON.stringify(data.changes)) : null,
          metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      // Don't throw - audit logging should not break the main flow
      this.logger.error(`Failed to log audit event: ${error}`);
    }
  }

  /**
   * Get audit logs for a tenant
   */
  async findAll(
    tenantId: string,
    options?: {
      page?: number;
      limit?: number;
      entity?: string;
      entityId?: string;
      userId?: string;
      action?: AuditAction;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const {
      page = 1,
      limit = 50,
      entity,
      entityId,
      userId,
      action,
      startDate,
      endDate,
    } = options || {};
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(entity && { entity }),
      ...(entityId && { entityId }),
      ...(userId && { userId }),
      ...(action && { action }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit history for a specific entity
   */
  async getEntityHistory(tenantId: string, entity: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        entity,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get recent activity for a user
   */
  async getUserActivity(tenantId: string, userId: string, limit: number = 20) {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        userId,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get audit summary/stats
   */
  async getStats(tenantId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalLogs, byAction, byEntity, byUser] = await Promise.all([
      this.prisma.auditLog.count({
        where: { tenantId, createdAt: { gte: startDate } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: { tenantId, createdAt: { gte: startDate } },
        _count: true,
      }),
      this.prisma.auditLog.groupBy({
        by: ['entity'],
        where: { tenantId, createdAt: { gte: startDate } },
        _count: true,
      }),
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        where: { tenantId, createdAt: { gte: startDate }, userId: { not: null } },
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalLogs,
      byAction: byAction.map((a) => ({ action: a.action, count: a._count })),
      byEntity: byEntity.map((e) => ({ entity: e.entity, count: e._count })),
      topUsers: byUser.map((u) => ({ userId: u.userId, count: u._count })),
    };
  }
}
