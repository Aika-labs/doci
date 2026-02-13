import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { CurrentTenant, TenantContext } from '../../common/decorators';
import { FileType } from '@doci/database';

@ApiTags('Storage')
@ApiBearerAuth()
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file for a patient' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @CurrentTenant() ctx: TenantContext,
    @UploadedFile() file: Express.Multer.File,
    @Body('patientId') patientId: string,
    @Body('fileType') fileType?: FileType,
    @Body('description') description?: string,
  ) {
    return this.storageService.uploadFile(ctx, file, {
      patientId,
      fileType,
      description,
    });
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get all files for a patient' })
  async getPatientFiles(
    @CurrentTenant() ctx: TenantContext,
    @Param('patientId') patientId: string,
    @Query('type') type?: FileType,
  ) {
    return this.storageService.getPatientFiles(ctx, patientId, { type });
  }

  @Get('file/:id')
  @ApiOperation({ summary: 'Get file details' })
  async getFile(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    return this.storageService.getFile(ctx, id);
  }

  @Get('file/:id/signed-url')
  @ApiOperation({ summary: 'Get signed URL for private file access' })
  async getSignedUrl(
    @CurrentTenant() ctx: TenantContext,
    @Param('id') id: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    return this.storageService.getSignedUrl(
      ctx,
      id,
      expiresIn ? parseInt(expiresIn, 10) : undefined,
    );
  }

  @Delete('file/:id')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(@CurrentTenant() ctx: TenantContext, @Param('id') id: string) {
    return this.storageService.deleteFile(ctx, id);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get storage usage for tenant' })
  async getStorageUsage(@CurrentTenant() ctx: TenantContext) {
    return this.storageService.getStorageUsage(ctx);
  }
}
