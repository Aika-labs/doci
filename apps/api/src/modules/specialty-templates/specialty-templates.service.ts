import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ============================================
// Default Specialty Templates
// ============================================

const DEFAULT_TEMPLATES = [
  {
    specialty: 'medicina_general',
    displayName: 'Medicina General',
    description: 'Plantilla para consultas de medicina general y familiar',
    schema: {
      sections: [
        { id: 'motivo', label: 'Motivo de consulta', type: 'text', required: true },
        { id: 'antecedentes', label: 'Antecedentes relevantes', type: 'textarea' },
        { id: 'exploracion', label: 'Exploración física', type: 'textarea' },
        { id: 'signos', label: 'Signos vitales', type: 'vitals' },
        { id: 'diagnostico', label: 'Diagnóstico', type: 'text', required: true },
        { id: 'tratamiento', label: 'Plan de tratamiento', type: 'textarea' },
      ],
    },
    aiPrompt:
      'Eres un asistente médico para consultas de medicina general. Estructura la información en formato SOAP. Incluye signos vitales, exploración física completa y plan de tratamiento detallado.',
    soapDefaults: {
      subjective: ['Motivo de consulta', 'Síntomas principales', 'Duración', 'Factores agravantes'],
      objective: ['Signos vitales', 'Exploración física', 'Hallazgos relevantes'],
      assessment: ['Diagnóstico principal', 'Diagnósticos diferenciales'],
      plan: ['Tratamiento farmacológico', 'Medidas generales', 'Seguimiento'],
    },
  },
  {
    specialty: 'pediatria',
    displayName: 'Pediatría',
    description: 'Plantilla especializada para consultas pediátricas',
    schema: {
      sections: [
        { id: 'motivo', label: 'Motivo de consulta', type: 'text', required: true },
        { id: 'desarrollo', label: 'Desarrollo psicomotor', type: 'checklist' },
        { id: 'alimentacion', label: 'Alimentación', type: 'textarea' },
        { id: 'vacunas', label: 'Esquema de vacunación', type: 'vaccines' },
        { id: 'antropometria', label: 'Antropometría', type: 'growth' },
        { id: 'exploracion', label: 'Exploración física', type: 'textarea' },
        { id: 'diagnostico', label: 'Diagnóstico', type: 'text', required: true },
        { id: 'tratamiento', label: 'Plan de tratamiento', type: 'textarea' },
      ],
    },
    aiPrompt:
      'Eres un asistente médico pediátrico. Incluye siempre: edad del paciente, peso, talla, percentiles de crecimiento, desarrollo psicomotor y esquema de vacunación. Calcula dosis pediátricas por kg de peso.',
    soapDefaults: {
      subjective: ['Motivo de consulta', 'Síntomas', 'Alimentación', 'Sueño', 'Desarrollo'],
      objective: ['Peso', 'Talla', 'PC', 'Percentiles', 'Exploración por sistemas'],
      assessment: ['Diagnóstico', 'Estado nutricional', 'Desarrollo'],
      plan: ['Tratamiento (dosis/kg)', 'Alimentación', 'Vacunas pendientes', 'Próxima cita'],
    },
  },
  {
    specialty: 'ginecologia',
    displayName: 'Ginecología y Obstetricia',
    description: 'Plantilla para consultas ginecológicas y control prenatal',
    schema: {
      sections: [
        { id: 'motivo', label: 'Motivo de consulta', type: 'text', required: true },
        { id: 'fum', label: 'FUM', type: 'date' },
        { id: 'antecedentes_go', label: 'Antecedentes G-O', type: 'obstetric' },
        { id: 'exploracion', label: 'Exploración ginecológica', type: 'textarea' },
        { id: 'ultrasonido', label: 'Ultrasonido', type: 'textarea' },
        { id: 'diagnostico', label: 'Diagnóstico', type: 'text', required: true },
        { id: 'tratamiento', label: 'Plan', type: 'textarea' },
      ],
    },
    aiPrompt:
      'Eres un asistente médico gineco-obstétrico. Incluye siempre: FUM, fórmula obstétrica (G-P-A-C), semanas de gestación si aplica, y resultados de estudios. Para embarazadas incluye altura uterina y FCF.',
    soapDefaults: {
      subjective: ['Motivo', 'FUM', 'Ciclos menstruales', 'Síntomas'],
      objective: ['Exploración ginecológica', 'Ultrasonido', 'Laboratorios'],
      assessment: ['Diagnóstico', 'SDG si embarazo'],
      plan: ['Tratamiento', 'Estudios', 'Próximo control'],
    },
  },
  {
    specialty: 'cardiologia',
    displayName: 'Cardiología',
    description: 'Plantilla para consultas cardiológicas',
    schema: {
      sections: [
        { id: 'motivo', label: 'Motivo de consulta', type: 'text', required: true },
        { id: 'factores_riesgo', label: 'Factores de riesgo CV', type: 'checklist' },
        { id: 'signos', label: 'Signos vitales', type: 'vitals' },
        { id: 'exploracion_cv', label: 'Exploración cardiovascular', type: 'textarea' },
        { id: 'ecg', label: 'ECG', type: 'textarea' },
        { id: 'ecocardiograma', label: 'Ecocardiograma', type: 'textarea' },
        { id: 'diagnostico', label: 'Diagnóstico', type: 'text', required: true },
        { id: 'tratamiento', label: 'Plan de tratamiento', type: 'textarea' },
      ],
    },
    aiPrompt:
      'Eres un asistente médico cardiólogo. Incluye siempre: factores de riesgo cardiovascular, TA en ambos brazos, frecuencia cardíaca, auscultación cardíaca detallada, y resultados de ECG/Eco si disponibles.',
    soapDefaults: {
      subjective: ['Síntomas cardiovasculares', 'Disnea', 'Dolor torácico', 'Palpitaciones'],
      objective: ['TA', 'FC', 'Auscultación', 'Pulsos', 'Edema', 'ECG', 'Eco'],
      assessment: ['Diagnóstico', 'Clase funcional NYHA', 'Riesgo CV'],
      plan: ['Medicamentos', 'Cambios estilo de vida', 'Estudios', 'Seguimiento'],
    },
  },
  {
    specialty: 'dermatologia',
    displayName: 'Dermatología',
    description: 'Plantilla para consultas dermatológicas',
    schema: {
      sections: [
        { id: 'motivo', label: 'Motivo de consulta', type: 'text', required: true },
        { id: 'evolucion', label: 'Tiempo de evolución', type: 'text' },
        { id: 'localizacion', label: 'Localización', type: 'body_map' },
        { id: 'descripcion', label: 'Descripción de lesiones', type: 'textarea' },
        { id: 'fotos', label: 'Fotografías clínicas', type: 'images' },
        { id: 'diagnostico', label: 'Diagnóstico', type: 'text', required: true },
        { id: 'tratamiento', label: 'Tratamiento', type: 'textarea' },
      ],
    },
    aiPrompt:
      'Eres un asistente médico dermatólogo. Describe las lesiones usando terminología dermatológica: tipo de lesión primaria/secundaria, distribución, configuración, color, tamaño. Incluye diagnósticos diferenciales.',
    soapDefaults: {
      subjective: ['Motivo', 'Evolución', 'Síntomas asociados', 'Tratamientos previos'],
      objective: ['Tipo de lesión', 'Localización', 'Distribución', 'Características'],
      assessment: ['Diagnóstico', 'Diferenciales'],
      plan: ['Tratamiento tópico', 'Tratamiento sistémico', 'Fotoprotección', 'Seguimiento'],
    },
  },
  {
    specialty: 'psiquiatria',
    displayName: 'Psiquiatría',
    description: 'Plantilla para consultas psiquiátricas',
    schema: {
      sections: [
        { id: 'motivo', label: 'Motivo de consulta', type: 'text', required: true },
        { id: 'historia', label: 'Historia de la enfermedad actual', type: 'textarea' },
        { id: 'examen_mental', label: 'Examen mental', type: 'mental_status' },
        { id: 'antecedentes_psiq', label: 'Antecedentes psiquiátricos', type: 'textarea' },
        { id: 'diagnostico', label: 'Diagnóstico (DSM-5/CIE-11)', type: 'text', required: true },
        { id: 'tratamiento', label: 'Plan de tratamiento', type: 'textarea' },
      ],
    },
    aiPrompt:
      'Eres un asistente médico psiquiatra. Realiza un examen mental completo: apariencia, conducta, habla, afecto, pensamiento, percepción, cognición, insight. Usa criterios DSM-5 o CIE-11 para diagnósticos.',
    soapDefaults: {
      subjective: ['Motivo', 'Síntomas', 'Ideación suicida/homicida', 'Sueño', 'Apetito'],
      objective: ['Examen mental completo', 'Escalas aplicadas'],
      assessment: ['Diagnóstico DSM-5/CIE-11', 'Riesgo suicida'],
      plan: ['Psicofarmacología', 'Psicoterapia', 'Hospitalización si aplica', 'Seguimiento'],
    },
  },
];

