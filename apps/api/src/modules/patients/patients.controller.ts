import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CurrentTenant, TenantContext } from '../../common/decorators';

@ApiTags('Patients')
@ApiBearerAuth()
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'List all patients' })
  async findAll(
    @CurrentTenant() ctx: TenantContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.patientsService.findAll(ctx, { page, limit, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  async findOne(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    return this.patientsService.findOne(ctx, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  async create(
    @CurrentTenant() ctx: TenantContext,
    @Body() data: {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
    },
  ) {
    return this.patientsService.create(ctx, data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a patient' })
  async update(
    @CurrentTenant() ctx: TenantContext,
    @Param('id') id: string,
    @Body() data: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    }>,
  ) {
    return this.patientsService.update(ctx, id, data);
  }
}
