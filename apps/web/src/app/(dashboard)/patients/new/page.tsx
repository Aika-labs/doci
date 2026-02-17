'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { PatientForm } from '@/components/patients';
import { patientsApi } from '@/lib/api';
import { PatientFormData } from '@/lib/validations/patient';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui';

export default function NewPatientPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: PatientFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        setError('No estás autenticado');
        return;
      }

      // Transform form data to API format
      const allergiesArray = data.allergies
        ? data.allergies
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const medicationsArray = data.currentMedications
        ? data.currentMedications
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const patientData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        dateOfBirth: new Date(data.dateOfBirth).toISOString(),
        gender: data.gender,
        bloodType: data.bloodType || null,
        allergies: allergiesArray,
        currentMedications: medicationsArray,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        postalCode: data.postalCode || null,
        notes: data.notes || null,
        emergencyContact: data.emergencyContactName
          ? {
              name: data.emergencyContactName,
              phone: data.emergencyContactPhone || '',
              relation: data.emergencyContactRelation || '',
            }
          : null,
        insuranceInfo: data.insuranceProvider
          ? {
              provider: data.insuranceProvider,
              policyNumber: data.insurancePolicyNumber || '',
            }
          : null,
      };

      await patientsApi.create(token, patientData);
      success('Paciente creado', 'El paciente ha sido registrado exitosamente');
      router.push('/patients');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear el paciente';
      setError(message);
      showError('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/patients"
          className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a pacientes
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Paciente</h1>
        <p className="text-gray-600">Registra un nuevo paciente en el sistema</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <PatientForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/patients')}
        isLoading={isLoading}
      />
    </div>
  );
}
