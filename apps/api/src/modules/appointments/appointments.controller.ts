import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CurrentTenant, TenantContext } from '../../common/decorators';
import { AppointmentStatus, AppointmentType } from '@doci/database';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all appointments' })
  async findAll(
    @CurrentTenant() ctx: TenantContext,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: AppointmentStatus,
  ) {
    return this.appointmentsService.findAll(ctx, { start, end, patientId, status });
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today\'s appointments' })
  async getTodayAppointments(@CurrentTenant() ctx: TenantContext) {
    return this.appointmentsService.getTodayAppointments(ctx);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  async findOne(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    return this.appointmentsService.findOne(ctx, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  async create(
    @CurrentTenant() ctx: TenantContext,
    @Body()
    data: {
      patientId: string;
      scheduledAt: string;
      duration: number;
      type: AppointmentType;
      reason?: string;
      notes?: string;
    },
  ) {
    return this.appointmentsService.create(ctx, data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an appointment' })
  async update(
    @CurrentTenant() ctx: TenantContext,
    @Param('id') id: string,
    @Body()
    data: {
      scheduledAt?: string;
      duration?: number;
      type?: AppointmentType;
      status?: AppointmentStatus;
      reason?: string;
      notes?: string;
    },
  ) {
    return this.appointmentsService.update(ctx, id, data);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update appointment status' })
  async updateStatus(
    @CurrentTenant() ctx: TenantContext,
    @Param('id') id: string,
    @Body('status') status: AppointmentStatus,
  ) {
    return this.appointmentsService.updateStatus(ctx, id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an appointment' })
  async delete(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    return this.appointmentsService.delete(ctx, id);
  }
}
