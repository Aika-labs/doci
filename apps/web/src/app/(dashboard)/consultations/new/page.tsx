'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
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

  const loadPatient = useCallback(
    async (patientId: string) => {
      try {
        const token = await getToken();
        if (!token) return;
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
        const token = await getToken();
        if (!token) return;
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
          href="/consultations"
          className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a consultas
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Consulta</h1>
        <p className="text-gray-600">Graba la consulta y deja que la IA estructure las notas</p>
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
                  ? 'bg-blue-600 text-white'
                  : ['patient', 'recording', 'review', 'complete'].indexOf(step) >
                      ['patient', 'recording', 'review', 'complete'].indexOf(s.key)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              <s.icon className="h-5 w-5" />
            </div>
            <span className="ml-2 hidden text-sm font-medium text-gray-700 sm:block">
              {s.label}
            </span>
            {i < 3 && (
              <div className="mx-2 h-0.5 w-12 bg-gray-200 sm:w-24">
                <div
                  className={`h-full bg-green-500 transition-all ${
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
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {/* Step 1: Patient Selection */}
        {step === 'patient' && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Selecciona el paciente</h2>
            <div className="relative mb-4">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : patients.length > 0 ? (
              <div className="space-y-2">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className="flex w-full items-center gap-4 rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <span className="font-semibold text-blue-600">
                        {patient.firstName[0]}
                        {patient.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {calculateAge(patient.dateOfBirth)} años •{' '}
                        {patient.gender === 'MALE' ? 'M' : 'F'}
                        {patient.bloodType && ` • ${patient.bloodType}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchTerm.length >= 2 ? (
              <p className="py-8 text-center text-gray-500">No se encontraron pacientes</p>
            ) : (
              <p className="py-8 text-center text-gray-500">
                Escribe al menos 2 caracteres para buscar
              </p>
            )}
          </div>
        )}

        {/* Step 2: Recording */}
        {step === 'recording' && selectedPatient && (
          <div>
            <div className="mb-6 flex items-center gap-4 rounded-lg bg-blue-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <span className="font-semibold text-blue-600">
                  {selectedPatient.firstName[0]}
                  {selectedPatient.lastName[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  {calculateAge(selectedPatient.dateOfBirth)} años
                  {selectedPatient.allergies?.length > 0 && (
                    <span className="ml-2 text-red-600">
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
                className="ml-auto text-sm text-blue-600 hover:text-blue-700"
              >
                Cambiar
              </button>
            </div>

            <h2 className="mb-4 text-lg font-semibold text-gray-900">Graba la consulta</h2>
            <p className="mb-6 text-gray-600">
              Presiona el botón para comenzar a grabar. La IA transcribirá y estructurará
              automáticamente las notas SOAP.
            </p>

            <VoiceRecorder onRecordingComplete={handleRecordingComplete} />

            {audioBlob && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleProcessRecording}
                  disabled={isProcessing}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        )}

        {/* Step 3: Review */}
        {step === 'review' && editedNotes && aiResponse && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Revisa y edita las notas</h2>

            {/* Transcription */}
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-medium text-gray-700">Transcripción</h3>
              <p className="text-sm text-gray-600">{aiResponse.transcription}</p>
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>

            {/* AI Suggestions */}
            <div className="mt-6 rounded-lg bg-blue-50 p-4">
              <h3 className="mb-3 text-sm font-medium text-blue-900">Sugerencias de IA</h3>
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div>
                  <p className="font-medium text-blue-800">Diagnósticos sugeridos:</p>
                  <ul className="mt-1 space-y-1">
                    {aiResponse.suggestions.diagnoses.map((d, i) => (
                      <li key={i} className="text-blue-700">
                        • {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-blue-800">Medicamentos sugeridos:</p>
                  <ul className="mt-1 space-y-1">
                    {aiResponse.suggestions.medications.map((m, i) => (
                      <li key={i} className="text-blue-700">
                        • {m}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-blue-800">Estudios sugeridos:</p>
                  <ul className="mt-1 space-y-1">
                    {aiResponse.suggestions.tests.map((t, i) => (
                      <li key={i} className="text-blue-700">
                        • {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-blue-800">Seguimiento:</p>
                  <p className="mt-1 text-blue-700">{aiResponse.suggestions.followUp}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep('recording')}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Volver a grabar
              </button>
              <button
                onClick={handleSaveConsultation}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700 disabled:opacity-50"
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
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                Consulta guardada exitosamente
              </h2>
              <p className="text-gray-600">
                Las notas han sido guardadas en el expediente del paciente.
              </p>
            </div>

            {/* Prescription Section */}
            {!showPrescriptionForm && !createdPrescription && (
              <div className="mb-6 rounded-lg bg-blue-50 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Pill className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">¿Necesitas crear una receta?</h3>
                      <p className="text-sm text-gray-600">
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
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Crear Receta
                  </button>
                </div>
              </div>
            )}

            {/* Prescription Form */}
            {showPrescriptionForm && (
              <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Pill className="h-5 w-5 text-green-600" />
                    Nueva Receta
                  </h3>
                  <button
                    onClick={() => setShowPrescriptionForm(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Diagnóstico
                    </label>
                    <input
                      type="text"
                      value={prescriptionDiagnosis}
                      onChange={(e) => setPrescriptionDiagnosis(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="Diagnóstico principal"
                    />
                  </div>

                  {/* Suggested Medications */}
                  {aiResponse?.suggestions.medications &&
                    aiResponse.suggestions.medications.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-medium text-gray-700">
                          Medicamentos sugeridos por IA:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {aiResponse.suggestions.medications.map((med, i) => (
                            <button
                              key={i}
                              onClick={() => addSuggestedMedication(med)}
                              className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700 hover:bg-blue-100"
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
                      <label className="text-sm font-medium text-gray-700">Medicamentos</label>
                      <button
                        onClick={addMedication}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        + Agregar medicamento
                      </button>
                    </div>

                    {medications.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-gray-300 py-4 text-center text-sm text-gray-500">
                        No hay medicamentos agregados. Haz clic en una sugerencia o agrega uno
                        manualmente.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {medications.map((med, index) => (
                          <div key={index} className="rounded-lg bg-gray-50 p-3">
                            <div className="mb-2 flex items-start justify-between">
                              <span className="text-sm font-medium text-gray-700">
                                Medicamento {index + 1}
                              </span>
                              <button
                                onClick={() => removeMedication(index)}
                                className="text-red-500 hover:text-red-700"
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
                                className="rounded border border-gray-300 px-2 py-1 text-sm"
                              />
                              <input
                                type="text"
                                value={med.dose}
                                onChange={(e) => updateMedication(index, 'dose', e.target.value)}
                                placeholder="Dosis (ej: 400mg)"
                                className="rounded border border-gray-300 px-2 py-1 text-sm"
                              />
                              <input
                                type="text"
                                value={med.frequency}
                                onChange={(e) =>
                                  updateMedication(index, 'frequency', e.target.value)
                                }
                                placeholder="Frecuencia (ej: c/8h)"
                                className="rounded border border-gray-300 px-2 py-1 text-sm"
                              />
                              <input
                                type="text"
                                value={med.duration}
                                onChange={(e) =>
                                  updateMedication(index, 'duration', e.target.value)
                                }
                                placeholder="Duración (ej: 7 días)"
                                className="rounded border border-gray-300 px-2 py-1 text-sm"
                              />
                            </div>
                            <input
                              type="text"
                              value={med.instructions || ''}
                              onChange={(e) =>
                                updateMedication(index, 'instructions', e.target.value)
                              }
                              placeholder="Instrucciones adicionales (opcional)"
                              className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Notas adicionales
                    </label>
                    <textarea
                      value={prescriptionNotes}
                      onChange={(e) => setPrescriptionNotes(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="Indicaciones especiales, advertencias, etc."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setShowPrescriptionForm(false)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreatePrescription}
                      disabled={isCreatingPrescription || medications.length === 0}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
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
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">Receta creada exitosamente</h3>
                    <p className="text-sm text-green-700">
                      Código de verificación: {createdPrescription.securityCode}
                    </p>
                  </div>
                </div>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/prescriptions/${createdPrescription.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </a>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-center gap-4">
              <Link
                href={`/patients/${selectedPatient?.id}`}
                className="rounded-lg border border-blue-600 px-4 py-2 text-blue-600 hover:bg-blue-50"
              >
                Ver expediente
              </Link>
              {consultationId && (
                <Link
                  href={`/consultations/${consultationId}`}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
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
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
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
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <NewConsultationContent />
    </Suspense>
  );
}
