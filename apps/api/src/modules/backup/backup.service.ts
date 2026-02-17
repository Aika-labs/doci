import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface BackupMetadata {
  id: string;
  tenantId?: string;
  type: 'full' | 'incremental' | 'tenant';
  status: 'pending' | 'running' | 'completed' | 'failed';
  size?: number;
  path?: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly supabase: SupabaseClient;
  private readonly backupBucket = 'backups';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_KEY') || ''
    );
  }

  /**
   * Daily full backup at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async scheduledFullBackup(): Promise<void> {
    this.logger.log('Starting scheduled full backup...');
    try {
      await this.createFullBackup();
      this.logger.log('Scheduled full backup completed');
    } catch (error) {
      this.logger.error(`Scheduled backup failed: ${error}`);
    }
  }

  /**
   * Weekly cleanup of old backups (keep last 30 days)
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOldBackups(): Promise<void> {
    this.logger.log('Starting backup cleanup...');
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // List old backups
      const { data: files, error } = await this.supabase.storage.from(this.backupBucket).list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'asc' },
      });

      if (error) throw error;

      // Delete old files
      const oldFiles = files?.filter((f) => {
        const createdAt = new Date(f.created_at);
        return createdAt < thirtyDaysAgo;
      });

      if (oldFiles && oldFiles.length > 0) {
        const { error: deleteError } = await this.supabase.storage
          .from(this.backupBucket)
          .remove(oldFiles.map((f) => f.name));

        if (deleteError) throw deleteError;
        this.logger.log(`Cleaned up ${oldFiles.length} old backups`);
      }
    } catch (error) {
      this.logger.error(`Backup cleanup failed: ${error}`);
    }
  }

  /**
   * Create a full database backup using pg_dump
   */
  async createFullBackup(): Promise<BackupMetadata> {
    const backupId = this.generateId();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `full-backup-${timestamp}.sql.gz`;
    const localPath = path.join('/tmp', filename);

    const metadata: BackupMetadata = {
      id: backupId,
      type: 'full',
      status: 'running',
      startedAt: new Date(),
    };

    try {
      // Get database URL
      const dbUrl = this.configService.get<string>('DIRECT_URL');
      if (!dbUrl) {
        throw new Error('DIRECT_URL not configured');
      }

      // Run pg_dump with compression
      const command = `pg_dump "${dbUrl}" --no-owner --no-acl | gzip > "${localPath}"`;
      await execAsync(command, { timeout: 600000 }); // 10 min timeout

      // Get file size
      const stats = fs.statSync(localPath);
      metadata.size = stats.size;

      // Upload to Supabase Storage
      const fileBuffer = fs.readFileSync(localPath);
      const { error: uploadError } = await this.supabase.storage
        .from(this.backupBucket)
        .upload(filename, fileBuffer, {
          contentType: 'application/gzip',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Cleanup local file
      fs.unlinkSync(localPath);

      metadata.status = 'completed';
      metadata.path = filename;
      metadata.completedAt = new Date();

      // Log to audit
      await this.logBackupEvent(metadata);

      return metadata;
    } catch (error) {
      metadata.status = 'failed';
      metadata.error = String(error);
      metadata.completedAt = new Date();

      // Cleanup local file if exists
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }

      await this.logBackupEvent(metadata);
      throw error;
    }
  }

  /**
   * Create a tenant-specific backup (data export)
   */
  async createTenantBackup(tenantId: string): Promise<BackupMetadata> {
    const backupId = this.generateId();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `tenant-${tenantId}-${timestamp}.json.gz`;
    const localPath = path.join('/tmp', filename);

    const metadata: BackupMetadata = {
      id: backupId,
      tenantId,
      type: 'tenant',
      status: 'running',
      startedAt: new Date(),
    };

    try {
      // Export tenant data
      const data = await this.exportTenantData(tenantId);

      // Compress and save
      const { gzipSync } = await import('zlib');
      const compressed = gzipSync(JSON.stringify(data, null, 2));
      fs.writeFileSync(localPath, compressed);

      metadata.size = compressed.length;

      // Upload to Supabase Storage
      const { error: uploadError } = await this.supabase.storage
        .from(this.backupBucket)
        .upload(`tenants/${filename}`, compressed, {
          contentType: 'application/gzip',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Cleanup local file
      fs.unlinkSync(localPath);

      metadata.status = 'completed';
      metadata.path = `tenants/${filename}`;
      metadata.completedAt = new Date();

      await this.logBackupEvent(metadata);

      return metadata;
    } catch (error) {
      metadata.status = 'failed';
      metadata.error = String(error);
      metadata.completedAt = new Date();

      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }

      await this.logBackupEvent(metadata);
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups(options?: { tenantId?: string; limit?: number }) {
    const { tenantId, limit = 50 } = options || {};

    const prefix = tenantId ? `tenants/tenant-${tenantId}` : '';

    const { data, error } = await this.supabase.storage.from(this.backupBucket).list(prefix, {
      limit,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) throw error;

    return data?.map((file) => ({
      name: file.name,
      size: file.metadata?.size,
      createdAt: file.created_at,
    }));
  }

  /**
   * Get a signed URL for backup download
   */
  async getBackupDownloadUrl(filename: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.backupBucket)
      .createSignedUrl(filename, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  }

  /**
   * Restore from a tenant backup
   */
  async restoreTenantBackup(tenantId: string, filename: string): Promise<void> {
    this.logger.log(`Starting restore for tenant ${tenantId} from ${filename}`);

    // Download backup
    const { data, error } = await this.supabase.storage.from(this.backupBucket).download(filename);

    if (error) throw error;

    // Decompress
    const { gunzipSync } = await import('zlib');
    const buffer = Buffer.from(await data.arrayBuffer());
    const decompressed = gunzipSync(buffer);
    const backupData = JSON.parse(decompressed.toString());

    // Validate tenant ID matches
    if (backupData.tenantId !== tenantId) {
      throw new Error('Backup tenant ID does not match');
    }

    // Restore data (in a transaction)
    await this.prisma.$transaction(async (tx) => {
      // Restore patients
      if (backupData.patients?.length) {
        for (const patient of backupData.patients) {
          await tx.patient.upsert({
            where: { id: patient.id },
            create: patient,
            update: patient,
          });
        }
      }

      // Restore consultations
      if (backupData.consultations?.length) {
        for (const consultation of backupData.consultations) {
          await tx.consultation.upsert({
            where: { id: consultation.id },
            create: consultation,
            update: consultation,
          });
        }
      }

      // Restore appointments
      if (backupData.appointments?.length) {
        for (const appointment of backupData.appointments) {
          await tx.appointment.upsert({
            where: { id: appointment.id },
            create: appointment,
            update: appointment,
          });
        }
      }

      // Add more entity types as needed
    });

    this.logger.log(`Restore completed for tenant ${tenantId}`);
  }

  // ============================================
  // Private helpers
  // ============================================

  private async exportTenantData(tenantId: string) {
    const [patients, consultations, appointments, templates] = await Promise.all([
      this.prisma.patient.findMany({ where: { tenantId } }),
      this.prisma.consultation.findMany({
        where: { tenantId },
        include: { prescriptions: true },
      }),
      this.prisma.appointment.findMany({ where: { tenantId } }),
      this.prisma.clinicalTemplate.findMany({ where: { tenantId } }),
    ]);

    return {
      tenantId,
      exportedAt: new Date().toISOString(),
      version: '1.0',
      patients,
      consultations,
      appointments,
      templates,
    };
  }

  private async logBackupEvent(metadata: BackupMetadata): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: metadata.tenantId || 'system',
          action: 'EXPORT',
          entity: 'Backup',
          entityId: metadata.id,
          metadata: {
            type: metadata.type,
            status: metadata.status,
            size: metadata.size,
            path: metadata.path,
            error: metadata.error,
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log backup event: ${error}`);
    }
  }

  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `bkp_${timestamp}${random}`;
  }
}
