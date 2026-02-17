import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import OpenAI from 'openai';

// Dynamic import for pdf-parse (CommonJS module)
async function parsePDF(buffer: Buffer): Promise<{ text: string }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse');
  return pdfParse.default ? pdfParse.default(buffer) : pdfParse(buffer);
}

interface MedicamentoMetadata {
  presentaciones?: string[];
  dosisAdultos?: string;
  dosisPediatrica?: string;
  dosisGeriatrica?: string;
  contraindicaciones?: string[];
  interacciones?: Array<{ medicamento: string; efecto: string; severidad?: string }>;
  efectosAdversos?: string[];
  embarazoLactancia?: string;
  indicaciones?: string[];
  viaAdministracion?: string[];
  farmacocinetica?: string;
}

interface VademecumSearchResult {
  id: string;
  nombreGenerico: string;
  contenido: string;
  metadata: MedicamentoMetadata;
  similarity: number;
}

@Injectable()
export class VademecumService {
  private readonly logger = new Logger(VademecumService.name);
  private readonly openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * Ingest a PDF file containing vademecum data
   */
  async ingestPDF(
    fileBuffer: Buffer,
    fuente: string = 'PDF'
  ): Promise<{ processed: number; errors: number }> {
    this.logger.log('Starting PDF ingestion...');

    // Parse PDF
    const pdfData = await parsePDF(fileBuffer);
    const text = pdfData.text;

    // Split into medication sections (heuristic: look for patterns)
    const medicamentos = this.parseMedicamentosFromText(text);

    let processed = 0;
    let errors = 0;

    for (const med of medicamentos) {
      try {
        // Generate embedding
        const embedding = await this.generateEmbedding(med.contenido);

        // Insert into database using raw SQL for vector type
        await this.prisma.$executeRaw`
          INSERT INTO "Vademecum" (
            id, "nombreGenerico", "nombreComercial", "principioActivo", 
            "grupoTerapeutico", contenido, embedding, metadata, fuente, 
            "createdAt", "updatedAt"
          ) VALUES (
            ${this.generateCuid()},
            ${med.nombreGenerico},
            ${med.nombreComercial},
            ${med.principioActivo},
            ${med.grupoTerapeutico},
            ${med.contenido},
            ${embedding}::vector,
            ${JSON.stringify(med.metadata)}::jsonb,
            ${fuente},
            NOW(),
            NOW()
          )
          ON CONFLICT ("nombreGenerico") DO UPDATE SET
            contenido = EXCLUDED.contenido,
            embedding = EXCLUDED.embedding,
            metadata = EXCLUDED.metadata,
            "updatedAt" = NOW()
        `;

        processed++;
        this.logger.log(`Processed: ${med.nombreGenerico}`);
      } catch (error) {
        this.logger.error(`Error processing ${med.nombreGenerico}: ${error}`);
        errors++;
      }
    }

    this.logger.log(`Ingestion complete: ${processed} processed, ${errors} errors`);
    return { processed, errors };
  }

  /**
   * Search vademecum using semantic similarity
   */
  async search(query: string, limit: number = 5): Promise<VademecumSearchResult[]> {
    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(query);

    // Search using cosine similarity
    const results = await this.prisma.$queryRaw<VademecumSearchResult[]>`
      SELECT 
        id,
        "nombreGenerico",
        contenido,
        metadata,
        1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM "Vademecum"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT ${limit}
    `;

    return results.filter((r) => r.similarity > 0.5);
  }

  /**
   * Get medication info by name (exact or fuzzy)
   */
  async getMedicamento(nombre: string): Promise<VademecumSearchResult | null> {
    // Try exact match first
    const exact = await this.prisma.$queryRaw<VademecumSearchResult[]>`
      SELECT 
        id,
        "nombreGenerico",
        contenido,
        metadata,
        1.0 as similarity
      FROM "Vademecum"
      WHERE LOWER("nombreGenerico") = LOWER(${nombre})
      OR ${nombre} = ANY("nombreComercial")
      LIMIT 1
    `;

    if (exact.length > 0) {
      return exact[0];
    }

    // Fall back to semantic search
    const semantic = await this.search(nombre, 1);
    return semantic.length > 0 ? semantic[0] : null;
  }

