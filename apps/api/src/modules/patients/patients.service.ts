import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/decorators';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(ctx: TenantContext, options?: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 20, search } = options || {};
    const skip = (page - 1) * limit;

    const where = {
      tenantId: ctx.tenantId,
      isActive: true,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastName: 'asc' },
      }),
      this.prisma.patient.count({ where }),
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

  async findOne(ctx: TenantContext, id: string) {
    return this.prisma.patient.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        consultations: {
          take: 10,
          orderBy: { startedAt: 'desc' },
        },
        appointments: {
          take: 5,
          orderBy: { startTime: 'desc' },
        },
      },
    });
  }

  async create(ctx: TenantContext, data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    birthDate?: Date;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  }) {
    return this.prisma.patient.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        birthDate: data.birthDate,
        gender: data.gender,
        tenantId: ctx.tenantId,
      },
    });
  }

  async update(ctx: TenantContext, id: string, data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }>) {
    return this.prisma.patient.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data,
    });
  }

  async getPatientContext(ctx: TenantContext, patientId: string) {
    // Get patient with recent history for AI context
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId: ctx.tenantId },
      include: {
        consultations: {
          take: 10,
          orderBy: { startedAt: 'desc' },
          select: {
            id: true,
            clinicalData: true,
            soapNotes: true,
            diagnoses: true,
            vitalSigns: true,
            startedAt: true,
          },
        },
      },
    });

    return patient;
  }
}
