import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PatientsService } from '../patients/patients.service';
import { TenantContext } from '../../common/decorators';
import type { SOAPNotes, Diagnosis, AISuggestion } from '@doci/shared';

@Injectable()
export class AIService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private patientsService: PatientsService
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * Transcribe audio using Whisper API
   */
  async transcribe(
    audioBuffer: Buffer,
    language: string = 'es'
  ): Promise<{
    text: string;
    confidence: number;
    duration: number;
  }> {
    // Convert Buffer to Uint8Array for File constructor compatibility
    const uint8Array = new Uint8Array(audioBuffer);
    const file = new File([uint8Array], 'audio.webm', { type: 'audio/webm' });

    const response = await this.openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language,
      response_format: 'verbose_json',
    });

    return {
      text: response.text,
      confidence: 0.95, // Whisper doesn't return confidence, using default
      duration: response.duration || 0,
    };
  }

  /**
   * Structure transcription into SOAP notes using GPT-4o with patient context
   */
  async structureNotes(
    ctx: TenantContext,
    transcription: string,
    patientId: string,
    options?: {
      templateId?: string;
      includeHistory?: boolean;
    }
  ): Promise<{
    soapNotes: SOAPNotes;
    suggestedDiagnoses: Diagnosis[];
    suggestions: AISuggestion[];
  }> {
    // Get patient context for better AI results
    let patientContext = '';
    if (options?.includeHistory !== false) {
      const patientData = await this.patientsService.getPatientContext(ctx, patientId);
      if (patientData) {
        patientContext = this.buildPatientContextFromSummary(patientData);
      }
    }

    const systemPrompt = `Eres un asistente médico experto. Tu tarea es estructurar las notas clínicas dictadas por el médico en formato SOAP (Subjetivo, Objetivo, Análisis, Plan).

REGLAS:
1. Extrae información relevante del dictado y organízala en las secciones SOAP
2. Si el médico menciona síntomas, van en Subjetivo
3. Si menciona hallazgos del examen físico, van en Objetivo
4. Si menciona diagnósticos o evaluaciones, van en Análisis
5. Si menciona tratamientos, medicamentos o seguimiento, van en Plan
6. Sugiere códigos CIE-10 basados en los diagnósticos mencionados
7. Identifica alertas importantes (alergias, interacciones, etc.)

${patientContext ? `CONTEXTO DEL PACIENTE:\n${patientContext}\n` : ''}

Responde SOLO en formato JSON con esta estructura:
{
  "soapNotes": {
    "subjective": "string",
    "objective": "string",
    "assessment": "string",
    "plan": "string"
  },
  "suggestedDiagnoses": [
    { "code": "CIE-10", "description": "string", "type": "primary|secondary" }
  ],
  "suggestions": [
    { "type": "diagnosis|medication|procedure|warning", "content": "string", "confidence": 0.0-1.0 }
  ]
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Dictado del médico:\n\n${transcription}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    return JSON.parse(content);
  }

  /**
   * Generate a summary of patient history
   */
  async generatePatientSummary(ctx: TenantContext, patientId: string): Promise<string> {
    const patientData = await this.patientsService.getPatientContext(ctx, patientId);
    if (!patientData) {
      throw new Error('Patient not found');
    }

    const patientContext = this.buildPatientContextFromSummary(patientData);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente médico. Genera un resumen ejecutivo conciso del historial del paciente para que el médico lo revise antes de la consulta. Incluye:
1. Datos demográficos relevantes
2. Condiciones crónicas y alergias
3. Medicamentos actuales
4. Resumen de las últimas consultas
5. Patrones o tendencias importantes

Sé conciso pero completo. Usa viñetas para facilitar la lectura.`,
        },
        { role: 'user', content: patientContext },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || 'No se pudo generar el resumen';
  }

  /**
   * Build patient context string from the summary returned by getPatientContext
   */
  private buildPatientContextFromSummary(data: {
    patient: {
      id: string;
      name: string;
      age: number | null;
      gender: string | null;
      bloodType: string | null;
      allergies: unknown;
      chronicConditions: unknown;
      currentMedications: unknown;
    };
    recentConsultations: Array<{
      date: Date;
      diagnoses: unknown;
      vitalSigns: unknown;
      soapNotes: unknown;
    }>;
  }): string {
    const lines: string[] = [];
    const { patient, recentConsultations } = data;

    lines.push(`Paciente: ${patient.name}`);
    if (patient.age !== null) {
      lines.push(`Edad: ${patient.age} años`);
    }
    if (patient.gender) lines.push(`Género: ${patient.gender}`);
    if (patient.bloodType) lines.push(`Tipo de sangre: ${patient.bloodType}`);

    if (patient.allergies && Array.isArray(patient.allergies) && patient.allergies.length > 0) {
      lines.push(`\nALERGIAS (IMPORTANTE):`);
      for (const allergy of patient.allergies) {
        const a = allergy as { allergen: string; severity: string };
        lines.push(`- ${a.allergen} (${a.severity})`);
      }
    }

    if (patient.chronicConditions && Array.isArray(patient.chronicConditions)) {
      lines.push(`\nCondiciones crónicas:`);
      for (const condition of patient.chronicConditions) {
        const c = condition as { condition: string };
        lines.push(`- ${c.condition}`);
      }
    }

    if (patient.currentMedications && Array.isArray(patient.currentMedications)) {
      lines.push(`\nMedicamentos actuales:`);
      for (const med of patient.currentMedications) {
        const m = med as { name: string; dose: string; frequency: string };
        lines.push(`- ${m.name} ${m.dose} (${m.frequency})`);
      }
    }

    if (recentConsultations && recentConsultations.length > 0) {
      lines.push(`\nÚltimas ${recentConsultations.length} consultas:`);
      for (const consultation of recentConsultations) {
        const date = new Date(consultation.date).toLocaleDateString('es');
        const soap = consultation.soapNotes as { assessment?: string } | null;
        lines.push(`- ${date}: ${soap?.assessment || 'Sin diagnóstico registrado'}`);
      }
    }

    return lines.join('\n');
  }
}
