import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConsultationsService } from './consultations.service';
import { CurrentTenant, TenantContext } from '../../common/decorators';

@ApiTags('Consultations')
@ApiBearerAuth()
@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Get()
  @ApiOperation({ summary: 'List consultations' })
  async findAll(
    @CurrentTenant() ctx: TenantContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('patientId') patientId?: string
  ) {
    return this.consultationsService.findAll(ctx, { page, limit, patientId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get consultation by ID' })
  async findOne(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    return this.consultationsService.findOne(ctx, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new consultation' })
  async create(
    @CurrentTenant() ctx: TenantContext,
    @Body()
    data: {
      patientId: string;
      templateId?: string;
      appointmentId?: string;
      clinicalData: Record<string, unknown>;
    }
  ) {
    return this.consultationsService.create(
      ctx,
      data as Parameters<typeof this.consultationsService.create>[1]
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a consultation' })
  async update(
    @CurrentTenant() ctx: TenantContext,
    @Param('id') id: string,
    @Body()
    data: {
      clinicalData?: Record<string, unknown>;
      soapNotes?: Record<string, unknown>;
      status?: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    }
  ) {
    return this.consultationsService.update(
      ctx,
      id,
      data as Parameters<typeof this.consultationsService.update>[2]
    );
  }
}
