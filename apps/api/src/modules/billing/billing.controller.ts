import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  BillingService,
  CreateServiceDto,
  CreateInvoiceDto,
  RecordPaymentDto,
} from './billing.service';
import { ClerkAuthGuard } from '../../common/guards';
import { TenantId, CurrentUser } from '../../common/decorators';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ============================================
  // Services Catalog
  // ============================================

  @Get('services')
  @ApiOperation({ summary: 'List all services' })
  async listServices(
    @TenantId() tenantId: string,
    @Query('category') category?: string,
    @Query('includeInactive') includeInactive?: boolean
  ) {
    return this.billingService.findAllServices(tenantId, { category, includeInactive });
  }

  @Get('services/:id')
  @ApiOperation({ summary: 'Get a service by ID' })
  async getService(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.billingService.getService(tenantId, id);
  }

  @Post('services')
  @ApiOperation({ summary: 'Create a new service' })
  async createService(@TenantId() tenantId: string, @Body() data: CreateServiceDto) {
    return this.billingService.createService(tenantId, data);
  }

  @Put('services/:id')
  @ApiOperation({ summary: 'Update a service' })
  async updateService(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() data: Partial<CreateServiceDto>
  ) {
    return this.billingService.updateService(tenantId, id, data);
  }

  @Delete('services/:id')
  @ApiOperation({ summary: 'Delete (deactivate) a service' })
  async deleteService(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.billingService.deleteService(tenantId, id);
  }

  // ============================================
  // Invoices
  // ============================================

  @Get('invoices')
  @ApiOperation({ summary: 'List all invoices' })
  async listInvoices(
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.billingService.findAllInvoices(tenantId, {
      page: page || 1,
      limit: limit || 50,
      status,
      patientId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('invoices/overdue')
  @ApiOperation({ summary: 'Get overdue invoices' })
  async getOverdueInvoices(@TenantId() tenantId: string) {
    return this.billingService.getOverdueInvoices(tenantId);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  async getInvoice(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.billingService.getInvoice(tenantId, id);
  }

  @Post('invoices')
  @ApiOperation({ summary: 'Create a new invoice' })
  async createInvoice(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() data: CreateInvoiceDto
  ) {
    return this.billingService.createInvoice(tenantId, userId, data);
  }

  @Post('invoices/:id/cancel')
  @ApiOperation({ summary: 'Cancel an invoice' })
  async cancelInvoice(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.billingService.cancelInvoice(tenantId, id);
  }

  // ============================================
  // Payments
  // ============================================

  @Get('invoices/:id/payments')
  @ApiOperation({ summary: 'Get payments for an invoice' })
  async getPayments(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.billingService.getPayments(tenantId, id);
  }

  @Post('invoices/:id/payments')
  @ApiOperation({ summary: 'Record a payment for an invoice' })
  async recordPayment(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() data: RecordPaymentDto
  ) {
    return this.billingService.recordPayment(tenantId, id, userId, data);
  }

  // ============================================
  // Reports
  // ============================================

  @Get('reports/summary')
  @ApiOperation({ summary: 'Get financial summary' })
  async getFinancialSummary(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.billingService.getFinancialSummary(tenantId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('reports/monthly/:year')
  @ApiOperation({ summary: 'Get monthly revenue for a year' })
  async getMonthlyRevenue(@TenantId() tenantId: string, @Param('year') year: number) {
    return this.billingService.getMonthlyRevenue(tenantId, year);
  }
}
