'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Patient } from '@/lib/api';
import { Search, Plus, ChevronLeft, ChevronRight, User, Phone, Mail, Calendar } from 'lucide-react';

interface PatientListProps {
  patients: Patient[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  isLoading?: boolean;
}

export function PatientList({
  patients,
  total,
  page,
  limit,
  onPageChange,
  onSearch,
  isLoading,
}: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const totalPages = Math.ceil(total / limit);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar pacientes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </form>
        <Link
          href="/patients/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Paciente
        </Link>
      </div>

      {/* Patient Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No hay pacientes</h3>
          <p className="mt-2 text-gray-500">
            {searchTerm
              ? 'No se encontraron pacientes con ese criterio de búsqueda.'
              : 'Comienza agregando tu primer paciente.'}
          </p>
          {!searchTerm && (
            <Link
              href="/patients/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Agregar Paciente
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((patient) => (
            <Link
              key={patient.id}
              href={`/patients/${patient.id}`}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-lg">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {patient.firstName} {patient.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {calculateAge(patient.dateOfBirth)} años • {patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : 'O'}
                    {patient.bloodType && ` • ${patient.bloodType}`}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                {patient.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-3.5 w-3.5" />
                    <span className="truncate">{patient.phone}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Registrado: {formatDate(patient.createdAt)}</span>
                </div>
              </div>

              {patient.allergies && patient.allergies.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {patient.allergies.slice(0, 3).map((allergy, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full"
                    >
                      {allergy}
                    </span>
                  ))}
                  {patient.allergies.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{patient.allergies.length - 3}
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{(page - 1) * limit + 1}</span> a{' '}
            <span className="font-medium">{Math.min(page * limit, total)}</span> de{' '}
            <span className="font-medium">{total}</span> pacientes
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-700">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
