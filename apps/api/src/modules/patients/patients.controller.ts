import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CurrentTenant, TenantContext } from '../../common/decorators';
import { CreatePatientDto, UpdatePatientDto } from './dto';

@ApiTags('Patients')
@ApiBearerAuth()
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'List all patients with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @CurrentTenant() ctx: TenantContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.patientsService.findAll(ctx, {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get patient statistics' })
  async getStats(@CurrentTenant() ctx: TenantContext) {
    return this.patientsService.getStats(ctx);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID with full details' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async findOne(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    const patient = await this.patientsService.findOne(ctx, id);
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return patient;
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get patient consultation history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getHistory(
    @CurrentTenant() ctx: TenantContext,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.patientsService.getHistory(ctx, id, { page, limit });
  }

  @Get(':id/context')
  @ApiOperation({ summary: 'Get patient context for AI (recent history, conditions, etc.)' })
  async getContext(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    return this.patientsService.getPatientContext(ctx, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiResponse({ status: 201, description: 'Patient created successfully' })
  async create(
    @CurrentTenant() ctx: TenantContext,
    @Body() createPatientDto: CreatePatientDto,
  ) {
    return this.patientsService.create(ctx, createPatientDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a patient' })
  @ApiResponse({ status: 200, description: 'Patient updated successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async update(
    @CurrentTenant() ctx: TenantContext,
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    const patient = await this.patientsService.update(ctx, id, updatePatientDto);
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return patient;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a patient (deactivate)' })
  @ApiResponse({ status: 204, description: 'Patient deleted successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  async remove(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    const result = await this.patientsService.softDelete(ctx, id);
    if (!result) {
      throw new NotFoundException('Patient not found');
    }
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted patient' })
  @ApiResponse({ status: 200, description: 'Patient restored successfully' })
  async restore(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    return this.patientsService.restore(ctx, id);
  }
}
