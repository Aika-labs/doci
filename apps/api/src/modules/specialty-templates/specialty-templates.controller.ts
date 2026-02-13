import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SpecialtyTemplatesService } from './specialty-templates.service';
import { ClerkAuthGuard } from '../../common/guards';

@ApiTags('Specialty Templates')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('specialty-templates')
export class SpecialtyTemplatesController {
  constructor(private readonly specialtyTemplatesService: SpecialtyTemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List all specialty templates' })
  async findAll() {
    return this.specialtyTemplatesService.findAll();
  }

  @Get(':specialty')
  @ApiOperation({ summary: 'Get a specialty template by code' })
  async findBySpecialty(@Param('specialty') specialty: string) {
    return this.specialtyTemplatesService.findBySpecialty(specialty);
  }

  @Get(':specialty/ai-prompt')
  @ApiOperation({ summary: 'Get AI prompt for a specialty' })
  async getAIPrompt(@Param('specialty') specialty: string) {
    const prompt = await this.specialtyTemplatesService.getAIPrompt(specialty);
    return { prompt };
  }

  @Get(':specialty/soap-defaults')
  @ApiOperation({ summary: 'Get SOAP defaults for a specialty' })
  async getSOAPDefaults(@Param('specialty') specialty: string) {
    const defaults = await this.specialtyTemplatesService.getSOAPDefaults(specialty);
    return { defaults };
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed default specialty templates' })
  async seedDefaults() {
    return this.specialtyTemplatesService.seedDefaults();
  }
}
