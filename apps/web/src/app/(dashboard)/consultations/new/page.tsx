'use client';

import { useState } from 'react';
import { VoiceRecorder } from '@/components/voice';
import { FileText, Sparkles, Save, ChevronRight } from 'lucide-react';

export default function NewConsultationPage() {
  const [transcription, setTranscription] = useState('');
  const [structuredNotes, setStructuredNotes] = useState<{
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const handleTranscription = (text: string) => {
    setTranscription((prev) => (prev ? `${prev} ${text}` : text));
  };

  const handleStructure = async () => {
    if (!transcription.trim()) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription,
          patientId: selectedPatient,
          includeHistory: true,
        }),
      });

      if (!response.ok) throw new Error('Error al estructurar');

      const data = await response.json();
      setStructuredNotes(data.soapNotes);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nueva Consulta</h1>
        <p className="text-slate-500">
          Dicta tus notas y la IA las estructurará automáticamente
        </p>
      </div>

      {/* Patient selector */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Paciente</h2>
        <div className="mt-4">
          <select
            value={selectedPatient || ''}
            onChange={(e) => setSelectedPatient(e.target.value || null)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Selecciona un paciente...</option>
            <option value="patient-1">María García - 35 años</option>
            <option value="patient-2">Juan Pérez - 42 años</option>
            <option value="patient-3">Ana López - 28 años</option>
          </select>
        </div>
      </div>

      {/* Voice recorder */}
      <div className="rounded-xl border bg-white p-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">Dictado por voz</h2>
          <p className="mt-1 text-sm text-slate-500">
            Presiona el botón y comienza a dictar tus notas clínicas
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <VoiceRecorder
            onTranscription={handleTranscription}
            patientId={selectedPatient || undefined}
          />
        </div>

        {/* Transcription preview */}
        {transcription && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700">Transcripción</h3>
              <button
                onClick={() => setTranscription('')}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Limpiar
              </button>
            </div>
            <div className="mt-2 rounded-lg bg-slate-50 p-4">
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {transcription}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* AI Structure button */}
      {transcription && !structuredNotes && (
        <div className="flex justify-center">
          <button
            onClick={handleStructure}
            disabled={isProcessing}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Procesando...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Estructurar con IA
              </>
            )}
          </button>
        </div>
      )}

      {/* Structured notes */}
      {structuredNotes && (
        <div className="rounded-xl border bg-white p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Notas SOAP estructuradas
            </h2>
          </div>

          <div className="mt-6 space-y-6">
            <SOAPSection
              title="Subjetivo"
              description="Lo que el paciente reporta"
              content={structuredNotes.subjective}
            />
            <SOAPSection
              title="Objetivo"
              description="Hallazgos del examen físico"
              content={structuredNotes.objective}
            />
            <SOAPSection
              title="Análisis"
              description="Diagnóstico y evaluación"
              content={structuredNotes.assessment}
            />
            <SOAPSection
              title="Plan"
              description="Plan de tratamiento"
              content={structuredNotes.plan}
            />
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={() => setStructuredNotes(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Editar
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              <Save className="h-4 w-4" />
              Guardar consulta
            </button>
          </div>
        </div>
      )}

      {/* Next steps */}
      {structuredNotes && (
        <div className="grid gap-4 md:grid-cols-2">
          <NextStepCard
            href="/dashboard/prescriptions/new"
            icon="💊"
            title="Crear receta"
            description="Genera una receta médica digital"
          />
          <NextStepCard
            href="/dashboard/appointments/new"
            icon="📅"
            title="Agendar seguimiento"
            description="Programa la próxima cita"
          />
        </div>
      )}
    </div>
  );
}

function SOAPSection({
  title,
  description,
  content,
}: {
  title: string;
  description: string;
  content?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-500">({description})</span>
      </div>
      <div className="mt-2 rounded-lg border border-slate-200 p-4">
        <p className="whitespace-pre-wrap text-sm text-slate-700">
          {content || 'Sin información'}
        </p>
      </div>
    </div>
  );
}

function NextStepCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-between rounded-xl border bg-white p-4 transition-colors hover:border-blue-300"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="font-medium text-slate-900">{title}</p>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </a>
  );
}
