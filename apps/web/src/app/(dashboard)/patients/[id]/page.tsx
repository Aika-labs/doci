'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { PatientForm } from '@/components/patients';
import { patientsApi, Patient } from '@/lib/api';
import { PatientFormData } from '@/lib/validations/patient';
import { ArrowLeft, Trash2, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { getToken } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const patientId = params.id as string;

  const fetchPatient = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      const data = await patientsApi.getById(token, patientId);
      setPatient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el paciente');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, patientId]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  const handleSubmit = async (data: PatientFormData) => {
    try {
      setIsSaving(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        setError('No estás autenticado');
        return;
      }

      const allergiesArray = data.allergies ? data.allergies.split(',').map(s => s.trim()).filter(Boolean) : [];
      const medicationsArray = data.currentMedications ? data.currentMedications.split(',').map(s => s.trim()).filter(Boolean) : [];

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

      await patientsApi.update(token, patientId, patientData);
      await fetchPatient();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el paciente');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setIsDeleting(true);
      const token = await getToken();
      if (!token) return;

      await patientsApi.delete(token, patientId);
      router.push('/patients');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el paciente');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Paciente no encontrado</h2>
        <Link href="/patients" className="mt-4 text-blue-600 hover:text-blue-700">
          Volver a pacientes
        </Link>
      </div>
    );
  }

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

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/patients"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a pacientes
        </Link>

        {!isEditing && (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h1>
              <p className="text-gray-600">
                {calculateAge(patient.dateOfBirth)} años • {patient.gender === 'MALE' ? 'Masculino' : patient.gender === 'FEMALE' ? 'Femenino' : 'Otro'}
                {patient.bloodType && ` • Tipo de sangre: ${patient.bloodType}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/consultations/new?patientId=${patient.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Nueva Consulta
              </Link>
              <Link
                href={`/appointments/new?patientId=${patient.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                Agendar Cita
              </Link>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Editar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {isEditing ? (
        <PatientForm
          patient={patient}
          onSubmit={handleSubmit}
          onCancel={() => setIsEditing(false)}
          isLoading={isSaving}
        />
      ) : (
        <div className="space-y-6">
          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {patient.phone && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium text-gray-900">{patient.phone}</p>
              </div>
            )}
            {patient.email && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{patient.email}</p>
              </div>
            )}
            {patient.address && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Dirección</p>
                <p className="font-medium text-gray-900">
                  {patient.address}
                  {patient.city && `, ${patient.city}`}
                </p>
              </div>
            )}
          </div>

          {/* Medical Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Médica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-2">Alergias</p>
                {patient.allergies && patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Sin alergias registradas</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Medicamentos Actuales</p>
                {patient.currentMedications && patient.currentMedications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.currentMedications.map((med, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {med}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Sin medicamentos registrados</p>
                )}
              </div>
            </div>
            {patient.notes && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Notas</p>
                <p className="text-gray-700">{patient.notes}</p>
              </div>
            )}
          </div>

          {/* Emergency Contact */}
          {patient.emergencyContact && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacto de Emergencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium text-gray-900">
                    {(patient.emergencyContact as Record<string, string>).name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium text-gray-900">
                    {(patient.emergencyContact as Record<string, string>).phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Relación</p>
                  <p className="font-medium text-gray-900">
                    {(patient.emergencyContact as Record<string, string>).relation}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Insurance */}
          {patient.insuranceInfo && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seguro Médico</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Aseguradora</p>
                  <p className="font-medium text-gray-900">
                    {(patient.insuranceInfo as Record<string, string>).provider}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Número de Póliza</p>
                  <p className="font-medium text-gray-900">
                    {(patient.insuranceInfo as Record<string, string>).policyNumber}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
