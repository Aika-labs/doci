import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export interface UploadFileDto {
  patientId: string;
  name: string;
  description?: string;
  type: 'LAB_RESULT' | 'IMAGING' | 'DOCUMENT' | 'PRESCRIPTION' | 'OTHER';
  mimeType: string;
  buffer: Buffer;
}

// ============================================
// Service
// ============================================

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly supabase: SupabaseClient;
  private readonly bucket = 'patient-files';

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
   * Upload a file for a patient
   */
  async uploadFile(tenantId: string, data: UploadFileDto) {
    // Verify patient belongs to tenant
    const patient = await this.prisma.patient.findFirst({
      where: { id: data.patientId, tenantId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Generate storage path
    const timestamp = Date.now();
    const sanitizedName = data.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${tenantId}/${data.patientId}/${timestamp}-${sanitizedName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await this.supabase.storage
      .from(this.bucket)
      .upload(storagePath, data.buffer, {
        contentType: data.mimeType,
        upsert: false,
      });

    if (uploadError) {
      this.logger.error(`Upload failed: ${uploadError.message}`);
      throw new BadRequestException('Failed to upload file');
    }

    // Get file size
    const sizeMb = data.buffer.length / (1024 * 1024);

    // Create database record
    const file = await this.prisma.patientFile.create({
      data: {
        patientId: data.patientId,
        name: data.name,
        description: data.description,
        type: data.type,
        mimeType: data.mimeType,
        storagePath,
        sizeMb,
      },
    });

    // Update tenant storage usage
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        storageUsedMb: { increment: sizeMb },
      },
    });

    return file;
  }

  /**
   * Get files for a patient
   */
  async getPatientFiles(tenantId: string, patientId: string) {
    // Verify patient belongs to tenant
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.prisma.patientFile.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single file
   */
  async getFile(tenantId: string, fileId: string) {
    const file = await this.prisma.patientFile.findUnique({
      where: { id: fileId },
      include: { patient: { select: { tenantId: true } } },
    });

    if (!file || file.patient.tenantId !== tenantId) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  /**
   * Get download URL for a file
   */
  async getDownloadUrl(tenantId: string, fileId: string): Promise<string> {
    const file = await this.getFile(tenantId, fileId);

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(file.storagePath, 3600); // 1 hour expiry

    if (error) {
      throw new BadRequestException('Failed to generate download URL');
    }

    return data.signedUrl;
  }

  /**
   * Delete a file
   */
  async deleteFile(tenantId: string, fileId: string) {
    const file = await this.getFile(tenantId, fileId);

    // Delete from storage
    const { error } = await this.supabase.storage.from(this.bucket).remove([file.storagePath]);

    if (error) {
      this.logger.error(`Failed to delete from storage: ${error.message}`);
    }

    // Delete database record
    await this.prisma.patientFile.delete({
      where: { id: fileId },
    });

    // Update tenant storage usage
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        storageUsedMb: { decrement: file.sizeMb },
      },
    });

    return { success: true };
  }

  /**
   * Get files by type
   */
  async getFilesByType(
    tenantId: string,
    patientId: string,
    type: 'LAB_RESULT' | 'IMAGING' | 'DOCUMENT' | 'PRESCRIPTION' | 'OTHER'
  ) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.prisma.patientFile.findMany({
      where: { patientId, type },
      orderBy: { createdAt: 'desc' },
    });
  }
}
