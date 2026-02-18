import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PDFParse } from 'pdf-parse';
import { PatientsService } from '../patients/patients.service';
import { TenantContext } from '../../common/decorators';
import type { SOAPNotes, Diagnosis, AISuggestion, AIAnalysis } from '@doci/shared';

/** Maximum characters of extracted PDF text to send to the model. */
const MAX_TEXT_LENGTH = 30_000;

/** MIME types that GPT-4o vision can process directly. */
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
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

  // ------------------------------------------------------------------
  // Document analysis (PDFs, images of lab results / clinical history)
  // ------------------------------------------------------------------

  /**
   * Analyse a medical document (PDF or image) and return a structured
   * summary with findings and confidence score.
   *
   * - PDFs: text is extracted with pdf-parse and sent as a text prompt.
   * - Images (JPEG/PNG/WebP/GIF): sent to GPT-4o vision for OCR + analysis.
   */
  async analyzeDocument(
    fileBuffer: Buffer,
    mimeType: string,
    options?: {
      /** Optional patient context to improve analysis accuracy. */
      patientContext?: string;
      /** Original file name for logging. */
      fileName?: string;
    }
  ): Promise<AIAnalysis> {
    const isImage = IMAGE_MIME_TYPES.has(mimeType);
    const isPdf = mimeType === 'application/pdf';

    if (!isImage && !isPdf) {
      throw new Error(
        `Tipo de archivo no soportado para análisis: ${mimeType}. ` +
          'Solo se admiten PDFs e imágenes (JPEG, PNG, WebP, GIF).'
      );
    }

    const systemPrompt = this.buildDocumentAnalysisPrompt(options?.patientContext);

    let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];

    if (isImage) {
      // Send image directly to GPT-4o vision
      const base64 = fileBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;

      messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analiza el siguiente documento médico (imagen):',
            },
            { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
          ],
        },
      ];
    } else {
      // Extract text from PDF
      const extractedText = await this.extractPdfText(fileBuffer);

      if (!extractedText || extractedText.trim().length === 0) {
        this.logger.warn(
          `PDF sin texto extraíble: ${options?.fileName ?? 'unknown'}. ` +
            'Puede ser un PDF escaneado sin capa de texto.'
        );
        return {
          summary:
            'No se pudo extraer texto del PDF. Es posible que sea un documento escaneado sin capa de texto. ' +
            'Intente subir una imagen del documento para análisis con visión artificial.',
          findings: [],
          confidence: 0,
        };
      }

      // Truncate if too long
      const text =
        extractedText.length > MAX_TEXT_LENGTH
          ? extractedText.slice(0, MAX_TEXT_LENGTH) +
            '\n\n[... documento truncado por longitud ...]'
          : extractedText;

      messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Analiza el siguiente documento médico:\n\n${text}`,
        },
      ];
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No se recibió respuesta del modelo de IA');
    }

    const parsed = JSON.parse(content) as AIAnalysis;

    return {
      summary: parsed.summary ?? 'Sin resumen disponible',
      findings: parsed.findings ?? [],
      confidence: parsed.confidence ?? 0,
    };
  }

  /**
   * Extract text content from a PDF buffer using pdf-parse v2.
   */
  private async extractPdfText(buffer: Buffer): Promise<string> {
    let parser: PDFParse | null = null;
    try {
      parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      return result.text;
    } catch (error) {
      this.logger.error('Error extrayendo texto del PDF', error);
      return '';
    } finally {
      if (parser) {
        await parser.destroy().catch(() => {});
      }
    }
  }

  /**
   * Build the system prompt for document analysis.
   */
  private buildDocumentAnalysisPrompt(patientContext?: string): string {
    return `Eres un asistente médico experto en análisis de documentos clínicos. Tu tarea es analizar documentos médicos (resultados de laboratorio, estudios de imagen, historias clínicas, recetas, etc.) y generar un resumen estructurado.

REGLAS:
1. Identifica el tipo de documento (resultado de laboratorio, estudio de imagen, historia clínica, receta, etc.)
2. Extrae los hallazgos más relevantes
3. Señala valores fuera de rango o hallazgos anormales
4. Proporciona una interpretación clínica concisa
5. Indica el nivel de confianza de tu análisis (0.0 a 1.0)
6. Si hay valores críticos o hallazgos urgentes, destácalos al inicio
7. Usa terminología médica apropiada pero incluye explicaciones comprensibles

${patientContext ? `CONTEXTO DEL PACIENTE:\n${patientContext}\n` : ''}

Responde SOLO en formato JSON con esta estructura:
{
  "summary": "Resumen general del documento y su interpretación clínica",
  "findings": [
    "Hallazgo 1: descripción detallada",
    "Hallazgo 2: descripción detallada"
  ],
  "confidence": 0.0-1.0
}`;
  }
}
