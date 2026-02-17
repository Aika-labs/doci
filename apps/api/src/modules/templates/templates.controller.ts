import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TemplatesService, CreateTemplateDto, UpdateTemplateDto } from './templates.service';
import { CurrentTenant, TenantContext } from '../../common/decorators';

@ApiTags('Clinical Templates')
@ApiBearerAuth()
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all clinical templates' })
  async findAll(
    @CurrentTenant() ctx: TenantContext,
    @Query('specialty') specialty?: string,
    @Query('isActive') isActive?: string
  ) {
    return this.templatesService.findAll(ctx, {
      specialty,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });
  }

  @Get('default')
  @ApiOperation({ summary: 'Get default template for specialty' })
  async getDefault(@CurrentTenant() ctx: TenantContext, @Query('specialty') specialty?: string) {
    return this.templatesService.getDefault(ctx, specialty);
  }

  @Get('specialty/:specialty')
  @ApiOperation({ summary: 'Get templates by specialty' })
  async findBySpecialty(
    @CurrentTenant() ctx: TenantContext,
    @Param('specialty') specialty: string
  ) {
    return this.templatesService.findBySpecialty(ctx, specialty);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  async findOne(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    return this.templatesService.findOne(ctx, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new clinical template' })
  async create(@CurrentTenant() ctx: TenantContext, @Body() data: CreateTemplateDto) {
    return this.templatesService.create(ctx, data);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed default templates for tenant' })
  async seedDefaults(@CurrentTenant() ctx: TenantContext) {
    return this.templatesService.seedDefaultTemplates(ctx);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a template' })
  async duplicate(
    @CurrentTenant() ctx: TenantContext,
    @Param('id') id: string,
    @Body('name') name: string
  ) {
    return this.templatesService.duplicate(ctx, id, name);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a clinical template' })
  async update(
    @CurrentTenant() ctx: TenantContext,
    @Param('id') id: string,
    @Body() data: UpdateTemplateDto
  ) {
    return this.templatesService.update(ctx, id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a clinical template' })
  async delete(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    return this.templatesService.delete(ctx, id);
  }
}
