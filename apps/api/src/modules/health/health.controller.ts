import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  checks: {
    database: { status: 'ok' | 'error'; latencyMs?: number; error?: string };
  };
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  async check(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();

    // Check database connectivity
    let dbStatus: HealthStatus['checks']['database'];
    try {
      const start = Date.now();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PrismaService type not available without generated client
      await (this.prisma as any).$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - start;
      dbStatus = { status: 'ok', latencyMs };
    } catch (error) {
      dbStatus = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }

    const overallStatus = dbStatus.status === 'ok' ? 'ok' : 'degraded';

    return {
      status: overallStatus,
      timestamp,
      uptime,
      checks: {
        database: dbStatus,
      },
    };
  }
}
