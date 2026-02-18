'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthCompat as useAuth } from '@/hooks/useAuthCompat';
import Link from 'next/link';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { mockFetch } from '@/lib/mock-data';
import {
  Plus,
  FileText,
  Calendar,
  User,
  ChevronRight,
  Search,
  Filter,
  Loader2,
  Mic,
} from 'lucide-react';

interface Consultation {
  id: string;
  patientId: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  user?: {
    firstName: string;
    lastName: string;
  };
  status: string;
  createdAt: string;
  startedAt: string;
  completedAt?: string;
  clinicalData?: {
    soapNotes?: {
      subjective?: string;
      assessment?: string;
    };
  };
}

type StatusFilter = 'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type DateFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH';

export default function ConsultationsPage() {
  const { getToken } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const fetchConsultations = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = (await getToken()) || 'demo-token';

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      // Build query params
      const params = new URLSearchParams();
      params.append('limit', '100');

      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }

      // Date filtering
      const now = new Date();
      if (dateFilter === 'TODAY') {
        params.append('startDate', startOfDay(now).toISOString());
        params.append('endDate', endOfDay(now).toISOString());
      } else if (dateFilter === 'WEEK') {
        params.append('startDate', startOfDay(subDays(now, 7)).toISOString());
        params.append('endDate', endOfDay(now).toISOString());
      } else if (dateFilter === 'MONTH') {
        params.append('startDate', startOfDay(subDays(now, 30)).toISOString());
        params.append('endDate', endOfDay(now).toISOString());
      }

      const response = await mockFetch(`${apiUrl}/consultations?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setConsultations(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, statusFilter, dateFilter]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  // Client-side search filtering
  const filteredConsultations = consultations.filter((consultation) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const patientName = consultation.patient
      ? `${consultation.patient.firstName} ${consultation.patient.lastName}`.toLowerCase()
      : '';
    const assessment = consultation.clinicalData?.soapNotes?.assessment?.toLowerCase() || '';
    return patientName.includes(search) || assessment.includes(search);
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      IN_PROGRESS: 'bg-amber-500/15 text-yellow-800',
      COMPLETED: 'bg-emerald-500/15 text-green-800',
      CANCELLED: 'bg-red-500/15 text-red-800',
    };
    const labels: Record<string, string> = {
      IN_PROGRESS: 'En progreso',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
    };
    return (
      <span
        className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] || 'bg-white/[0.06] text-white/90'}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const stats = {
    total: consultations.length,
    completed: consultations.filter((c) => c.status === 'COMPLETED').length,
    inProgress: consultations.filter((c) => c.status === 'IN_PROGRESS').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Consultas</h1>
          <p className="text-white/50">Historial de consultas médicas</p>
        </div>
        <Link
          href="/dashboard/consultations/new"
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white transition-colors hover:from-blue-600 hover:to-cyan-600"
        >
          <Mic className="h-4 w-4" />
          Nueva Consulta
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-sm text-white/40">Total</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-sm text-white/40">Completadas</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.completed}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <p className="text-sm text-white/40">En progreso</p>
          <p className="text-2xl font-bold text-amber-400">{stats.inProgress}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por paciente o diagnóstico..."
            className="w-full rounded-2xl border border-white/[0.08] py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2 transition-colors ${
            showFilters || statusFilter !== 'ALL' || dateFilter !== 'ALL'
              ? 'border-blue-500 bg-blue-50 text-blue-300'
              : 'border-white/[0.08] text-white/70 hover:bg-white/[0.02]'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {(statusFilter !== 'ALL' || dateFilter !== 'ALL') && (
            <span className="h-2 w-2 rounded-full bg-blue-600" />
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Estado</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'ALL', label: 'Todos' },
                  { value: 'COMPLETED', label: 'Completadas' },
                  { value: 'IN_PROGRESS', label: 'En progreso' },
                  { value: 'CANCELLED', label: 'Canceladas' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value as StatusFilter)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      statusFilter === option.value
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                        : 'bg-white/[0.06] text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">Período</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'ALL', label: 'Todo' },
                  { value: 'TODAY', label: 'Hoy' },
                  { value: 'WEEK', label: 'Última semana' },
                  { value: 'MONTH', label: 'Último mes' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDateFilter(option.value as DateFilter)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      dateFilter === option.value
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                        : 'bg-white/[0.06] text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {(statusFilter !== 'ALL' || dateFilter !== 'ALL') && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setDateFilter('ALL');
              }}
              className="mt-4 text-sm text-blue-400 hover:text-blue-300"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Consultations List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      ) : filteredConsultations.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-white/30" />
          <h3 className="mt-4 text-lg font-medium text-white">
            {searchTerm || statusFilter !== 'ALL' || dateFilter !== 'ALL'
              ? 'No se encontraron consultas'
              : 'No hay consultas'}
          </h3>
          <p className="mt-2 text-white/40">
            {searchTerm || statusFilter !== 'ALL' || dateFilter !== 'ALL'
              ? 'Intenta con otros filtros de búsqueda'
              : 'Comienza creando tu primera consulta con asistencia de IA.'}
          </p>
          {!searchTerm && statusFilter === 'ALL' && dateFilter === 'ALL' && (
            <Link
              href="/dashboard/consultations/new"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white transition-colors hover:from-blue-600 hover:to-cyan-600"
            >
              <Plus className="h-4 w-4" />
              Nueva Consulta
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConsultations.map((consultation) => (
            <Link
              key={consultation.id}
              href={`/consultations/${consultation.id}`}
              className="block rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/15">
                    {consultation.patient ? (
                      <span className="font-semibold text-blue-400">
                        {consultation.patient.firstName[0]}
                        {consultation.patient.lastName[0]}
                      </span>
                    ) : (
                      <User className="h-6 w-6 text-blue-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-medium text-white">
                      {consultation.patient
                        ? `${consultation.patient.firstName} ${consultation.patient.lastName}`
                        : 'Paciente'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-white/40">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(
                          new Date(consultation.startedAt || consultation.createdAt),
                          'd MMM yyyy, HH:mm',
                          { locale: es }
                        )}
                      </span>
                      {getStatusBadge(consultation.status)}
                    </div>
                    {consultation.user && (
                      <p className="mt-1 text-xs text-white/30">
                        Dr. {consultation.user.firstName} {consultation.user.lastName}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-white/30" />
              </div>
              {consultation.clinicalData?.soapNotes?.assessment && (
                <p className="mt-3 line-clamp-2 pl-16 text-sm text-white/50">
                  <span className="font-medium">Dx:</span>{' '}
                  {consultation.clinicalData.soapNotes.assessment}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
