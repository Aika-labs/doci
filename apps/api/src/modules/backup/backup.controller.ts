import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BackupService } from './backup.service';
import { ClerkAuthGuard } from '../../common/guards';
import { TenantId } from '../../common/decorators';

@ApiTags('Backup')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  @ApiOperation({ summary: 'List available backups' })
  async listBackups(@TenantId() tenantId: string, @Query('limit') limit?: number) {
    return this.backupService.listBackups({ tenantId, limit: limit || 50 });
  }

  @Post('tenant')
  @ApiOperation({ summary: 'Create a tenant-specific backup' })
  async createTenantBackup(@TenantId() tenantId: string) {
    return this.backupService.createTenantBackup(tenantId);
  }

  @Get('download/:filename')
  @ApiOperation({ summary: 'Get download URL for a backup' })
  async getDownloadUrl(
    @TenantId() tenantId: string,
    @Param('filename') filename: string,
  ) {
    // Validate filename belongs to tenant
    if (!filename.includes(tenantId) && !filename.startsWith('full-')) {
      throw new BadRequestException('Access denied to this backup');
    }

    const url = await this.backupService.getBackupDownloadUrl(filename);
    return { url };
  }

  @Post('restore/:filename')
  @ApiOperation({ summary: 'Restore from a tenant backup' })
  async restoreBackup(
    @TenantId() tenantId: string,
    @Param('filename') filename: string,
  ) {
    // Validate filename belongs to tenant
    if (!filename.includes(tenantId)) {
      throw new BadRequestException('Access denied to this backup');
    }

    await this.backupService.restoreTenantBackup(tenantId, filename);
    return { success: true, message: 'Restore completed' };
  }
}