// ============================================
// Service
// ============================================

@Injectable()
export class SpecialtyTemplatesService {
  private readonly logger = new Logger(SpecialtyTemplatesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all specialty templates
   */
  async findAll() {
    return this.prisma.specialtyTemplate.findMany({
      where: { isActive: true },
      orderBy: { displayName: 'asc' },
    });
  }

  /**
   * Get a specialty template by specialty code
   */
  async findBySpecialty(specialty: string) {
    return this.prisma.specialtyTemplate.findUnique({
      where: { specialty },
    });
  }

  /**
   * Seed default templates (run once on setup)
   */
  async seedDefaults(): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    for (const template of DEFAULT_TEMPLATES) {
      const existing = await this.prisma.specialtyTemplate.findUnique({
        where: { specialty: template.specialty },
      });

      if (existing) {
        await this.prisma.specialtyTemplate.update({
          where: { specialty: template.specialty },
          data: {
            displayName: template.displayName,
            description: template.description,
            schema: template.schema,
            aiPrompt: template.aiPrompt,
            soapDefaults: template.soapDefaults,
          },
        });
        updated++;
      } else {
        await this.prisma.specialtyTemplate.create({
          data: template,
        });
        created++;
      }
    }

    this.logger.log(`Seeded specialty templates: ${created} created, ${updated} updated`);
    return { created, updated };
  }

  /**
   * Get AI prompt for a specialty
   */
  async getAIPrompt(specialty: string): Promise<string | null> {
    const template = await this.prisma.specialtyTemplate.findUnique({
      where: { specialty },
      select: { aiPrompt: true },
    });

    return template?.aiPrompt || null;
  }

  /**
   * Get SOAP defaults for a specialty
   */
  async getSOAPDefaults(specialty: string) {
    const template = await this.prisma.specialtyTemplate.findUnique({
      where: { specialty },
      select: { soapDefaults: true },
    });

    return template?.soapDefaults || null;
  }
}
