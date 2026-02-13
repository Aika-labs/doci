import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProduces } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { CurrentTenant, TenantContext } from '../../common/decorators';
import { Public } from '../../common/decorators/public.decorator';

interface MedicationItem {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: string;
}

@ApiTags('Prescriptions')
@ApiBearerAuth()
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all prescriptions' })
  async findAll(
    @CurrentTenant() ctx: TenantContext,
    @Query('consultationId') consultationId?: string,
  ) {
    return this.prescriptionsService.findAll(ctx, { consultationId });
  }

  @Get('verify/:code')
  @Public()
  @ApiOperation({ summary: 'Verify prescription by security code (public endpoint)' })
  async verify(@Param('code') code: string) {
    return this.prescriptionsService.verifyByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prescription by ID' })
  async findOne(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    return this.prescriptionsService.findOne(ctx, id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Generate prescription PDF' })
  @ApiProduces('application/pdf')
  @Header('Content-Type', 'application/pdf')
  async generatePDF(
    @CurrentTenant() ctx: TenantContext,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.prescriptionsService.generatePDF(ctx, id);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receta-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.end(pdfBuffer);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new prescription' })
  async create(
    @CurrentTenant() ctx: TenantContext,
    @Body()
    data: {
      consultationId: string;
      medications: MedicationItem[];
      diagnosis?: string;
      instructions?: string;
      expiresAt?: string;
    },
  ) {
    return this.prescriptionsService.create(ctx, data);
  }

  @Patch(':id/invalidate')
  @ApiOperation({ summary: 'Invalidate a prescription' })
  async invalidate(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    return this.prescriptionsService.invalidate(ctx, id);
  }
}
