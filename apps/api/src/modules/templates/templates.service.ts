import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/decorators';
import { Prisma } from '@doci/database';

export interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' | 'time' | 'radio';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: string | number | boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  section?: string;
  order?: number;
}

export interface CreateTemplateDto {
  name: string;
  description?: string;
  specialty?: string;
  schema: TemplateField[];
  aiPrompt?: string;
  isDefault?: boolean;
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  specialty?: string;
  schema?: TemplateField[];
  aiPrompt?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(ctx: TenantContext, params?: { specialty?: string; isActive?: boolean }) {
    const where: Prisma.ClinicalTemplateWhereInput = {
      tenantId: ctx.tenantId,
    };

    if (params?.specialty) {
      where.specialty = params.specialty;
    }

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    return this.prisma.clinicalTemplate.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(ctx: TenantContext, id: string) {
    const template = await this.prisma.clinicalTemplate.findFirst({
      where: {
        id,
        tenantId: ctx.tenantId,
      },
    });

    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    return template;
  }

  async findBySpecialty(ctx: TenantContext, specialty: string) {
    return this.prisma.clinicalTemplate.findMany({
      where: {
        tenantId: ctx.tenantId,
        specialty,
        isActive: true,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async getDefault(ctx: TenantContext, specialty?: string) {
    const where: Prisma.ClinicalTemplateWhereInput = {
      tenantId: ctx.tenantId,
      isDefault: true,
      isActive: true,
    };

    if (specialty) {
      where.specialty = specialty;
    }

    const template = await this.prisma.clinicalTemplate.findFirst({
      where,
    });

    // If no default found, return first active template
    if (!template) {
      return this.prisma.clinicalTemplate.findFirst({
        where: {
          tenantId: ctx.tenantId,
          isActive: true,
          ...(specialty && { specialty }),
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    return template;
  }

  async create(ctx: TenantContext, data: CreateTemplateDto) {
    // Check for duplicate name
    const existing = await this.prisma.clinicalTemplate.findFirst({
      where: {
        tenantId: ctx.tenantId,
        name: data.name,
      },
    });

    if (existing) {
      throw new ConflictException('Ya existe una plantilla con ese nombre');
    }

    // If this is set as default, unset other defaults for same specialty
    if (data.isDefault) {
      await this.prisma.clinicalTemplate.updateMany({
        where: {
          tenantId: ctx.tenantId,
          specialty: data.specialty,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.clinicalTemplate.create({
      data: {
        tenantId: ctx.tenantId,
        name: data.name,
        description: data.description,
        specialty: data.specialty,
        schema: data.schema as unknown as Prisma.InputJsonValue,
        aiPrompt: data.aiPrompt,
        isDefault: data.isDefault ?? false,
      },
    });
  }

  async update(ctx: TenantContext, id: string, data: UpdateTemplateDto) {
    await this.findOne(ctx, id);

    // Check for duplicate name if name is being changed
    if (data.name) {
      const existing = await this.prisma.clinicalTemplate.findFirst({
        where: {
          tenantId: ctx.tenantId,
          name: data.name,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Ya existe una plantilla con ese nombre');
      }
    }

    // If this is set as default, unset other defaults for same specialty
    if (data.isDefault) {
      const template = await this.findOne(ctx, id);
      await this.prisma.clinicalTemplate.updateMany({
        where: {
          tenantId: ctx.tenantId,
          specialty: data.specialty ?? template.specialty,
          isDefault: true,
          NOT: { id },
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.clinicalTemplate.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.specialty !== undefined && { specialty: data.specialty }),
        ...(data.schema && { schema: data.schema as unknown as Prisma.InputJsonValue }),
        ...(data.aiPrompt !== undefined && { aiPrompt: data.aiPrompt }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async delete(ctx: TenantContext, id: string) {
    // Verify template exists and belongs to tenant
    await this.findOne(ctx, id);

    // Check if template is in use
    const consultationsCount = await this.prisma.consultation.count({
      where: { templateId: id },
    });

    if (consultationsCount > 0) {
      // Soft delete by deactivating
      return this.prisma.clinicalTemplate.update({
        where: { id },
        data: { isActive: false },
      });
    }

    // Hard delete if not in use
    return this.prisma.clinicalTemplate.delete({
      where: { id },
    });
  }

  async duplicate(ctx: TenantContext, id: string, newName: string) {
    const template = await this.findOne(ctx, id);

    // Check for duplicate name
    const existing = await this.prisma.clinicalTemplate.findFirst({
      where: {
        tenantId: ctx.tenantId,
        name: newName,
      },
    });

    if (existing) {
      throw new ConflictException('Ya existe una plantilla con ese nombre');
    }

    return this.prisma.clinicalTemplate.create({
      data: {
        tenantId: ctx.tenantId,
        name: newName,
        description: template.description,
        specialty: template.specialty,
        schema: template.schema as Prisma.InputJsonValue,
        aiPrompt: template.aiPrompt,
        isDefault: false,
      },
    });
  }

  /**
   * Get predefined templates for common specialties
   */
  async seedDefaultTemplates(ctx: TenantContext) {
    const defaultTemplates: CreateTemplateDto[] = [
      {
        name: 'Consulta General',
        description: 'Plantilla estándar para consultas de medicina general',
        specialty: 'General',
        isDefault: true,
        schema: [
          { name: 'motivo_consulta', label: 'Motivo de consulta', type: 'textarea', required: true, section: 'Subjetivo' },
          { name: 'sintomas', label: 'Síntomas principales', type: 'textarea', required: true, section: 'Subjetivo' },
          { name: 'duracion', label: 'Duración de síntomas', type: 'text', required: false, section: 'Subjetivo' },
          { name: 'peso', label: 'Peso (kg)', type: 'number', required: false, section: 'Signos Vitales' },
          { name: 'talla', label: 'Talla (cm)', type: 'number', required: false, section: 'Signos Vitales' },
          { name: 'presion_sistolica', label: 'Presión sistólica', type: 'number', required: false, section: 'Signos Vitales' },
          { name: 'presion_diastolica', label: 'Presión diastólica', type: 'number', required: false, section: 'Signos Vitales' },
          { name: 'frecuencia_cardiaca', label: 'Frecuencia cardíaca', type: 'number', required: false, section: 'Signos Vitales' },
          { name: 'temperatura', label: 'Temperatura (°C)', type: 'number', required: false, section: 'Signos Vitales' },
          { name: 'exploracion_fisica', label: 'Exploración física', type: 'textarea', required: false, section: 'Objetivo' },
          { name: 'diagnostico', label: 'Diagnóstico', type: 'textarea', required: true, section: 'Evaluación' },
          { name: 'plan_tratamiento', label: 'Plan de tratamiento', type: 'textarea', required: true, section: 'Plan' },
        ],
        aiPrompt: 'Estructura la consulta en formato SOAP. Identifica síntomas, signos vitales anormales, y sugiere diagnósticos diferenciales basados en la información proporcionada.',
      },
      {
        name: 'Consulta Pediátrica',
        description: 'Plantilla para consultas pediátricas',
        specialty: 'Pediatría',
        isDefault: true,
        schema: [
          { name: 'motivo_consulta', label: 'Motivo de consulta', type: 'textarea', required: true, section: 'Subjetivo' },
          { name: 'sintomas', label: 'Síntomas reportados por padres', type: 'textarea', required: true, section: 'Subjetivo' },
          { name: 'alimentacion', label: 'Alimentación', type: 'select', options: ['Lactancia materna', 'Fórmula', 'Mixta', 'Alimentación complementaria'], required: false, section: 'Subjetivo' },
          { name: 'peso', label: 'Peso (kg)', type: 'number', required: true, section: 'Signos Vitales' },
          { name: 'talla', label: 'Talla (cm)', type: 'number', required: true, section: 'Signos Vitales' },
          { name: 'perimetro_cefalico', label: 'Perímetro cefálico (cm)', type: 'number', required: false, section: 'Signos Vitales' },
          { name: 'temperatura', label: 'Temperatura (°C)', type: 'number', required: false, section: 'Signos Vitales' },
          { name: 'desarrollo_psicomotor', label: 'Desarrollo psicomotor', type: 'textarea', required: false, section: 'Objetivo' },
          { name: 'exploracion_fisica', label: 'Exploración física', type: 'textarea', required: false, section: 'Objetivo' },
          { name: 'vacunas_al_dia', label: 'Vacunas al día', type: 'checkbox', required: false, section: 'Objetivo' },
          { name: 'diagnostico', label: 'Diagnóstico', type: 'textarea', required: true, section: 'Evaluación' },
          { name: 'plan_tratamiento', label: 'Plan de tratamiento', type: 'textarea', required: true, section: 'Plan' },
        ],
        aiPrompt: 'Estructura la consulta pediátrica en formato SOAP. Evalúa el crecimiento y desarrollo según percentiles. Identifica banderas rojas de desarrollo.',
      },
    ];

    const results = [];
    for (const template of defaultTemplates) {
      try {
        const created = await this.create(ctx, template);
        results.push(created);
      } catch {
        // Skip if already exists
      }
    }

    return results;
  }
}
