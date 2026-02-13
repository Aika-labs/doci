'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
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
      const token = await getToken();
      if (!token) return;

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

      const response = await fetch(`${apiUrl}/consultations?${params.toString()}`, {
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
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      IN_PROGRESS: 'En progreso',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultas</h1>
          <p className="text-gray-600">Historial de consultas médicas</p>
        </div>
        <Link
          href="/consultations/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Mic className="h-4 w-4" />
          Nueva Consulta
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Completadas</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">En progreso</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por paciente o diagnóstico..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            showFilters || statusFilter !== 'ALL' || dateFilter !== 'ALL'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {(statusFilter !== 'ALL' || dateFilter !== 'ALL') && (
            <span className="w-2 h-2 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
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
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      statusFilter === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
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
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      dateFilter === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              className="mt-4 text-sm text-blue-600 hover:text-blue-700"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Consultations List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filteredConsultations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {searchTerm || statusFilter !== 'ALL' || dateFilter !== 'ALL'
              ? 'No se encontraron consultas'
              : 'No hay consultas'}
          </h3>
          <p className="mt-2 text-gray-500">
            {searchTerm || statusFilter !== 'ALL' || dateFilter !== 'ALL'
              ? 'Intenta con otros filtros de búsqueda'
              : 'Comienza creando tu primera consulta con asistencia de IA.'}
          </p>
          {!searchTerm && statusFilter === 'ALL' && dateFilter === 'ALL' && (
            <Link
              href="/consultations/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {consultation.patient ? (
                      <span className="text-blue-600 font-semibold">
                        {consultation.patient.firstName[0]}{consultation.patient.lastName[0]}
                      </span>
                    ) : (
                      <User className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {consultation.patient
                        ? `${consultation.patient.firstName} ${consultation.patient.lastName}`
                        : 'Paciente'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(consultation.startedAt || consultation.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                      </span>
                      {getStatusBadge(consultation.status)}
                    </div>
                    {consultation.user && (
                      <p className="text-xs text-gray-400 mt-1">
                        Dr. {consultation.user.firstName} {consultation.user.lastName}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>
              {consultation.clinicalData?.soapNotes?.assessment && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2 pl-16">
                  <span className="font-medium">Dx:</span> {consultation.clinicalData.soapNotes.assessment}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
