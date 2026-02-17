import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@doci/database';

// ============================================
// Types
// ============================================

export interface CreateServiceDto {
  name: string;
  description?: string;
  category?: string;
  price: number;
  currency?: string;
  taxRate?: number;
  durationMinutes?: number;
  satCode?: string;
  satUnit?: string;
}

export interface CreateInvoiceDto {
  patientId?: string;
  patientName: string;
  patientRfc?: string;
  patientEmail?: string;
  consultationId?: string;
  items: Array<{
    serviceId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    satCode?: string;
    satUnit?: string;
  }>;
  discount?: number;
  notes?: string;
  dueDate?: Date;
}

export interface RecordPaymentDto {
  amount: number;
  method: 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER';
  reference?: string;
  notes?: string;
}

// ============================================
// Service
// ============================================

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private prisma: PrismaService) {}

  // ============================================
  // Services Catalog
  // ============================================

  async createService(tenantId: string, data: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        category: data.category,
        price: new Prisma.Decimal(data.price),
        currency: data.currency || 'MXN',
        taxRate: new Prisma.Decimal(data.taxRate || 0),
        durationMinutes: data.durationMinutes,
        satCode: data.satCode,
        satUnit: data.satUnit || 'E48',
      },
    });
  }

  async updateService(tenantId: string, serviceId: string, data: Partial<CreateServiceDto>) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return this.prisma.service.update({
      where: { id: serviceId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.price !== undefined && { price: new Prisma.Decimal(data.price) }),
        ...(data.currency && { currency: data.currency }),
        ...(data.taxRate !== undefined && { taxRate: new Prisma.Decimal(data.taxRate) }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
        ...(data.satCode !== undefined && { satCode: data.satCode }),
        ...(data.satUnit !== undefined && { satUnit: data.satUnit }),
      },
    });
  }

  async deleteService(tenantId: string, serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Soft delete by deactivating
    return this.prisma.service.update({
      where: { id: serviceId },
      data: { isActive: false },
    });
  }

  async findAllServices(
    tenantId: string,
    options?: { category?: string; includeInactive?: boolean }
  ) {
    const { category, includeInactive = false } = options || {};

    return this.prisma.service.findMany({
      where: {
        tenantId,
        ...(category && { category }),
        ...(!includeInactive && { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async getService(tenantId: string, serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  // ============================================
  // Invoices
  // ============================================

  async createInvoice(tenantId: string, userId: string, data: CreateInvoiceDto) {
    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const items = data.items.map((item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemTax = itemTotal * (item.taxRate || 0);
      subtotal += itemTotal;
      taxAmount += itemTax;

      return {
        serviceId: item.serviceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(item.unitPrice),
        taxRate: new Prisma.Decimal(item.taxRate || 0),
        total: new Prisma.Decimal(itemTotal + itemTax),
        satCode: item.satCode,
        satUnit: item.satUnit,
      };
    });

    const discount = data.discount || 0;
    const total = subtotal + taxAmount - discount;

    return this.prisma.invoice.create({
      data: {
        tenantId,
        patientId: data.patientId,
        patientName: data.patientName,
        patientRfc: data.patientRfc,
        patientEmail: data.patientEmail,
        consultationId: data.consultationId,
        invoiceNumber,
        subtotal: new Prisma.Decimal(subtotal),
        taxAmount: new Prisma.Decimal(taxAmount),
        discount: new Prisma.Decimal(discount),
        total: new Prisma.Decimal(total),
        dueDate: data.dueDate,
        notes: data.notes,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
      },
    });
  }

  async getInvoice(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        items: {
          include: { service: true },
        },
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async findAllInvoices(
    tenantId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
      patientId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const { page = 1, limit = 50, status, patientId, startDate, endDate } = options || {};
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(status && { status: status as Prisma.EnumInvoiceStatusFilter }),
      ...(patientId && { patientId }),
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
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          payments: true,
        },
      }),
      this.prisma.invoice.count({ where }),
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

  async cancelInvoice(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestException('Cannot cancel a paid invoice');
    }

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'CANCELLED' },
    });
  }

  // ============================================
  // Payments
  // ============================================

  async recordPayment(tenantId: string, invoiceId: string, userId: string, data: RecordPaymentDto) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot add payment to cancelled invoice');
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice is already fully paid');
    }

    // Create payment
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        amount: new Prisma.Decimal(data.amount),
        method: data.method,
        reference: data.reference,
        notes: data.notes,
        createdBy: userId,
      },
    });

    // Update invoice paid amount and status
    const newPaidAmount = Number(invoice.paidAmount) + data.amount;
    const invoiceTotal = Number(invoice.total);

    const isPaid = newPaidAmount >= invoiceTotal;
    const isPartial = newPaidAmount > 0 && !isPaid;

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: new Prisma.Decimal(newPaidAmount),
        ...(isPaid && { status: 'PAID' as const, paidAt: new Date() }),
        ...(isPartial && { status: 'PARTIAL' as const }),
      },
    });

    return payment;
  }

  async getPayments(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paidAt: 'desc' },
    });
  }

  // ============================================
  // Financial Reports
  // ============================================

  async getFinancialSummary(tenantId: string, options?: { startDate?: Date; endDate?: Date }) {
    const { startDate, endDate } = options || {};

    const dateFilter = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };

    const [
      totalInvoiced,
      totalPaid,
      totalPending,
      invoicesByStatus,
      revenueByCategory,
      topServices,
    ] = await Promise.all([
      // Total invoiced
      this.prisma.invoice.aggregate({
        where: {
          tenantId,
          status: { not: 'CANCELLED' },
          ...(startDate || endDate ? { createdAt: dateFilter } : {}),
        },
        _sum: { total: true },
      }),

      // Total paid
      this.prisma.invoice.aggregate({
        where: {
          tenantId,
          status: 'PAID',
          ...(startDate || endDate ? { paidAt: dateFilter } : {}),
        },
        _sum: { total: true },
      }),

      // Total pending
      this.prisma.invoice.aggregate({
        where: {
          tenantId,
          status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
          ...(startDate || endDate ? { createdAt: dateFilter } : {}),
        },
        _sum: { total: true },
      }),

      // Invoices by status
      this.prisma.invoice.groupBy({
        by: ['status'],
        where: {
          tenantId,
          ...(startDate || endDate ? { createdAt: dateFilter } : {}),
        },
        _count: true,
        _sum: { total: true },
      }),

      // Revenue by service category
      this.prisma.$queryRaw`
        SELECT s.category, SUM(ii.total) as revenue
        FROM "InvoiceItem" ii
        JOIN "Invoice" i ON ii."invoiceId" = i.id
        LEFT JOIN "Service" s ON ii."serviceId" = s.id
        WHERE i."tenantId" = ${tenantId}
        AND i.status != 'CANCELLED'
        ${startDate ? Prisma.sql`AND i."createdAt" >= ${startDate}` : Prisma.empty}
        ${endDate ? Prisma.sql`AND i."createdAt" <= ${endDate}` : Prisma.empty}
        GROUP BY s.category
        ORDER BY revenue DESC
      `,

      // Top services
      this.prisma.$queryRaw`
        SELECT s.name, COUNT(ii.id) as count, SUM(ii.total) as revenue
        FROM "InvoiceItem" ii
        JOIN "Invoice" i ON ii."invoiceId" = i.id
        JOIN "Service" s ON ii."serviceId" = s.id
        WHERE i."tenantId" = ${tenantId}
        AND i.status != 'CANCELLED'
        ${startDate ? Prisma.sql`AND i."createdAt" >= ${startDate}` : Prisma.empty}
        ${endDate ? Prisma.sql`AND i."createdAt" <= ${endDate}` : Prisma.empty}
        GROUP BY s.id, s.name
        ORDER BY revenue DESC
        LIMIT 10
      `,
    ]);

    return {
      summary: {
        totalInvoiced: totalInvoiced._sum.total || 0,
        totalPaid: totalPaid._sum.total || 0,
        totalPending: totalPending._sum.total || 0,
      },
      invoicesByStatus: invoicesByStatus.map((s) => ({
        status: s.status,
        count: s._count,
        total: s._sum.total,
      })),
      revenueByCategory,
      topServices,
    };
  }

  async getMonthlyRevenue(tenantId: string, year: number) {
    const result = await this.prisma.$queryRaw<
      Array<{ month: number; revenue: number; count: number }>
    >`
      SELECT 
        EXTRACT(MONTH FROM "paidAt") as month,
        SUM(total) as revenue,
        COUNT(*) as count
      FROM "Invoice"
      WHERE "tenantId" = ${tenantId}
      AND status = 'PAID'
      AND EXTRACT(YEAR FROM "paidAt") = ${year}
      GROUP BY EXTRACT(MONTH FROM "paidAt")
      ORDER BY month
    `;

    // Fill in missing months with zeros
    const months = Array.from({ length: 12 }, (_, i) => {
      const found = result.find((r) => Number(r.month) === i + 1);
      return {
        month: i + 1,
        revenue: found ? Number(found.revenue) : 0,
        count: found ? Number(found.count) : 0,
      };
    });

    return months;
  }

  async getOverdueInvoices(tenantId: string) {
    const now = new Date();

    // First update overdue status
    await this.prisma.invoice.updateMany({
      where: {
        tenantId,
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { lt: now },
      },
      data: { status: 'OVERDUE' },
    });

    // Then fetch overdue invoices
    return this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'OVERDUE',
      },
      orderBy: { dueDate: 'asc' },
      include: {
        items: true,
      },
    });
  }

  // ============================================
  // Private helpers
  // ============================================

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}`;

    // Get the last invoice number for this tenant and year
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: {
        tenantId,
        invoiceNumber: { startsWith: prefix },
      },
      orderBy: { invoiceNumber: 'desc' },
    });

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2] || '0', 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${sequence.toString().padStart(5, '0')}`;
  }
}
