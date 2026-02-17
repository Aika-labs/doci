import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/decorators';
import { CreatePatientDto, UpdatePatientDto } from './dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    ctx: TenantContext,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const { page = 1, limit = 20, search, sortBy = 'lastName', sortOrder = 'asc' } = options || {};
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
          { nationalId: { contains: search } },
        ],
      }),
    };

    // Build orderBy dynamically
    const validSortFields = ['firstName', 'lastName', 'email', 'createdAt', 'updatedAt'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'lastName';
    const orderBy = { [orderByField]: sortOrder };

    const [items, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          birthDate: true,
          gender: true,
          bloodType: true,
          createdAt: true,
          _count: {
            select: {
              consultations: true,
              appointments: true,
            },
          },
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
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
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            diagnoses: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        appointments: {
          take: 5,
          orderBy: { startTime: 'desc' },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            type: true,
            reason: true,
          },
        },
        files: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            type: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async getHistory(
    ctx: TenantContext,
    patientId: string,
    options?: { page?: number; limit?: number }
  ) {
    const { page = 1, limit = 20 } = options || {};
    const skip = (page - 1) * limit;

    const where = {
      patientId,
      tenantId: ctx.tenantId,
    };

    const [consultations, total] = await Promise.all([
      this.prisma.consultation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialty: true,
            },
          },
          prescriptions: {
            select: {
              id: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.consultation.count({ where }),
    ]);

    return {
      data: consultations,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats(ctx: TenantContext) {
    const [total, newThisMonth, byGender] = await Promise.all([
      this.prisma.patient.count({
        where: { tenantId: ctx.tenantId, isActive: true },
      }),
      this.prisma.patient.count({
        where: {
          tenantId: ctx.tenantId,
          isActive: true,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.patient.groupBy({
        by: ['gender'],
        where: { tenantId: ctx.tenantId, isActive: true },
        _count: true,
      }),
    ]);

    return {
      total,
      newThisMonth,
      byGender: byGender.reduce(
        (acc, item) => {
          acc[item.gender || 'UNKNOWN'] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }

  async create(ctx: TenantContext, data: CreatePatientDto) {
    return this.prisma.patient.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        birthDate: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender,
        nationalId: data.nationalId,
        insuranceId: data.insuranceId,
        insuranceCompany: data.insuranceCompany,
        bloodType: data.bloodType,
        address: data.address ? JSON.parse(JSON.stringify(data.address)) : undefined,
        emergencyContact: data.emergencyContact
          ? JSON.parse(JSON.stringify(data.emergencyContact))
          : undefined,
        allergies: data.allergies ? JSON.parse(JSON.stringify(data.allergies)) : undefined,
        chronicConditions: data.chronicConditions
          ? JSON.parse(JSON.stringify(data.chronicConditions))
          : undefined,
        currentMedications: data.currentMedications
          ? JSON.parse(JSON.stringify(data.currentMedications))
          : undefined,
        notes: data.notes,
        tenantId: ctx.tenantId,
      },
    });
  }

  async update(ctx: TenantContext, id: string, data: UpdatePatientDto) {
    // First check if patient exists and belongs to tenant
    const existing = await this.prisma.patient.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });

    if (!existing) {
      return null;
    }

    return this.prisma.patient.update({
      where: { id },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.dateOfBirth !== undefined && {
          birthDate: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.nationalId !== undefined && { nationalId: data.nationalId }),
        ...(data.insuranceId !== undefined && { insuranceId: data.insuranceId }),
        ...(data.insuranceCompany !== undefined && { insuranceCompany: data.insuranceCompany }),
        ...(data.bloodType !== undefined && { bloodType: data.bloodType }),
        ...(data.address !== undefined && {
          address: data.address ? JSON.parse(JSON.stringify(data.address)) : null,
        }),
        ...(data.emergencyContact !== undefined && {
          emergencyContact: data.emergencyContact
            ? JSON.parse(JSON.stringify(data.emergencyContact))
            : null,
        }),
        ...(data.allergies !== undefined && {
          allergies: data.allergies ? JSON.parse(JSON.stringify(data.allergies)) : null,
        }),
        ...(data.chronicConditions !== undefined && {
          chronicConditions: data.chronicConditions
            ? JSON.parse(JSON.stringify(data.chronicConditions))
            : null,
        }),
        ...(data.currentMedications !== undefined && {
          currentMedications: data.currentMedications
            ? JSON.parse(JSON.stringify(data.currentMedications))
            : null,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  async softDelete(ctx: TenantContext, id: string) {
    const existing = await this.prisma.patient.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });

    if (!existing) {
      return null;
    }

    await this.prisma.patient.update({
      where: { id },
      data: { isActive: false },
    });

    return true;
  }

  async restore(ctx: TenantContext, id: string) {
    return this.prisma.patient.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data: { isActive: true },
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

    if (!patient) {
      return null;
    }

    // Build a summary for AI
    return {
      patient: {
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        age: patient.birthDate
          ? Math.floor((Date.now() - patient.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : null,
        gender: patient.gender,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions,
        currentMedications: patient.currentMedications,
      },
      recentConsultations: patient.consultations.map((c) => ({
        date: c.startedAt,
        diagnoses: c.diagnoses,
        vitalSigns: c.vitalSigns,
        soapNotes: c.soapNotes,
      })),
    };
  }
}
