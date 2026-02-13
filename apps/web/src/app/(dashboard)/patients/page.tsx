'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { PatientList } from '@/components/patients';
import { patientsApi, Patient } from '@/lib/api';

export default function PatientsPage() {
  const { getToken } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const limit = 12;

  const fetchPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      const response = await patientsApi.getAll(token, { page, limit, search });
      setPatients(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, page, search]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    setPage(1);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
        <p className="text-gray-600">Gestiona la información de tus pacientes</p>
      </div>

      <PatientList
        patients={patients}
        total={total}
        page={page}
        limit={limit}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        isLoading={isLoading}
      />
    </div>
  );
}
