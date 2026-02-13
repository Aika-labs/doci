import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { CurrentTenant, TenantContext } from '../../common/decorators';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('transcribe')
  @ApiOperation({ summary: 'Transcribe audio to text using Whisper' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribe(
    @UploadedFile() file: Express.Multer.File,
    @Body('language') language?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Audio file is required');
    }

    const result = await this.aiService.transcribe(file.buffer, language || 'es');

    return {
      success: true,
      data: result,
    };
  }

  @Post('structure')
  @ApiOperation({ summary: 'Structure transcription into SOAP notes' })
  async structureNotes(
    @CurrentTenant() ctx: TenantContext,
    @Body() body: {
      transcription: string;
      patientId: string;
      templateId?: string;
      includeHistory?: boolean;
    },
  ) {
    if (!body.transcription || !body.patientId) {
      throw new BadRequestException('Transcription and patientId are required');
    }

    const result = await this.aiService.structureNotes(ctx, body.transcription, body.patientId, {
      templateId: body.templateId,
      includeHistory: body.includeHistory,
    });

    return {
      success: true,
      data: result,
    };
  }

  @Post('summary')
  @ApiOperation({ summary: 'Generate patient history summary' })
  async generateSummary(
    @CurrentTenant() ctx: TenantContext,
    @Body() body: { patientId: string },
  ) {
    if (!body.patientId) {
      throw new BadRequestException('PatientId is required');
    }

    const summary = await this.aiService.generatePatientSummary(ctx, body.patientId);

    return {
      success: true,
      data: { summary },
    };
  }
}
