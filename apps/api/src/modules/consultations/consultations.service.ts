import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/decorators';

// Type for JSON fields compatible with Prisma
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

@Injectable()
export class ConsultationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(ctx: TenantContext, options?: { page?: number; limit?: number; patientId?: string }) {
    const { page = 1, limit = 20, patientId } = options || {};
    const skip = (page - 1) * limit;

    const where = {
      tenantId: ctx.tenantId,
      ...(patientId && { patientId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.consultation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true },
          },
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.consultation.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(ctx: TenantContext, id: string) {
    return this.prisma.consultation.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        patient: true,
        user: true,
        template: true,
        prescriptions: true,
      },
    });
  }

  async create(ctx: TenantContext, data: {
    patientId: string;
    templateId?: string;
    appointmentId?: string;
    clinicalData: JsonValue;
  }) {
    return this.prisma.consultation.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        patientId: data.patientId,
        templateId: data.templateId,
        appointmentId: data.appointmentId,
        clinicalData: data.clinicalData as object,
        status: 'IN_PROGRESS',
      },
    });
  }

  async update(ctx: TenantContext, id: string, data: {
    clinicalData?: JsonValue;
    soapNotes?: JsonValue;
    vitalSigns?: JsonValue;
    diagnoses?: JsonValue;
    aiTranscription?: string;
    aiSummary?: string;
    status?: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  }) {
    const updateData: Record<string, unknown> = {};

    if (data.clinicalData !== undefined) updateData.clinicalData = data.clinicalData;
    if (data.soapNotes !== undefined) updateData.soapNotes = data.soapNotes;
    if (data.vitalSigns !== undefined) updateData.vitalSigns = data.vitalSigns;
    if (data.diagnoses !== undefined) updateData.diagnoses = data.diagnoses;
    if (data.aiTranscription !== undefined) updateData.aiTranscription = data.aiTranscription;
    if (data.aiSummary !== undefined) updateData.aiSummary = data.aiSummary;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }

    return this.prisma.consultation.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data: updateData,
    });
  }
}
