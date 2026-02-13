import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { ClerkAuthGuard } from '../../common/guards';
import { TenantId } from '../../common/decorators';

@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get all files for a patient' })
  async getPatientFiles(@TenantId() tenantId: string, @Param('patientId') patientId: string) {
    return this.filesService.getPatientFiles(tenantId, patientId);
  }

  @Get('patient/:patientId/type/:type')
  @ApiOperation({ summary: 'Get files by type for a patient' })
  async getFilesByType(
    @TenantId() tenantId: string,
    @Param('patientId') patientId: string,
    @Param('type') type: 'LAB_RESULT' | 'IMAGING' | 'DOCUMENT' | 'PRESCRIPTION' | 'OTHER',
  ) {
    return this.filesService.getFilesByType(tenantId, patientId, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file details' })
  async getFile(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.filesService.getFile(tenantId, id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get download URL for a file' })
  async getDownloadUrl(@TenantId() tenantId: string, @Param('id') id: string) {
    const url = await this.filesService.getDownloadUrl(tenantId, id);
    return { url };
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file for a patient' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @TenantId() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('patientId') patientId: string,
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('type') type: 'LAB_RESULT' | 'IMAGING' | 'DOCUMENT' | 'PRESCRIPTION' | 'OTHER',
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!patientId) {
      throw new BadRequestException('Patient ID is required');
    }

    return this.filesService.uploadFile(tenantId, {
      patientId,
      name: name || file.originalname,
      description,
      type: type || 'OTHER',
      mimeType: file.mimetype,
      buffer: file.buffer,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.filesService.deleteFile(tenantId, id);
  }
}
