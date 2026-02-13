import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TenantContext } from '../../common/decorators';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, FileType } from '@doci/database';

export interface UploadedFile {
  id: string;
  url: string;
  path: string;
  name: string;
  size: number;
  mimeType: string;
}

// Map MIME types to FileType enum
function getFileType(mimeType: string): FileType {
  if (mimeType.startsWith('image/')) {
    return 'IMAGE';
  }
  if (mimeType === 'application/pdf') {
    return 'DOCUMENT';
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return 'DOCUMENT';
  }
  return 'OTHER';
}

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private bucketName = 'medical-files';

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not configured. Storage features will be disabled.');
      this.supabase = null as unknown as SupabaseClient;
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  private ensureSupabase() {
    if (!this.supabase) {
      throw new BadRequestException('Storage service is not configured');
    }
  }

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    ctx: TenantContext,
    file: Express.Multer.File,
    options: {
      patientId: string;
      fileType?: FileType;
      description?: string;
    },
  ): Promise<UploadedFile> {
    this.ensureSupabase();

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, WebP), PDFs y documentos Word.',
      );
    }

    // Max file size: 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo excede el tamaño máximo de 10MB');
    }

    // Verify patient belongs to tenant
    const patient = await this.prisma.patient.findFirst({
      where: {
        id: options.patientId,
        tenantId: ctx.tenantId,
      },
    });

    if (!patient) {
      throw new BadRequestException('Paciente no encontrado');
    }

    // Generate unique path: tenant/patient/timestamp-filename
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${ctx.tenantId}/${options.patientId}/${timestamp}-${sanitizedName}`;

    // Upload to Supabase
    const { error: uploadError } = await this.supabase.storage
      .from(this.bucketName)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new BadRequestException('Error al subir el archivo');
    }

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);

    // Determine file type
    const fileType = options.fileType || getFileType(file.mimetype);

    // Save file record in database
    const patientFile = await this.prisma.patientFile.create({
      data: {
        patientId: options.patientId,
        name: file.originalname,
        description: options.description,
        type: fileType,
        mimeType: file.mimetype,
        storagePath: path,
        storageUrl: urlData.publicUrl,
        sizeMb: file.size / (1024 * 1024),
        uploadedBy: ctx.userId,
      },
    });

    // Update tenant storage usage
    await this.prisma.tenant.update({
      where: { id: ctx.tenantId },
      data: {
        storageUsedMb: {
          increment: file.size / (1024 * 1024),
        },
      },
    });

    return {
      id: patientFile.id,
      url: urlData.publicUrl,
      path,
      name: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * Get all files for a patient
   */
  async getPatientFiles(
    ctx: TenantContext,
    patientId: string,
    options?: { type?: FileType },
  ) {
    // Verify patient belongs to tenant
    const patient = await this.prisma.patient.findFirst({
      where: {
        id: patientId,
        tenantId: ctx.tenantId,
      },
    });

    if (!patient) {
      throw new BadRequestException('Paciente no encontrado');
    }

    const where: Prisma.PatientFileWhereInput = {
      patientId,
    };

    if (options?.type) {
      where.type = options.type;
    }

    const files = await this.prisma.patientFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return files;
  }

  /**
   * Get a single file
   */
  async getFile(ctx: TenantContext, fileId: string) {
    const file = await this.prisma.patientFile.findFirst({
      where: { id: fileId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            tenantId: true,
          },
        },
      },
    });

    if (!file || file.patient.tenantId !== ctx.tenantId) {
      throw new BadRequestException('Archivo no encontrado');
    }

    return file;
  }

  /**
   * Delete a file
   */
  async deleteFile(ctx: TenantContext, fileId: string) {
    this.ensureSupabase();

    const file = await this.getFile(ctx, fileId);

    // Delete from Supabase
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([file.storagePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new BadRequestException('Error al eliminar el archivo');
    }

    // Delete from database
    await this.prisma.patientFile.delete({
      where: { id: fileId },
    });

    // Update tenant storage usage
    await this.prisma.tenant.update({
      where: { id: ctx.tenantId },
      data: {
        storageUsedMb: {
          decrement: file.sizeMb,
        },
      },
    });

    return { success: true };
  }

  /**
   * Get signed URL for private file access
   */
  async getSignedUrl(ctx: TenantContext, fileId: string, expiresIn = 3600) {
    this.ensureSupabase();

    const file = await this.getFile(ctx, fileId);

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUrl(file.storagePath, expiresIn);

    if (error) {
      throw new BadRequestException('Error al generar URL de acceso');
    }

    return { url: data.signedUrl, expiresIn };
  }

  /**
   * Get storage usage for tenant
   */
  async getStorageUsage(ctx: TenantContext) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: {
        storageUsedMb: true,
        storageLimitMb: true,
      },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant no encontrado');
    }

    return {
      usedMb: tenant.storageUsedMb,
      limitMb: tenant.storageLimitMb,
      usedPercentage: (tenant.storageUsedMb / tenant.storageLimitMb) * 100,
      availableMb: tenant.storageLimitMb - tenant.storageUsedMb,
    };
  }
}
