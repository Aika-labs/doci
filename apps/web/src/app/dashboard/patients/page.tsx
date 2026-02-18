'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthCompat as useAuth } from '@/hooks/useAuthCompat';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { patientsApi, Patient } from '@/lib/api';
import {
  Plus,
  Search,
  Filter,
  Users,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Mail,
  Calendar,
  Loader2,
  Grid,
  List,
  AlertTriangle,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';
type GenderFilter = 'ALL' | 'MALE' | 'FEMALE' | 'OTHER';

export default function PatientsPage() {
  const { getToken } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('ALL');
  const limit = 12;

  const fetchPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = (await getToken()) || 'demo-token';

      const response = await patientsApi.getAll(token, { page, limit, search });
      let filteredData = response.data;

      // Client-side gender filter
      if (genderFilter !== 'ALL') {
        filteredData = filteredData.filter((p) => p.gender === genderFilter);
      }

      setPatients(filteredData);
      setTotal(response.total);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, page, search, genderFilter]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getGenderLabel = (gender: string) => {
    const labels: Record<string, string> = {
      MALE: 'Masculino',
      FEMALE: 'Femenino',
      OTHER: 'Otro',
    };
    return labels[gender] || gender;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pacientes</h1>
          <p className="text-white/50">Gestiona la información de tus pacientes</p>
        </div>
        <Link
          href="/dashboard/patients/new"
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          Nuevo Paciente
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/15">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-white/50">Total pacientes</p>
              <p className="text-xl font-bold text-white">{total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-500/15">
              <User className="h-5 w-5 text-pink-400" />
            </div>
            <div>
              <p className="text-sm text-white/50">Mujeres</p>
              <p className="text-xl font-bold text-white">
                {patients.filter((p) => p.gender === 'FEMALE').length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/15">
              <User className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-white/50">Hombres</p>
              <p className="text-xl font-bold text-white">
                {patients.filter((p) => p.gender === 'MALE').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Buscar por nombre, email o teléfono..."
            className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] py-2.5 pr-4 pl-10 text-white placeholder-white/30 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm transition-colors ${
              showFilters || genderFilter !== 'ALL'
                ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                : 'border-white/[0.06] text-white/50 hover:bg-white/5'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {genderFilter !== 'ALL' && <span className="h-2 w-2 rounded-full bg-blue-500" />}
          </button>
          <div className="flex items-center rounded-2xl bg-white/[0.03] p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-xl p-2 text-white/50 transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'hover:text-white/70'}`}
              title="Vista cuadrícula"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-xl p-2 text-white/50 transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'hover:text-white/70'}`}
              title="Vista lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-4">
          <label className="mb-2 block text-sm font-medium text-white/60">Género</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'ALL', label: 'Todos' },
              { value: 'FEMALE', label: 'Femenino' },
              { value: 'MALE', label: 'Masculino' },
              { value: 'OTHER', label: 'Otro' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setGenderFilter(option.value as GenderFilter);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  genderFilter === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white/70'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Patients List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      ) : patients.length === 0 ? (
        <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] py-12 text-center">
          <Users className="mx-auto mb-3 h-12 w-12 text-white/20" />
          <p className="mb-4 text-white/40">
            {search || genderFilter !== 'ALL'
              ? 'No se encontraron pacientes con esos filtros'
              : 'No hay pacientes registrados'}
          </p>
          {!search && genderFilter === 'ALL' && (
            <Link
              href="/dashboard/patients/new"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25"
            >
              <Plus className="h-4 w-4" />
              Registrar primer paciente
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient) => (
            <Link
              key={patient.id}
              href={`/patients/${patient.id}`}
              className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/20 hover:bg-white/[0.06]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-500/15">
                  <span className="font-semibold text-blue-400">
                    {patient.firstName[0]}
                    {patient.lastName[0]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium text-white">
                    {patient.firstName} {patient.lastName}
                  </h3>
                  <p className="text-sm text-white/40">
                    {calculateAge(patient.dateOfBirth)} años • {getGenderLabel(patient.gender)}
                  </p>
                  {patient.allergies && patient.allergies.length > 0 && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-red-400">
                      <AlertTriangle className="h-3 w-3" />
                      <span>
                        {patient.allergies.length} alergia{patient.allergies.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 space-y-1 border-t border-white/[0.06] pt-3">
                {patient.phone && (
                  <div className="flex items-center gap-2 text-sm text-white/40">
                    <Phone className="h-3.5 w-3.5" />
                    <span className="truncate">{patient.phone}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-2 text-sm text-white/40">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-white/[0.06] bg-white/[0.03]">
          <table className="w-full">
            <thead className="border-b border-white/[0.06] bg-white/[0.02]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">
                  Paciente
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-white/40 uppercase md:table-cell">
                  Contacto
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-white/40 uppercase lg:table-cell">
                  Fecha de nacimiento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">
                  Género
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {patients.map((patient) => (
                <tr key={patient.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <Link href={`/patients/${patient.id}`} className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-500/15">
                        <span className="text-sm font-semibold text-blue-400">
                          {patient.firstName[0]}
                          {patient.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="text-sm text-white/40">
                          {calculateAge(patient.dateOfBirth)} años
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <div className="text-sm">
                      {patient.phone && <p className="text-white/70">{patient.phone}</p>}
                      {patient.email && (
                        <p className="max-w-[200px] truncate text-white/40">{patient.email}</p>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <div className="flex items-center gap-2 text-sm text-white/40">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(patient.dateOfBirth), 'd MMM yyyy', { locale: es })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        patient.gender === 'FEMALE'
                          ? 'bg-pink-500/15 text-pink-400'
                          : patient.gender === 'MALE'
                            ? 'bg-blue-500/15 text-blue-400'
                            : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {getGenderLabel(patient.gender)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-white/40">
            Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total}{' '}
            pacientes
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="rounded-xl border border-white/[0.06] p-2 text-white/50 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-sm text-white/60">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="rounded-xl border border-white/[0.06] p-2 text-white/50 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