  /**
   * Check drug interactions
   */
  async checkInteractions(
    medicamentos: string[]
  ): Promise<
    Array<{ medicamento1: string; medicamento2: string; efecto: string; severidad: string }>
  > {
    const interactions: Array<{
      medicamento1: string;
      medicamento2: string;
      efecto: string;
      severidad: string;
    }> = [];

    for (const med of medicamentos) {
      const info = await this.getMedicamento(med);
      if (!info?.metadata?.interacciones) continue;

      for (const interaccion of info.metadata.interacciones) {
        // Check if the interacting drug is in our list
        const interactingDrug = medicamentos.find(
          (m) =>
            m.toLowerCase() !== med.toLowerCase() &&
            (m.toLowerCase().includes(interaccion.medicamento.toLowerCase()) ||
              interaccion.medicamento.toLowerCase().includes(m.toLowerCase()))
        );

        if (interactingDrug) {
          interactions.push({
            medicamento1: med,
            medicamento2: interactingDrug,
            efecto: interaccion.efecto,
            severidad: interaccion.severidad || 'moderada',
          });
        }
      }
    }

    // Remove duplicates
    const unique = interactions.filter(
      (item, index, self) =>
        index ===
        self.findIndex(
          (t) =>
            (t.medicamento1 === item.medicamento1 && t.medicamento2 === item.medicamento2) ||
            (t.medicamento1 === item.medicamento2 && t.medicamento2 === item.medicamento1)
        )
    );

    return unique;
  }

  /**
   * Build context string for AI prompts
   */
  async buildContextForAI(medicamentos: string[]): Promise<string> {
    const contexts: string[] = [];

    for (const med of medicamentos) {
      const info = await this.getMedicamento(med);
      if (info) {
        contexts.push(`## ${info.nombreGenerico}\n${info.contenido}`);
      }
    }

    // Check interactions
    const interactions = await this.checkInteractions(medicamentos);
    if (interactions.length > 0) {
      contexts.push('\n## ALERTAS DE INTERACCIONES');
      for (const i of interactions) {
        contexts.push(
          `⚠️ ${i.medicamento1} + ${i.medicamento2}: ${i.efecto} (Severidad: ${i.severidad})`
        );
      }
    }

    return contexts.join('\n\n');
  }

