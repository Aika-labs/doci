'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuthCompat as useAuth } from '@/hooks/useAuthCompat';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Calendar,
  FileText,
  Pill,
  Stethoscope,
  ClipboardList,
  Target,
  CheckSquare,
  Loader2,
  Download,
  Plus,
  AlertTriangle,
  Activity,
} from 'lucide-react';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodType?: string;
  allergies?: string[];
  currentMedications?: string[];
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty?: string;
  licenseNumber?: string;
}

interface SOAPNotes {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

interface VitalSigns {
  weight?: number;
  height?: number;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
}

interface Diagnosis {
  code: string;
  description: string;
  type: 'primary' | 'secondary';
}

interface Consultation {
  id: string;
  patientId: string;
  patient: Patient;
  userId: string;
  user: Doctor;
  status: string;
  startedAt: string;
  completedAt?: string;
  clinicalData?: Record<string, unknown>;
  soapNotes?: SOAPNotes;
  vitalSigns?: VitalSigns;
  aiTranscription?: string;
  aiSummary?: string;
  diagnoses?: Diagnosis[];
}

interface Prescription {
  id: string;
  createdAt: string;
  diagnosis?: string;
  medications: Array<{ name: string; dose: string; frequency: string; duration: string }>;
  isValid: boolean;
}

export default function ConsultationDetailPage() {
  const params = useParams();
  const { getToken } = useAuth();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const consultationId = params.id as string;

  const fetchConsultation = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const res = await fetch(`${apiUrl}/consultations/${consultationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Error al cargar la consulta');
      }

      const data = await res.json();
      setConsultation(data);

      // Fetch prescriptions for this consultation
      const prescRes = await fetch(`${apiUrl}/prescriptions?consultationId=${consultationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (prescRes.ok) {
        const prescData = await prescRes.json();
        setPrescriptions(prescData || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la consulta');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, consultationId]);

  useEffect(() => {
    fetchConsultation();
  }, [fetchConsultation]);

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
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-semibold text-white">{error || 'Consulta no encontrada'}</h2>
        <Link href="/dashboard/consultations" className="mt-4 text-blue-400 hover:text-blue-300">
          Volver a consultas
        </Link>
      </div>
    );
  }

  const { patient, user: doctor, soapNotes, vitalSigns, diagnoses } = consultation;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/consultations"
          className="mb-4 inline-flex items-center gap-2 text-white/50 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a consultas
        </Link>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Consulta Médica</h1>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  consultation.status === 'COMPLETED'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-amber-500/15 text-amber-300'
                }`}
              >
                {consultation.status === 'COMPLETED' ? 'Completada' : 'En progreso'}
              </span>
            </div>
            <p className="text-white/50">
              {format(
                new Date(consultation.startedAt),
                "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm",
                { locale: es }
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/consultations/new?patientId=${patient.id}`}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white hover:from-blue-600 hover:to-cyan-600"
            >
              <Plus className="h-4 w-4" />
              Nueva Consulta
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Patient Alerts */}
          {patient.allergies && patient.allergies.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h3 className="font-semibold text-red-900">Alergias del Paciente</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((allergy, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-red-500/15 px-3 py-1 text-sm text-red-300"
                  >
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* SOAP Notes */}
          <div className="overflow-hidden rounded-[2rem] border border-white/[0.06] bg-white/[0.03]">
            <div className="border-b border-white/[0.06] bg-white/[0.02] px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <FileText className="h-5 w-5 text-blue-400" />
                Notas SOAP
              </h2>
            </div>
            <div className="space-y-6 p-6">
              {/* Subjective */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-blue-400" />
                  <h3 className="font-semibold text-white">Subjetivo (S)</h3>
                </div>
                <p className="rounded-2xl bg-white/[0.02] p-4 whitespace-pre-wrap text-white/70">
                  {soapNotes?.subjective || 'No registrado'}
                </p>
              </div>

              {/* Objective */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-emerald-400" />
                  <h3 className="font-semibold text-white">Objetivo (O)</h3>
                </div>
                <p className="rounded-2xl bg-white/[0.02] p-4 whitespace-pre-wrap text-white/70">
                  {soapNotes?.objective || 'No registrado'}
                </p>
              </div>

              {/* Assessment */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-600" />
                  <h3 className="font-semibold text-white">Evaluación (A)</h3>
                </div>
                <p className="rounded-2xl bg-white/[0.02] p-4 whitespace-pre-wrap text-white/70">
                  {soapNotes?.assessment || 'No registrado'}
                </p>
              </div>

              {/* Plan */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-violet-400" />
                  <h3 className="font-semibold text-white">Plan (P)</h3>
                </div>
                <p className="rounded-2xl bg-white/[0.02] p-4 whitespace-pre-wrap text-white/70">
                  {soapNotes?.plan || 'No registrado'}
                </p>
              </div>
            </div>
          </div>

          {/* Diagnoses */}
          {diagnoses && diagnoses.length > 0 && (
            <div className="overflow-hidden rounded-[2rem] border border-white/[0.06] bg-white/[0.03]">
              <div className="border-b border-white/[0.06] bg-white/[0.02] px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Diagnósticos (CIE-10)</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {diagnoses.map((diagnosis, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded-2xl p-3 ${
                        diagnosis.type === 'primary' ? 'bg-blue-50' : 'bg-white/[0.02]'
                      }`}
                    >
                      <div>
                        <span className="mr-2 font-mono text-sm text-white/40">
                          {diagnosis.code}
                        </span>
                        <span className="text-white">{diagnosis.description}</span>
                      </div>
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          diagnosis.type === 'primary'
                            ? 'bg-blue-500/15 text-blue-300'
                            : 'bg-white/10 text-white/50'
                        }`}
                      >
                        {diagnosis.type === 'primary' ? 'Principal' : 'Secundario'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI Transcription */}
          {consultation.aiTranscription && (
            <div className="overflow-hidden rounded-[2rem] border border-white/[0.06] bg-white/[0.03]">
              <div className="border-b border-white/[0.06] bg-white/[0.02] px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Transcripción de Audio</h2>
              </div>
              <div className="p-6">
                <p className="text-sm whitespace-pre-wrap text-white/70">
                  {consultation.aiTranscription}
                </p>
              </div>
            </div>
          )}

          {/* Prescriptions */}
          {prescriptions.length > 0 && (
            <div className="overflow-hidden rounded-[2rem] border border-white/[0.06] bg-white/[0.03]">
              <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-6 py-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Pill className="h-5 w-5 text-emerald-400" />
                  Recetas
                </h2>
              </div>
              <div className="space-y-4 p-6">
                {prescriptions.map((prescription) => (
                  <div key={prescription.id} className="rounded-2xl border border-white/[0.06] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">
                          {format(new Date(prescription.createdAt), "d 'de' MMMM, yyyy", {
                            locale: es,
                          })}
                        </p>
                        {prescription.diagnosis && (
                          <p className="text-sm text-white/40">{prescription.diagnosis}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            prescription.isValid
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-red-500/15 text-red-300'
                          }`}
                        >
                          {prescription.isValid ? 'Válida' : 'Invalidada'}
                        </span>
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/prescriptions/${prescription.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg px-3 py-1 text-sm text-blue-400 hover:bg-blue-50"
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </a>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {prescription.medications.map((med, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-white/30">•</span>
                          <div>
                            <span className="font-medium text-white">{med.name}</span>
                            <span className="text-white/40">
                              {' '}
                              - {med.dose}, {med.frequency}, {med.duration}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Patient Info */}
          <div className="overflow-hidden rounded-[2rem] border border-white/[0.06] bg-white/[0.03]">
            <div className="border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <h3 className="flex items-center gap-2 font-semibold text-white">
                <User className="h-4 w-4" />
                Paciente
              </h3>
            </div>
            <div className="p-4">
              <Link
                href={`/patients/${patient.id}`}
                className="-m-2 flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15">
                  <span className="text-lg font-bold text-blue-400">
                    {patient.firstName[0]}
                    {patient.lastName[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-sm text-white/40">
                    {calculateAge(patient.dateOfBirth)} años •{' '}
                    {patient.gender === 'MALE' ? 'M' : 'F'}
                    {patient.bloodType && ` • ${patient.bloodType}`}
                  </p>
                </div>
              </Link>

              {patient.currentMedications && patient.currentMedications.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <p className="mb-2 text-xs text-white/40">Medicamentos actuales</p>
                  <div className="flex flex-wrap gap-1">
                    {patient.currentMedications.map((med, i) => (
                      <span
                        key={i}
                        className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-300"
                      >
                        {med}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vital Signs */}
          {vitalSigns && Object.keys(vitalSigns).length > 0 && (
            <div className="overflow-hidden rounded-[2rem] border border-white/[0.06] bg-white/[0.03]">
              <div className="border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <h3 className="flex items-center gap-2 font-semibold text-white">
                  <Activity className="h-4 w-4" />
                  Signos Vitales
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4">
                {vitalSigns.bloodPressure && (
                  <div className="rounded-2xl bg-white/[0.02] p-2 text-center">
                    <p className="text-lg font-bold text-white">{vitalSigns.bloodPressure}</p>
                    <p className="text-xs text-white/40">Presión</p>
                  </div>
                )}
                {vitalSigns.heartRate && (
                  <div className="rounded-2xl bg-white/[0.02] p-2 text-center">
                    <p className="text-lg font-bold text-white">{vitalSigns.heartRate}</p>
                    <p className="text-xs text-white/40">FC (lpm)</p>
                  </div>
                )}
                {vitalSigns.temperature && (
                  <div className="rounded-2xl bg-white/[0.02] p-2 text-center">
                    <p className="text-lg font-bold text-white">{vitalSigns.temperature}°C</p>
                    <p className="text-xs text-white/40">Temp.</p>
                  </div>
                )}
                {vitalSigns.oxygenSaturation && (
                  <div className="rounded-2xl bg-white/[0.02] p-2 text-center">
                    <p className="text-lg font-bold text-white">{vitalSigns.oxygenSaturation}%</p>
                    <p className="text-xs text-white/40">SpO2</p>
                  </div>
                )}
                {vitalSigns.weight && (
                  <div className="rounded-2xl bg-white/[0.02] p-2 text-center">
                    <p className="text-lg font-bold text-white">{vitalSigns.weight} kg</p>
                    <p className="text-xs text-white/40">Peso</p>
                  </div>
                )}
                {vitalSigns.height && (
                  <div className="rounded-2xl bg-white/[0.02] p-2 text-center">
                    <p className="text-lg font-bold text-white">{vitalSigns.height} cm</p>
                    <p className="text-xs text-white/40">Talla</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Doctor Info */}
          <div className="overflow-hidden rounded-[2rem] border border-white/[0.06] bg-white/[0.03]">
            <div className="border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <h3 className="flex items-center gap-2 font-semibold text-white">
                <Stethoscope className="h-4 w-4" />
                Médico
              </h3>
            </div>
            <div className="p-4">
              <p className="font-medium text-white">
                Dr. {doctor.firstName} {doctor.lastName}
              </p>
              {doctor.specialty && <p className="text-sm text-white/40">{doctor.specialty}</p>}
              {doctor.licenseNumber && (
                <p className="mt-1 text-xs text-white/30">Cédula: {doctor.licenseNumber}</p>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="overflow-hidden rounded-[2rem] border border-white/[0.06] bg-white/[0.03]">
            <div className="border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <h3 className="flex items-center gap-2 font-semibold text-white">
                <Calendar className="h-4 w-4" />
                Fechas
              </h3>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <p className="text-xs text-white/40">Inicio</p>
                <p className="text-sm text-white">
                  {format(new Date(consultation.startedAt), 'd MMM yyyy, HH:mm', { locale: es })}
                </p>
              </div>
              {consultation.completedAt && (
                <div>
                  <p className="text-xs text-white/40">Finalización</p>
                  <p className="text-sm text-white">
                    {format(new Date(consultation.completedAt), 'd MMM yyyy, HH:mm', {
                      locale: es,
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
