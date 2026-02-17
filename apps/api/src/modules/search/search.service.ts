import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ============================================
// Types
// ============================================

export interface SearchResult {
  type: 'patient' | 'consultation' | 'appointment' | 'template' | 'service';
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  score: number;
}

export interface SearchOptions {
  types?: Array<'patient' | 'consultation' | 'appointment' | 'template' | 'service'>;
  limit?: number;
}

// ============================================
// Service
// ============================================

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Global search across all entities
   */
  async search(tenantId: string, query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const { types, limit = 20 } = options || {};
    const searchTypes = types || ['patient', 'consultation', 'appointment', 'template', 'service'];

    const results: SearchResult[] = [];
    const searchTerm = `%${query.toLowerCase()}%`;

    // Search in parallel
    const searches = await Promise.all([
      searchTypes.includes('patient') ? this.searchPatients(tenantId, searchTerm, limit) : [],
      searchTypes.includes('consultation')
        ? this.searchConsultations(tenantId, searchTerm, limit)
        : [],
      searchTypes.includes('appointment')
        ? this.searchAppointments(tenantId, searchTerm, limit)
        : [],
      searchTypes.includes('template') ? this.searchTemplates(tenantId, searchTerm, limit) : [],
      searchTypes.includes('service') ? this.searchServices(tenantId, searchTerm, limit) : [],
    ]);

    // Flatten and sort by score
    results.push(...searches.flat());
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  /**
   * Search patients
   */
  private async searchPatients(
    tenantId: string,
    searchTerm: string,
    limit: number
  ): Promise<SearchResult[]> {
    const patients = await this.prisma.patient.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { firstName: { contains: searchTerm.replace(/%/g, ''), mode: 'insensitive' } },
          { lastName: { contains: searchTerm.replace(/%/g, ''), mode: 'insensitive' } },
          { email: { contains: searchTerm.replace(/%/g, ''), mode: 'insensitive' } },
          { phone: { contains: searchTerm.replace(/%/g, '') } },
          { nationalId: { contains: searchTerm.replace(/%/g, '') } },
        ],
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    return patients.map((p) => ({
      type: 'patient' as const,
      id: p.id,
      title: `${p.firstName} ${p.lastName}`,
      subtitle: p.email || p.phone || undefined,
      description: p.nationalId ? `ID: ${p.nationalId}` : undefined,
      metadata: {
        birthDate: p.birthDate,
        gender: p.gender,
      },
      score: this.calculateScore(searchTerm, `${p.firstName} ${p.lastName}`),
    }));
  }

  /**
   * Search consultations
   */
  private async searchConsultations(
    tenantId: string,
    searchTerm: string,
    limit: number
  ): Promise<SearchResult[]> {
    const consultations = await this.prisma.consultation.findMany({
      where: {
        tenantId,
        OR: [
          { aiSummary: { contains: searchTerm.replace(/%/g, ''), mode: 'insensitive' } },
          { aiTranscription: { contains: searchTerm.replace(/%/g, ''), mode: 'insensitive' } },
        ],
      },
      include: {
        patient: { select: { firstName: true, lastName: true } },
      },
      take: limit,
      orderBy: { startedAt: 'desc' },
    });

    return consultations.map((c) => ({
      type: 'consultation' as const,
      id: c.id,
      title: c.aiSummary?.slice(0, 50) || 'Consulta',
      subtitle: `${c.patient.firstName} ${c.patient.lastName}`,
      description: c.startedAt.toLocaleDateString('es-MX'),
      metadata: {
        date: c.startedAt,
        status: c.status,
      },
      score: this.calculateScore(searchTerm, c.aiSummary || ''),
    }));
  }

  /**
   * Search appointments
   */
  private async searchAppointments(
    tenantId: string,
    searchTerm: string,
    limit: number
  ): Promise<SearchResult[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        OR: [
          { reason: { contains: searchTerm.replace(/%/g, ''), mode: 'insensitive' } },
          { notes: { contains: searchTerm.replace(/%/g, ''), mode: 'insensitive' } },
        ],
      },
      include: {
        patient: { select: { firstName: true, lastName: true } },
      },
      take: limit,
      orderBy: { startTime: 'desc' },
    });

    return appointments.map((a) => ({
      type: 'appointment' as const,
      id: a.id,
      title: a.reason || 'Cita',
      subtitle: `${a.patient.firstName} ${a.patient.lastName}`,
      description: a.startTime.toLocaleDateString('es-MX'),
      metadata: {
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
      },
      score: this.calculateScore(searchTerm, a.reason || ''),
    }));
  }

  /**
   * Search templates
   */
  private async searchTemplates(
    tenantId: string,
    searchTerm: string,
    limit: number
  ): Promise<SearchResult[]> {
    const templates = await this.prisma.clinicalTemplate.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { name: { contains: searchTerm.replace(/%/g, ''), mode: 'insensitive' } },
          { description: { contains: searchTerm.replace(/%/g, ''), mode: 'insensitive' } },
          { specialty: { contains: searchTerm.replace(/%/g, ''), mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return templates.map((t) => ({
      type: 'template' as const,
      id: t.id,
      title: t.name,
      subtitle: t.specialty || undefined,
      description: t.description || undefined,
      metadata: {
        specialty: t.specialty,
      },
      score: this.calculateScore(searchTerm, t.name),
    }));
  }

  /**
   * Search services
   */
  private async searchServices(
    tenantId: string,
    searchTerm: string,
    limit: number
  ): Promise<SearchResult[]> {
    const services = await this.prisma.service.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { name: { contains: searchTerm.replace(/%/g, ''), mode: 'insensitive' } },
          { description: { contains: searchTerm.replace(/%/g, ''), mode: 'insensitive' } },
          { category: { contains: searchTerm.replace(/%/g, ''), mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return services.map((s) => ({
      type: 'service' as const,
      id: s.id,
      title: s.name,
      subtitle: s.category || undefined,
      description: `$${s.price.toNumber().toFixed(2)} ${s.currency}`,
      metadata: {
        price: s.price,
        currency: s.currency,
      },
      score: this.calculateScore(searchTerm, s.name),
    }));
  }

  /**
   * Calculate relevance score
   */
  private calculateScore(searchTerm: string, text: string): number {
    const term = searchTerm.replace(/%/g, '').toLowerCase();
    const textLower = text.toLowerCase();

    // Exact match
    if (textLower === term) return 100;

    // Starts with
    if (textLower.startsWith(term)) return 90;

    // Contains as word
    if (textLower.includes(` ${term}`) || textLower.includes(`${term} `)) return 80;

    // Contains
    if (textLower.includes(term)) return 70;

    // Partial match
    return 50;
  }
}