  /**
   * Get all medications (paginated)
   */
  async findAll(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.$queryRaw`
        SELECT id, "nombreGenerico", "nombreComercial", "grupoTerapeutico", metadata
        FROM "Vademecum"
        ORDER BY "nombreGenerico"
        LIMIT ${limit} OFFSET ${skip}
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM "Vademecum"
      `,
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total: Number(total[0].count),
        totalPages: Math.ceil(Number(total[0].count) / limit),
      },
    };
  }

  // ============================================
  // Private helpers
  // ============================================

  private async generateEmbedding(text: string): Promise<string> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.slice(0, 8000), // Limit to avoid token limits
    });

    // Return as string for raw SQL
    return `[${response.data[0].embedding.join(',')}]`;
  }

  private parseMedicamentosFromText(text: string): Array<{
    nombreGenerico: string;
    nombreComercial: string[];
    principioActivo: string | null;
    grupoTerapeutico: string | null;
    contenido: string;
    metadata: MedicamentoMetadata;
  }> {
    const medicamentos: Array<{
      nombreGenerico: string;
      nombreComercial: string[];
      principioActivo: string | null;
      grupoTerapeutico: string | null;
      contenido: string;
      metadata: MedicamentoMetadata;
    }> = [];

    // Split by common patterns (this is heuristic and may need adjustment)
    // Pattern 1: Look for drug names in CAPS followed by content
    const sections = text.split(/\n(?=[A-ZÁÉÍÓÚÑ]{3,}(?:\s+[A-ZÁÉÍÓÚÑ]+)*\s*\n)/);

    for (const section of sections) {
      if (section.trim().length < 50) continue;

      const lines = section.trim().split('\n');
      const nombreGenerico = lines[0]?.trim() || '';

      if (!nombreGenerico || nombreGenerico.length < 3) continue;

      // Extract metadata using patterns
      const metadata = this.extractMetadataFromSection(section);

      // Build full content for embedding
      const contenido = this.buildContenidoFromSection(nombreGenerico, section, metadata);

      medicamentos.push({
        nombreGenerico: nombreGenerico.toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
        nombreComercial: this.extractNombresComerciales(section),
        principioActivo: this.extractField(section, /principio\s*activo[:\s]+([^\n]+)/i),
        grupoTerapeutico: this.extractField(section, /grupo\s*terap[eé]utico[:\s]+([^\n]+)/i),
        contenido,
        metadata,
      });
    }

    return medicamentos;
  }

  private extractMetadataFromSection(section: string): MedicamentoMetadata {
    return {
      indicaciones: this.extractList(
        section,
        /indicaciones?[:\s]+([^]*?)(?=contraindicaciones?|dosis|$)/i
      ),
      contraindicaciones: this.extractList(
        section,
        /contraindicaciones?[:\s]+([^]*?)(?=interacciones?|efectos|$)/i
      ),
      efectosAdversos: this.extractList(
        section,
        /efectos?\s*(?:adversos?|secundarios?)[:\s]+([^]*?)(?=interacciones?|dosis|$)/i
      ),
      dosisAdultos: this.extractField(section, /dosis\s*(?:adultos?)?[:\s]+([^\n]+)/i) || undefined,
      dosisPediatrica:
        this.extractField(section, /dosis\s*pedi[aá]trica[:\s]+([^\n]+)/i) || undefined,
      embarazoLactancia: this.extractField(section, /embarazo[:\s]+([^\n]+)/i) || undefined,
      interacciones: this.extractInteracciones(section),
    };
  }

  private buildContenidoFromSection(
    nombre: string,
    section: string,
    metadata: MedicamentoMetadata
  ): string {
    const parts = [`Medicamento: ${nombre}`];

    if (metadata.indicaciones?.length) {
      parts.push(`\nINDICACIONES:\n${metadata.indicaciones.join('\n')}`);
    }

    if (metadata.dosisAdultos) {
      parts.push(`\nDOSIS ADULTOS: ${metadata.dosisAdultos}`);
    }

    if (metadata.dosisPediatrica) {
      parts.push(`\nDOSIS PEDIÁTRICA: ${metadata.dosisPediatrica}`);
    }

    if (metadata.contraindicaciones?.length) {
      parts.push(`\nCONTRAINDICACIONES:\n${metadata.contraindicaciones.join('\n')}`);
    }

    if (metadata.interacciones?.length) {
      parts.push(
        `\nINTERACCIONES:\n${metadata.interacciones.map((i) => `- ${i.medicamento}: ${i.efecto}`).join('\n')}`
      );
    }

    if (metadata.efectosAdversos?.length) {
      parts.push(`\nEFECTOS ADVERSOS:\n${metadata.efectosAdversos.join(', ')}`);
    }

    if (metadata.embarazoLactancia) {
      parts.push(`\nEMBARAZO/LACTANCIA: ${metadata.embarazoLactancia}`);
    }

    return parts.join('\n');
  }

  private extractField(text: string, pattern: RegExp): string | null {
    const match = text.match(pattern);
    return match ? match[1].trim() : null;
  }

  private extractList(text: string, pattern: RegExp): string[] {
    const match = text.match(pattern);
    if (!match) return [];

    return match[1]
      .split(/[•\-\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 3);
  }

  private extractNombresComerciales(text: string): string[] {
    const match = text.match(/nombres?\s*comerciales?[:\s]+([^\n]+)/i);
    if (!match) return [];

    return match[1]
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1);
  }

  private extractInteracciones(
    text: string
  ): Array<{ medicamento: string; efecto: string; severidad?: string }> {
    const interacciones: Array<{ medicamento: string; efecto: string; severidad?: string }> = [];

    const match = text.match(/interacciones?[:\s]+([^]*?)(?=efectos|dosis|$)/i);
    if (!match) return interacciones;

    const lines = match[1].split(/[•\-\n]/).filter((s) => s.trim().length > 5);

    for (const line of lines) {
      // Try to parse "Drug: effect" or "Drug - effect" patterns
      const parts = line.split(/[:\-–]/);
      if (parts.length >= 2) {
        interacciones.push({
          medicamento: parts[0].trim(),
          efecto: parts.slice(1).join(' ').trim(),
        });
      }
    }

    return interacciones;
  }

  private generateCuid(): string {
    // Simple cuid-like generator
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `c${timestamp}${random}`;
  }
}
