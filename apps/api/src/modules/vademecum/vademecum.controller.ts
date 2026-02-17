import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { VademecumService } from './vademecum.service';

@ApiTags('Vademecum')
@ApiBearerAuth()
@Controller('vademecum')
export class VademecumController {
  constructor(private readonly vademecumService: VademecumService) {}

  @Get()
  @ApiOperation({ summary: 'List all medications (paginated)' })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.vademecumService.findAll(page || 1, limit || 50);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search medications using semantic search' })
  async search(@Query('q') query: string, @Query('limit') limit?: number) {
    if (!query || query.length < 2) {
      throw new BadRequestException('Query must be at least 2 characters');
    }

    const results = await this.vademecumService.search(query, limit || 5);
    return { results };
  }

  @Get('medicamento/:nombre')
  @ApiOperation({ summary: 'Get medication info by name' })
  async getMedicamento(@Param('nombre') nombre: string) {
    const result = await this.vademecumService.getMedicamento(nombre);
    if (!result) {
      return { found: false, message: 'Medicamento no encontrado' };
    }
    return { found: true, data: result };
  }

  @Post('check-interactions')
  @ApiOperation({ summary: 'Check drug interactions between medications' })
  async checkInteractions(@Body('medicamentos') medicamentos: string[]) {
    if (!medicamentos || medicamentos.length < 2) {
      throw new BadRequestException('At least 2 medications required');
    }

    const interactions = await this.vademecumService.checkInteractions(medicamentos);
    return {
      hasInteractions: interactions.length > 0,
      interactions,
    };
  }

  @Post('context')
  @ApiOperation({ summary: 'Build AI context for medications' })
  async buildContext(@Body('medicamentos') medicamentos: string[]) {
    if (!medicamentos || medicamentos.length === 0) {
      throw new BadRequestException('At least 1 medication required');
    }

    const context = await this.vademecumService.buildContextForAI(medicamentos);
    return { context };
  }

  @Post('ingest')
  @ApiOperation({ summary: 'Ingest vademecum data from PDF' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async ingestPDF(@UploadedFile() file: Express.Multer.File, @Body('fuente') fuente?: string) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('File must be a PDF');
    }

    const result = await this.vademecumService.ingestPDF(file.buffer, fuente || 'PDF Upload');

    return {
      success: true,
      message: `Processed ${result.processed} medications with ${result.errors} errors`,
      ...result,
    };
  }
}
