import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { ClerkAuthGuard } from '../../common/guards';
import { TenantId } from '../../common/decorators';

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Global search across all entities' })
  async search(
    @TenantId() tenantId: string,
    @Query('q') query: string,
    @Query('types') types?: string,
    @Query('limit') limit?: number
  ) {
    if (!query || query.length < 2) {
      throw new BadRequestException('Query must be at least 2 characters');
    }

    const typeArray = types
      ? (types.split(',') as Array<
          'patient' | 'consultation' | 'appointment' | 'template' | 'service'
        >)
      : undefined;

    return this.searchService.search(tenantId, query, {
      types: typeArray,
      limit: limit || 20,
    });
  }
}
