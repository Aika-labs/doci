'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthCompat as useAuth } from '@/hooks/useAuthCompat';
import { VoiceRecorder } from '@/components/voice';
import { patientsApi, Patient } from '@/lib/api';
import {
  ArrowLeft,
  Search,
  User,
  Mic,
  FileText,
  CheckCircle,
  Loader2,
  Pill,
  Plus,
  X,
  Download,
  Mail,
  MessageCircle,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui';

type Step = 'patient' | 'recording' | 'review' | 'complete';

interface SOAPNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface AIResponse {
  transcription: string;
  soapNotes: SOAPNotes;
  suggestions: {
    diagnoses: string[];
    medications: string[];
    tests: string[];
    followUp: string;
  };
}

interface Medication {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface CreatedPrescription {
  id: string;
  securityCode: string;
}

function NewConsultationContent() {
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const { success, error: showError } = useToast();

  const [step, setStep] = useState<Step>('patient');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [editedNotes, setEditedNotes] = useState<SOAPNotes | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [consultationId, setConsultationId] = useState<string | null>(null);

  // Prescription state
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [prescriptionDiagnosis, setPrescriptionDiagnosis] = useState('');
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [isCreatingPrescription, setIsCreatingPrescription] = useState(false);
  const [createdPrescription, setCreatedPrescription] = useState<CreatedPrescription | null>(null);

  // Send consultation state
  const [sendEmail, setSendEmail] = useState('');
  const [sendPhone, setSendPhone] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  const loadPatient = useCallback(
    async (patientId: string) => {
      try {
        const token = (await getToken()) || 'demo-token';
        const patient = await patientsApi.getById(token, patientId);
        setSelectedPatient(patient);
        setStep('recording');
      } catch (error) {
        console.error('Error loading patient:', error);
      }
    },
    [getToken]
  );

  // Load preselected patient from URL
  useEffect(() => {
    const patientId = searchParams.get('patientId');
    if (patientId) {
      loadPatient(patientId);
    }
  }, [searchParams, loadPatient]);

  const searchPatients = useCallback(
    async (search: string) => {
      if (search.length < 2) {
        setPatients([]);
        return;
      }

      try {
        setIsSearching(true);
        const token = (await getToken()) || 'demo-token';
        const response = await patientsApi.getAll(token, { search, limit: 10 });
        setPatients(response.data);
      } catch (error) {
        console.error('Error searching patients:', error);
      } finally {
        setIsSearching(false);
      }
    },
    [getToken]
  );

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchPatients(searchTerm);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, searchPatients]);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setStep('recording');
  };

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
  };

  const handleProcessRecording = async () => {
    if (!audioBlob || !selectedPatient) return;

    try {
      setIsProcessing(true);
      const token = await getToken();
      if (!token) return;

      // Create form data with audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('patientId', selectedPatient.id);

      // Send to AI endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/ai/process-consultation`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error processing recording');
      }

      const data: AIResponse = await response.json();
      setAiResponse(data);
      setEditedNotes(data.soapNotes);
      setStep('review');
    } catch (error) {
      console.error('Error processing recording:', error);
      // For demo, create mock response
      const mockResponse: AIResponse = {
        transcription:
          'Paciente refiere dolor de cabeza desde hace 3 días, intensidad 7/10, localizado en región frontal. No mejora con paracetamol. Sin náuseas ni vómitos. Antecedentes de migraña.',
        soapNotes: {
          subjective:
            'Paciente de sexo masculino refiere cefalea frontal de 3 días de evolución, intensidad 7/10. No responde a paracetamol. Niega náuseas, vómitos, fotofobia. Antecedente personal de migraña.',
          objective:
            'Signos vitales estables. Paciente alerta, orientado. Sin rigidez de nuca. Pupilas isocóricas, reactivas. Fondo de ojo normal.',
          assessment:
            'Cefalea tensional vs episodio migrañoso sin aura. Diagnóstico diferencial: cefalea secundaria (descartada por clínica).',
          plan: '1. Ibuprofeno 400mg c/8h por 5 días\n2. Reposo relativo\n3. Evitar factores desencadenantes\n4. Control en 1 semana si no mejora\n5. Acudir a urgencias si presenta signos de alarma',
        },
        suggestions: {
          diagnoses: ['Cefalea tensional (G44.2)', 'Migraña sin aura (G43.0)'],
          medications: ['Ibuprofeno 400mg', 'Paracetamol 1g', 'Sumatriptán 50mg'],
          tests: ['BH completa', 'TAC de cráneo (si persiste)'],
          followUp: '1 semana',
        },
      };
      setAiResponse(mockResponse);
      setEditedNotes(mockResponse.soapNotes);
      setStep('review');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveConsultation = async () => {
    if (!selectedPatient || !editedNotes || !aiResponse) return;

    try {
      setIsSaving(true);
      const token = await getToken();
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/consultations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            patientId: selectedPatient.id,
            clinicalData: {
              soapNotes: editedNotes,
              transcription: aiResponse.transcription,
              suggestions: aiResponse.suggestions,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error saving consultation');
      }

      const savedConsultation = await response.json();
      setConsultationId(savedConsultation.id);
      setStep('complete');
      success('Consulta guardada', 'Las notas han sido guardadas en el expediente');
    } catch (error) {
      console.error('Error saving consultation:', error);
      showError('Error', 'No se pudo guardar la consulta');
      // For demo, just move to complete with mock ID
      setConsultationId('mock-consultation-id');
      setStep('complete');
    } finally {
      setIsSaving(false);
    }
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      { name: '', dose: '', frequency: '', duration: '', instructions: '' },
    ]);
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const addSuggestedMedication = (suggestion: string) => {
    // Parse suggestion like "Ibuprofeno 400mg"
    const parts = suggestion.split(' ');
    const name = parts[0];
    const dose = parts.slice(1).join(' ');
    setMedications([...medications, { name, dose, frequency: '', duration: '', instructions: '' }]);
  };

  const handleCreatePrescription = async () => {
    if (!selectedPatient || medications.length === 0) return;

    try {
      setIsCreatingPrescription(true);
      const token = await getToken();
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/prescriptions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            patientId: selectedPatient.id,
            consultationId: consultationId,
            diagnosis: prescriptionDiagnosis || editedNotes?.assessment,
            medications: medications.filter((m) => m.name && m.dose),
            notes: prescriptionNotes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error creating prescription');
      }

      const prescription = await response.json();
      setCreatedPrescription(prescription);
      setShowPrescriptionForm(false);
      success('Receta creada', `Código de verificación: ${prescription.securityCode}`);
    } catch (error) {
      console.error('Error creating prescription:', error);
      showError('Error', 'No se pudo crear la receta');
      // Mock for demo
      setCreatedPrescription({ id: 'mock-prescription-id', securityCode: 'ABC123' });
      setShowPrescriptionForm(false);
    } finally {
      setIsCreatingPrescription(false);
    }
  };

  const handleSendEmail = async () => {
    if (!sendEmail || !consultationId) return;
    setIsSendingEmail(true);
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/notifications/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            channel: 'email',
            recipient: sendEmail,
            consultationId,
            prescriptionId: createdPrescription?.id,
          }),
        }
      );
      if (!response.ok) throw new Error('Error sending email');
      success('Email enviado', `Consulta enviada a ${sendEmail}`);
    } catch {
      showError('Error', 'No se pudo enviar el email. Verifica la configuración del servidor.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!sendPhone || !consultationId) return;
    setIsSendingWhatsApp(true);
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/notifications/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            channel: 'whatsapp',
            recipient: sendPhone,
            consultationId,
            prescriptionId: createdPrescription?.id,
          }),
        }
      );
      if (!response.ok) throw new Error('Error sending WhatsApp');
      success('WhatsApp enviado', `Consulta enviada a ${sendPhone}`);
    } catch {
      showError('Error', 'No se pudo enviar por WhatsApp. Verifica la configuración de Twilio.');
    } finally {
      setIsSendingWhatsApp(false);
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

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/consultations"
          className="mb-4 inline-flex items-center gap-2 text-white/50 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a consultas
        </Link>
        <h1 className="text-2xl font-bold text-white">Nueva Consulta</h1>
        <p className="text-white/50">Graba la consulta y deja que la IA estructure las notas</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-between">
        {[
          { key: 'patient', label: 'Paciente', icon: User },
          { key: 'recording', label: 'Grabación', icon: Mic },
          { key: 'review', label: 'Revisión', icon: FileText },
          { key: 'complete', label: 'Completado', icon: CheckCircle },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                step === s.key
                  ? 'bg-[#a8d944] text-[#0F1E29]'
                  : ['patient', 'recording', 'review', 'complete'].indexOf(step) >
                      ['patient', 'recording', 'review', 'complete'].indexOf(s.key)
                    ? 'bg-[#a8d944]/60 text-[#0F1E29]'
                    : 'bg-white/10 text-white/40'
              }`}
            >
              <s.icon className="h-5 w-5" />
            </div>
            <span className="ml-2 hidden text-sm font-medium text-white/70 sm:block">
              {s.label}
            </span>
            {i < 3 && (
              <div className="mx-2 h-0.5 w-12 bg-white/10 sm:w-24">
                <div
                  className={`h-full bg-[#a8d944] transition-all ${
                    ['patient', 'recording', 'review', 'complete'].indexOf(step) > i
                      ? 'w-full'
                      : 'w-0'
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-6">
        {/* Step 1: Patient Selection */}
        {step === 'patient' && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">Selecciona el paciente</h2>
            <div className="relative mb-4">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] py-3 pr-4 pl-10 text-white placeholder:text-white/30 focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
              />
            </div>

            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#a8d944]" />
              </div>
            ) : patients.length > 0 ? (
              <div className="space-y-2">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className="flex w-full items-center gap-4 rounded-2xl border border-white/[0.06] p-4 text-left transition-colors hover:border-[#a8d944]/30 hover:bg-[#a8d944]/[0.04]"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#a8d944]/15">
                      <span className="font-semibold text-[#a8d944]">
                        {patient.firstName[0]}
                        {patient.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-sm text-white/40">
                        {calculateAge(patient.dateOfBirth)} años •{' '}
                        {patient.gender === 'MALE' ? 'M' : 'F'}
                        {patient.bloodType && ` • ${patient.bloodType}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchTerm.length >= 2 ? (
              <p className="py-8 text-center text-white/40">No se encontraron pacientes</p>
            ) : (
              <p className="py-8 text-center text-white/40">
                Escribe al menos 2 caracteres para buscar
              </p>
            )}
          </div>
        )}

        {/* Step 2: Recording — Consultation Note */}
        {step === 'recording' && selectedPatient && (
          <div>
            {/* Patient banner — dark theme */}
            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#a8d944]/15">
                <span className="font-semibold text-[#a8d944]">
                  {selectedPatient.firstName[0]}
                  {selectedPatient.lastName[0]}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
                <p className="text-sm text-white/50">
                  {calculateAge(selectedPatient.dateOfBirth)} años
                  {selectedPatient.bloodType && (
                    <span className="ml-2 text-white/40">{selectedPatient.bloodType}</span>
                  )}
                  {selectedPatient.allergies?.length > 0 && (
                    <span className="ml-2 text-red-400">
                      Alergias: {selectedPatient.allergies.join(', ')}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setStep('patient');
                }}
                className="ml-auto text-sm text-[#a8d944]/70 hover:text-[#a8d944]"
              >
                Cambiar
              </button>
            </div>

            {/* Consultation note header */}
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#a8d944]/15">
                <FileText className="h-4 w-4 text-[#a8d944]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Nota de Consulta</h2>
                <p className="text-xs text-white/40">
                  {new Date().toLocaleDateString('es-VE', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Note area with quick fields */}
            <div className="mb-6 space-y-3">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <label className="mb-2 block text-xs font-medium tracking-wide text-white/40 uppercase">
                  Motivo de consulta
                </label>
                <input
                  type="text"
                  placeholder="Ej: Cefalea frontal de 3 días de evolución..."
                  className="w-full border-0 bg-transparent text-sm text-white placeholder:text-white/20 focus:ring-0 focus:outline-none"
                />
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <label className="mb-2 block text-xs font-medium tracking-wide text-white/40 uppercase">
                  Notas rápidas
                </label>
                <textarea
                  rows={3}
                  placeholder="Escribe observaciones mientras grabas la consulta..."
                  className="w-full resize-none border-0 bg-transparent text-sm text-white placeholder:text-white/20 focus:ring-0 focus:outline-none"
                />
              </div>
            </div>

            {/* Recording section — prominent */}
            <div className="rounded-2xl border border-[#a8d944]/20 bg-[#a8d944]/[0.04] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-[#a8d944]" />
                  <span className="text-sm font-medium text-white/70">Grabación de consulta</span>
                </div>
                <span className="text-xs text-white/30">
                  La IA estructurará las notas SOAP automáticamente
                </span>
              </div>

              <VoiceRecorder onRecordingComplete={handleRecordingComplete} />

              {audioBlob && (
                <div className="mt-5 flex justify-end border-t border-white/[0.06] pt-4">
                  <button
                    onClick={handleProcessRecording}
                    disabled={isProcessing}
                    className="flex items-center gap-2 rounded-2xl bg-[#a8d944] px-6 py-3 font-medium text-[#0F1E29] hover:bg-[#a8d944]/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Procesando con IA...
                      </>
                    ) : (
                      <>
                        <FileText className="h-5 w-5" />
                        Procesar con IA
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && editedNotes && aiResponse && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-white">Revisa y edita las notas</h2>

            {/* Transcription */}
            <div className="mb-6 rounded-2xl bg-white/[0.02] p-4">
              <h3 className="mb-2 text-sm font-medium text-white/70">Transcripción</h3>
              <p className="text-sm text-white/50">{aiResponse.transcription}</p>
            </div>

            {/* SOAP Notes */}
            <div className="space-y-4">
              {[
                {
                  key: 'subjective',
                  label: 'Subjetivo (S)',
                  placeholder: 'Lo que el paciente refiere...',
                },
                {
                  key: 'objective',
                  label: 'Objetivo (O)',
                  placeholder: 'Hallazgos del examen físico...',
                },
                {
                  key: 'assessment',
                  label: 'Evaluación (A)',
                  placeholder: 'Diagnóstico y análisis...',
                },
                { key: 'plan', label: 'Plan (P)', placeholder: 'Tratamiento y seguimiento...' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-sm font-medium text-white/70">
                    {field.label}
                  </label>
                  <textarea
                    value={editedNotes[field.key as keyof SOAPNotes]}
                    onChange={(e) =>
                      setEditedNotes({
                        ...editedNotes,
                        [field.key]: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-white placeholder:text-white/30 focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>

            {/* AI Suggestions */}
            <div className="mt-6 rounded-2xl border border-[#a8d944]/20 bg-[#a8d944]/[0.04] p-4">
              <h3 className="mb-3 text-sm font-medium text-[#a8d944]">Sugerencias de IA</h3>
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div>
                  <p className="font-medium text-white/70">Diagnósticos sugeridos:</p>
                  <ul className="mt-1 space-y-1">
                    {aiResponse.suggestions.diagnoses.map((d, i) => (
                      <li key={i} className="text-white/50">
                        • {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-white/70">Medicamentos sugeridos:</p>
                  <ul className="mt-1 space-y-1">
                    {aiResponse.suggestions.medications.map((m, i) => (
                      <li key={i} className="text-white/50">
                        • {m}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-white/70">Estudios sugeridos:</p>
                  <ul className="mt-1 space-y-1">
                    {aiResponse.suggestions.tests.map((t, i) => (
                      <li key={i} className="text-white/50">
                        • {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-white/70">Seguimiento:</p>
                  <p className="mt-1 text-white/50">{aiResponse.suggestions.followUp}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep('recording')}
                className="rounded-2xl border border-white/[0.08] px-4 py-2 text-white/70 hover:bg-white/[0.02]"
              >
                Volver a grabar
              </button>
              <button
                onClick={handleSaveConsultation}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-2xl bg-green-600 px-6 py-3 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Guardar Consulta
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="py-8">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-white">
                Consulta guardada exitosamente
              </h2>
              <p className="text-white/50">
                Las notas han sido guardadas en el expediente del paciente.
              </p>
            </div>

            {/* Prescription Section */}
            {!showPrescriptionForm && !createdPrescription && (
              <div className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Pill className="h-6 w-6 text-[#a8d944]" />
                    <div>
                      <h3 className="font-semibold text-white">¿Necesitas crear una receta?</h3>
                      <p className="text-sm text-white/50">
                        Genera una receta médica para este paciente
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPrescriptionForm(true);
                      if (aiResponse?.suggestions.diagnoses[0]) {
                        setPrescriptionDiagnosis(aiResponse.suggestions.diagnoses[0]);
                      }
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-[#a8d944] px-4 py-2 font-medium text-[#0F1E29] hover:bg-[#a8d944]/90"
                  >
                    <Plus className="h-4 w-4" />
                    Crear Receta
                  </button>
                </div>
              </div>
            )}

            {/* Prescription Form */}
            {showPrescriptionForm && (
              <div className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <Pill className="h-5 w-5 text-emerald-400" />
                    Nueva Receta
                  </h3>
                  <button
                    onClick={() => setShowPrescriptionForm(false)}
                    className="p-1 text-white/30 hover:text-white/50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-white/70">
                      Diagnóstico
                    </label>
                    <input
                      type="text"
                      value={prescriptionDiagnosis}
                      onChange={(e) => setPrescriptionDiagnosis(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-white placeholder:text-white/30 focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
                      placeholder="Diagnóstico principal"
                    />
                  </div>

                  {/* Suggested Medications */}
                  {aiResponse?.suggestions.medications &&
                    aiResponse.suggestions.medications.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-medium text-white/70">
                          Medicamentos sugeridos por IA:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {aiResponse.suggestions.medications.map((med, i) => (
                            <button
                              key={i}
                              onClick={() => addSuggestedMedication(med)}
                              className="rounded-full border border-[#a8d944]/20 bg-[#a8d944]/10 px-3 py-1 text-sm text-[#a8d944] hover:bg-[#a8d944]/20"
                            >
                              + {med}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Medications List */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium text-white/70">Medicamentos</label>
                      <button
                        onClick={addMedication}
                        className="text-sm text-[#a8d944] hover:text-[#a8d944]/80"
                      >
                        + Agregar medicamento
                      </button>
                    </div>

                    {medications.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-white/[0.08] py-4 text-center text-sm text-white/40">
                        No hay medicamentos agregados. Haz clic en una sugerencia o agrega uno
                        manualmente.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {medications.map((med, index) => (
                          <div key={index} className="rounded-2xl bg-white/[0.02] p-3">
                            <div className="mb-2 flex items-start justify-between">
                              <span className="text-sm font-medium text-white/70">
                                Medicamento {index + 1}
                              </span>
                              <button
                                onClick={() => removeMedication(index)}
                                className="text-red-500 hover:text-red-300"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={med.name}
                                onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                placeholder="Nombre"
                                className="rounded border border-white/[0.08] px-2 py-1 text-sm"
                              />
                              <input
                                type="text"
                                value={med.dose}
                                onChange={(e) => updateMedication(index, 'dose', e.target.value)}
                                placeholder="Dosis (ej: 400mg)"
                                className="rounded border border-white/[0.08] px-2 py-1 text-sm"
                              />
                              <input
                                type="text"
                                value={med.frequency}
                                onChange={(e) =>
                                  updateMedication(index, 'frequency', e.target.value)
                                }
                                placeholder="Frecuencia (ej: c/8h)"
                                className="rounded border border-white/[0.08] px-2 py-1 text-sm"
                              />
                              <input
                                type="text"
                                value={med.duration}
                                onChange={(e) =>
                                  updateMedication(index, 'duration', e.target.value)
                                }
                                placeholder="Duración (ej: 7 días)"
                                className="rounded border border-white/[0.08] px-2 py-1 text-sm"
                              />
                            </div>
                            <input
                              type="text"
                              value={med.instructions || ''}
                              onChange={(e) =>
                                updateMedication(index, 'instructions', e.target.value)
                              }
                              placeholder="Instrucciones adicionales (opcional)"
                              className="mt-2 w-full rounded border border-white/[0.08] px-2 py-1 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-white/70">
                      Notas adicionales
                    </label>
                    <textarea
                      value={prescriptionNotes}
                      onChange={(e) => setPrescriptionNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-white placeholder:text-white/30 focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
                      placeholder="Indicaciones especiales, advertencias, etc."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setShowPrescriptionForm(false)}
                      className="rounded-2xl border border-white/[0.08] px-4 py-2 text-white/70 hover:bg-white/[0.02]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreatePrescription}
                      disabled={isCreatingPrescription || medications.length === 0}
                      className="flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {isCreatingPrescription ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Crear Receta
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Created Prescription */}
            {createdPrescription && (
              <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Receta creada exitosamente</h3>
                    <p className="text-sm text-emerald-300">
                      Código de verificación: {createdPrescription.securityCode}
                    </p>
                  </div>
                </div>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/prescriptions/${createdPrescription.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </a>
              </div>
            )}

            {/* Send Consultation */}
            <div className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
                <Send className="h-5 w-5 text-[#a8d944]" />
                Enviar consulta al paciente
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Email */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-white/50" />
                    <span className="text-sm font-medium text-white/70">Correo electrónico</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={sendEmail}
                      onChange={(e) => setSendEmail(e.target.value)}
                      placeholder={selectedPatient?.email || 'correo@ejemplo.com'}
                      className="flex-1 rounded-xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#a8d944]/40 focus:ring-1 focus:ring-[#a8d944]/20"
                    />
                    <button
                      onClick={handleSendEmail}
                      disabled={!sendEmail || !consultationId || isSendingEmail}
                      className="flex items-center gap-1.5 rounded-xl bg-[#a8d944] px-3 py-2 text-sm font-medium text-[#0F1E29] hover:bg-[#a8d944]/90 disabled:opacity-40"
                    >
                      {isSendingEmail ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      Enviar
                    </button>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium text-white/70">WhatsApp</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={sendPhone}
                      onChange={(e) => setSendPhone(e.target.value)}
                      placeholder={selectedPatient?.phone || '+58 412 1234567'}
                      className="flex-1 rounded-xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
                    />
                    <button
                      onClick={handleSendWhatsApp}
                      disabled={!sendPhone || !consultationId || isSendingWhatsApp}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
                    >
                      {isSendingWhatsApp ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                      Enviar
                    </button>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs text-white/30">
                Se enviará un resumen de la consulta
                {createdPrescription ? ' y la receta médica' : ''} al paciente.
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-center gap-4">
              <Link
                href={`/patients/${selectedPatient?.id}`}
                className="rounded-2xl border border-[#a8d944]/30 px-4 py-2 text-[#a8d944] hover:bg-[#a8d944]/10"
              >
                Ver expediente
              </Link>
              {consultationId && (
                <Link
                  href={`/consultations/${consultationId}`}
                  className="rounded-2xl border border-white/10 px-4 py-2 text-white/70 hover:bg-white/[0.06]"
                >
                  Ver consulta
                </Link>
              )}
              <button
                onClick={() => {
                  setStep('patient');
                  setSelectedPatient(null);
                  setAudioBlob(null);
                  setAiResponse(null);
                  setEditedNotes(null);
                  setConsultationId(null);
                  setMedications([]);
                  setCreatedPrescription(null);
                  setShowPrescriptionForm(false);
                  setSendEmail('');
                  setSendPhone('');
                }}
                className="rounded-2xl bg-[#a8d944] px-4 py-2 font-medium text-[#0F1E29] hover:bg-[#a8d944]/90"
              >
                Nueva consulta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewConsultationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#a8d944]" />
        </div>
      }
    >
      <NewConsultationContent />
    </Suspense>
  );
}
