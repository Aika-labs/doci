'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { PatientForm } from '@/components/patients';
import { patientsApi, Patient } from '@/lib/api';
import { PatientFormData } from '@/lib/validations/patient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import {
  ArrowLeft,
  Trash2,
  FileText,
  Calendar,
  User,
  Pill,
  FolderOpen,
  Clock,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Heart,
  Loader2,
  ChevronRight,
  Download,
  Plus,
} from 'lucide-react';
import { FileUpload } from '@/components/files';

type TabType = 'overview' | 'consultations' | 'prescriptions' | 'files' | 'appointments';

interface Consultation {
  id: string;
  createdAt: string;
  status: string;
  clinicalData?: {
    soapNotes?: {
      assessment?: string;
    };
  };
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface Prescription {
  id: string;
  createdAt: string;
  diagnosis?: string;
  medications: Array<{ name: string; dose: string }>;
  isValid: boolean;
}

interface PatientFile {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  sizeMb: number;
  storageUrl?: string;
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  notes?: string;
}

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
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Tab data
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

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

  const fetchTabData = useCallback(async (tab: TabType) => {
    if (tab === 'overview') return;
    
    try {
      setTabLoading(true);
      const token = await getToken();
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      switch (tab) {
        case 'consultations': {
          const res = await fetch(`${apiUrl}/consultations?patientId=${patientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setConsultations(data.data || []);
          }
          break;
        }
        case 'prescriptions': {
          const res = await fetch(`${apiUrl}/prescriptions?patientId=${patientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setPrescriptions(data || []);
          }
          break;
        }
        case 'files': {
          const res = await fetch(`${apiUrl}/storage/patient/${patientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setFiles(data || []);
          }
          break;
        }
        case 'appointments': {
          const res = await fetch(`${apiUrl}/appointments?patientId=${patientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setAppointments(data.data || data || []);
          }
          break;
        }
      }
    } catch (err) {
      console.error('Error fetching tab data:', err);
    } finally {
      setTabLoading(false);
    }
  }, [getToken, patientId]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab, fetchTabData]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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

  const tabs = [
    { id: 'overview' as const, label: 'Resumen', icon: User },
    { id: 'consultations' as const, label: 'Consultas', icon: FileText, count: consultations.length },
    { id: 'prescriptions' as const, label: 'Recetas', icon: Pill, count: prescriptions.length },
    { id: 'files' as const, label: 'Archivos', icon: FolderOpen, count: files.length },
    { id: 'appointments' as const, label: 'Citas', icon: Calendar, count: appointments.length },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/patients"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a pacientes
        </Link>

        {!isEditing && (
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {patient.firstName[0]}{patient.lastName[0]}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {patient.firstName} {patient.lastName}
                </h1>
                <p className="text-gray-600">
                  {calculateAge(patient.dateOfBirth)} años • {patient.gender === 'MALE' ? 'Masculino' : patient.gender === 'FEMALE' ? 'Femenino' : 'Otro'}
                  {patient.bloodType && ` • ${patient.bloodType}`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/consultations/new?patientId=${patient.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Nueva Consulta
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
        <>
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex gap-4 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {tabLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewTab patient={patient} calculateAge={calculateAge} />
              )}
              {activeTab === 'consultations' && (
                <ConsultationsTab consultations={consultations} patientId={patientId} />
              )}
              {activeTab === 'prescriptions' && (
                <PrescriptionsTab prescriptions={prescriptions} />
              )}
              {activeTab === 'files' && (
                <FilesTab files={files} patientId={patientId} onUploadComplete={() => fetchTabData('files')} />
              )}
              {activeTab === 'appointments' && (
                <AppointmentsTab appointments={appointments} patientId={patientId} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function OverviewTab({ patient, calculateAge }: { patient: Patient; calculateAge: (dob: string) => number }) {
  return (
    <div className="space-y-6">
      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {patient.phone && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Teléfono</p>
              <p className="font-medium text-gray-900">{patient.phone}</p>
            </div>
          </div>
        )}
        {patient.email && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{patient.email}</p>
            </div>
          </div>
        )}
        {patient.address && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
            <MapPin className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Dirección</p>
              <p className="font-medium text-gray-900">
                {patient.address}{patient.city && `, ${patient.city}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {patient.allergies && patient.allergies.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Alergias</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {patient.allergies.map((allergy, i) => (
              <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                {allergy}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Medical Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Información Médica
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-2">Fecha de Nacimiento</p>
            <p className="text-gray-900">
              {format(new Date(patient.dateOfBirth), "d 'de' MMMM, yyyy", { locale: es })}
              <span className="text-gray-500 ml-2">({calculateAge(patient.dateOfBirth)} años)</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">Tipo de Sangre</p>
            <p className="text-gray-900">{patient.bloodType || 'No registrado'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500 mb-2">Medicamentos Actuales</p>
            {patient.currentMedications && patient.currentMedications.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patient.currentMedications.map((med, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
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
          <div className="mt-4 pt-4 border-t">
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
  );
}

function ConsultationsTab({ consultations, patientId }: { consultations: Consultation[]; patientId: string }) {
  if (consultations.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 mb-4">No hay consultas registradas</p>
        <Link
          href={`/consultations/new?patientId=${patientId}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FileText className="h-4 w-4" />
          Nueva Consulta
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {consultations.map((consultation) => (
        <Link
          key={consultation.id}
          href={`/consultations/${consultation.id}`}
          className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {format(new Date(consultation.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
              </p>
              <p className="text-sm text-gray-500">
                {consultation.clinicalData?.soapNotes?.assessment || 'Sin diagnóstico registrado'}
              </p>
              {consultation.user && (
                <p className="text-xs text-gray-400 mt-1">
                  Dr. {consultation.user.firstName} {consultation.user.lastName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                consultation.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {consultation.status === 'COMPLETED' ? 'Completada' : 'En progreso'}
              </span>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function PrescriptionsTab({ prescriptions }: { prescriptions: Prescription[] }) {
  if (prescriptions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <Pill className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No hay recetas registradas</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prescriptions.map((prescription) => (
        <div
          key={prescription.id}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium text-gray-900">
                {format(new Date(prescription.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
              </p>
              {prescription.diagnosis && (
                <p className="text-sm text-gray-500">{prescription.diagnosis}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                prescription.isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {prescription.isValid ? 'Válida' : 'Invalidada'}
              </span>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/prescriptions/${prescription.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {prescription.medications.slice(0, 3).map((med, i) => (
              <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                {med.name} - {med.dose}
              </span>
            ))}
            {prescription.medications.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-sm">
                +{prescription.medications.length - 3} más
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function FilesTab({ files, patientId, onUploadComplete }: { files: PatientFile[]; patientId: string; onUploadComplete: () => void }) {
  const [showUpload, setShowUpload] = useState(false);

  const getFileIcon = (type: string) => {
    if (type === 'IMAGE') return '🖼️';
    if (type === 'LAB_RESULT') return '🧪';
    if (type === 'IMAGING') return '📷';
    if (type === 'PRESCRIPTION') return '💊';
    return '📄';
  };

  return (
    <div className="space-y-4">
      {/* Upload Button / Component */}
      {showUpload ? (
        <FileUpload
          patientId={patientId}
          onUploadComplete={() => {
            onUploadComplete();
          }}
          onClose={() => setShowUpload(false)}
        />
      ) : (
        <button
          onClick={() => setShowUpload(true)}
          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Subir archivos
        </button>
      )}

      {/* Files List */}
      {files.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FolderOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No hay archivos subidos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4"
            >
              <span className="text-2xl">{getFileIcon(file.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(file.createdAt), "d MMM yyyy", { locale: es })} • {file.sizeMb.toFixed(2)} MB
                </p>
              </div>
              {file.storageUrl && (
                <a
                  href={file.storageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Download className="h-4 w-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentsTab({ appointments, patientId }: { appointments: Appointment[]; patientId: string }) {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 mb-4">No hay citas registradas</p>
        <Link
          href={`/appointments?patientId=${patientId}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Calendar className="h-4 w-4" />
          Agendar Cita
        </Link>
      </div>
    );
  }

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-700',
      CONFIRMED: 'bg-blue-100 text-blue-700',
      SCHEDULED: 'bg-gray-100 text-gray-700',
      CANCELLED: 'bg-red-100 text-red-700',
      NO_SHOW: 'bg-yellow-100 text-yellow-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      COMPLETED: 'Completada',
      CONFIRMED: 'Confirmada',
      SCHEDULED: 'Programada',
      CANCELLED: 'Cancelada',
      NO_SHOW: 'No asistió',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {format(new Date(appointment.startTime), 'd')}
                </p>
                <p className="text-sm text-gray-500">
                  {format(new Date(appointment.startTime), 'MMM', { locale: es })}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <p className="font-medium text-gray-900">
                    {format(new Date(appointment.startTime), 'HH:mm')} - {format(new Date(appointment.endTime), 'HH:mm')}
                  </p>
                </div>
                <p className="text-sm text-gray-500">{appointment.type || 'Consulta'}</p>
                {appointment.notes && (
                  <p className="text-xs text-gray-400 mt-1">{appointment.notes}</p>
                )}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(appointment.status)}`}>
              {getStatusLabel(appointment.status)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
