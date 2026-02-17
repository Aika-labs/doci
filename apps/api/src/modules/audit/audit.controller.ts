import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService, AuditAction } from './audit.service';
import { ClerkAuthGuard } from '../../common/guards';
import { TenantId } from '../../common/decorators';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs (paginated)' })
  async findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.auditService.findAll(tenantId, {
      page: page || 1,
      limit: limit || 50,
      entity,
      entityId,
      userId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get audit statistics' })
  async getStats(@TenantId() tenantId: string, @Query('days') days?: number) {
    return this.auditService.getStats(tenantId, days || 30);
  }

  @Get('entity/:entity/:entityId')
  @ApiOperation({ summary: 'Get audit history for a specific entity' })
  async getEntityHistory(
    @TenantId() tenantId: string,
    @Param('entity') entity: string,
    @Param('entityId') entityId: string
  ) {
    return this.auditService.getEntityHistory(tenantId, entity, entityId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get recent activity for a user' })
  async getUserActivity(
    @TenantId() tenantId: string,
    @Param('userId') userId: string,
    @Query('limit') limit?: number
  ) {
    return this.auditService.getUserActivity(tenantId, userId, limit || 20);
  }
}
