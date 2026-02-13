import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/decorators';
import { AppointmentStatus, AppointmentType, Prisma } from '@doci/database';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    ctx: TenantContext,
    params?: {
      start?: string;
      end?: string;
      patientId?: string;
      status?: AppointmentStatus;
    },
  ) {
    const where: Prisma.AppointmentWhereInput = {
      tenantId: ctx.tenantId,
    };

    if (params?.start && params?.end) {
      where.startTime = {
        gte: new Date(params.start),
        lte: new Date(params.end),
      };
    }

    if (params?.patientId) {
      where.patientId = params.patientId;
    }

    if (params?.status) {
      where.status = params.status;
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Transform to match frontend expectations
    const transformedAppointments = appointments.map((apt) => ({
      ...apt,
      scheduledAt: apt.startTime.toISOString(),
    }));

    return {
      data: transformedAppointments,
      total: appointments.length,
    };
  }

  async findOne(ctx: TenantContext, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        tenantId: ctx.tenantId,
      },
      include: {
        patient: true,
        user: true,
        consultation: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    return {
      ...appointment,
      scheduledAt: appointment.startTime.toISOString(),
    };
  }

  async create(
    ctx: TenantContext,
    data: {
      patientId: string;
      scheduledAt: string;
      duration: number;
      type: AppointmentType;
      reason?: string;
      notes?: string;
    },
  ) {
    const startTime = new Date(data.scheduledAt);
    const endTime = new Date(startTime.getTime() + data.duration * 60000);

    const appointment = await this.prisma.appointment.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        patientId: data.patientId,
        startTime,
        endTime,
        duration: data.duration,
        type: data.type,
        reason: data.reason,
        notes: data.notes,
        status: 'SCHEDULED',
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return {
      ...appointment,
      scheduledAt: appointment.startTime.toISOString(),
    };
  }

  async update(
    ctx: TenantContext,
    id: string,
    data: {
      scheduledAt?: string;
      duration?: number;
      type?: AppointmentType;
      status?: AppointmentStatus;
      reason?: string;
      notes?: string;
    },
  ) {
    // Verify appointment exists and belongs to tenant
    await this.findOne(ctx, id);

    const updateData: Prisma.AppointmentUpdateInput = {};

    if (data.scheduledAt) {
      const startTime = new Date(data.scheduledAt);
      const duration = data.duration || 30;
      const endTime = new Date(startTime.getTime() + duration * 60000);
      updateData.startTime = startTime;
      updateData.endTime = endTime;
    }

    if (data.duration) updateData.duration = data.duration;
    if (data.type) updateData.type = data.type;
    if (data.status) updateData.status = data.status;
    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return {
      ...appointment,
      scheduledAt: appointment.startTime.toISOString(),
    };
  }

  async delete(ctx: TenantContext, id: string) {
    // Verify appointment exists and belongs to tenant
    await this.findOne(ctx, id);

    return this.prisma.appointment.delete({
      where: { id },
    });
  }

  async updateStatus(ctx: TenantContext, id: string, status: AppointmentStatus) {
    return this.update(ctx, id, { status });
  }

  // Cron job to send reminders (runs every hour)
  @Cron(CronExpression.EVERY_HOUR)
  async sendReminders() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find appointments in the next 24 hours that haven't had reminders sent
    const appointments = await this.prisma.appointment.findMany({
      where: {
        startTime: {
          gte: now,
          lte: tomorrow,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
        reminderSentAt: null,
      },
      include: {
        patient: true,
        user: true,
        tenant: true,
      },
    });

    for (const appointment of appointments) {
      try {
        // TODO: Implement actual notification sending (email, SMS, push)
        console.log(
          `Reminder: ${appointment.patient.firstName} ${appointment.patient.lastName} ` +
            `has appointment at ${appointment.startTime}`,
        );

        await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminderSentAt: new Date() },
        });
      } catch (error) {
        console.error(`Failed to send reminder for appointment ${appointment.id}:`, error);
      }
    }
  }

  // Get today's appointments for a user
  async getTodayAppointments(ctx: TenantContext) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        startTime: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'],
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return appointments.map((apt) => ({
      ...apt,
      scheduledAt: apt.startTime.toISOString(),
    }));
  }
}
