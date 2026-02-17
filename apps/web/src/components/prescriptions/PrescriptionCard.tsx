'use client';

import { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Shield,
  Pill,
  Calendar,
  XCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Prescription, prescriptionsApi } from '@/lib/api';
import { useToast } from '@/components/ui';

interface PrescriptionCardProps {
  prescription: Prescription;
  token: string;
  onInvalidate?: () => void;
}

export function PrescriptionCard({ prescription, token, onInvalidate }: PrescriptionCardProps) {
  const { success, error: showError } = useToast();
  const [copied, setCopied] = useState(false);
  const [isInvalidating, setIsInvalidating] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(prescription.securityCode);
      setCopied(true);
      success('Código copiado', 'El código de verificación ha sido copiado');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError('Error', 'No se pudo copiar el código');
    }
  };

  const handleDownloadPdf = () => {
    const pdfUrl = prescriptionsApi.getPdfUrl(prescription.id);
    window.open(`${pdfUrl}?token=${token}`, '_blank');
  };

  const handleInvalidate = async () => {
    if (!confirm('¿Estás seguro de invalidar esta receta? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setIsInvalidating(true);
      await prescriptionsApi.invalidate(token, prescription.id);
      success('Receta invalidada', 'La receta ha sido marcada como inválida');
      onInvalidate?.();
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'No se pudo invalidar la receta');
    } finally {
      setIsInvalidating(false);
    }
  };

  const isExpired = prescription.expiresAt && new Date(prescription.expiresAt) < new Date();

  return (
    <div
      className={`rounded-[2rem] border bg-white ${
        !prescription.isValid || isExpired ? 'border-red-200 bg-red-50/50' : 'border-white/[0.06]'
      } overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              !prescription.isValid || isExpired
                ? 'bg-red-500/15 text-red-400'
                : 'bg-blue-500/15 text-blue-400'
            }`}
          >
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-white">Receta Médica</h3>
            <p className="text-sm text-white/40">
              {new Date(prescription.createdAt).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {!prescription.isValid ? (
          <span className="rounded-full bg-red-500/15 px-3 py-1 text-sm font-medium text-red-300">
            Invalidada
          </span>
        ) : isExpired ? (
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-300">
            Expirada
          </span>
        ) : (
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-300">
            Válida
          </span>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4 p-4">
        {/* Diagnosis */}
        {prescription.diagnosis && (
          <div>
            <p className="mb-1 text-sm font-medium text-white/40">Diagnóstico</p>
            <p className="text-white">{prescription.diagnosis}</p>
          </div>
        )}

        {/* Medications */}
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-white/40">
            <Pill className="h-4 w-4" />
            Medicamentos ({prescription.medications.length})
          </p>
          <div className="space-y-2">
            {prescription.medications.map((med, index) => (
              <div key={index} className="rounded-2xl bg-white/[0.02] p-3">
                <p className="font-medium text-white">{med.name}</p>
                <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-white/50">
                  <span>Dosis: {med.dose}</span>
                  <span>Frecuencia: {med.frequency}</span>
                  <span>Duración: {med.duration}</span>
                  {med.quantity && <span>Cantidad: {med.quantity}</span>}
                </div>
                {med.instructions && (
                  <p className="mt-2 text-sm text-white/40 italic">{med.instructions}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* General Instructions */}
        {prescription.instructions && (
          <div>
            <p className="mb-1 text-sm font-medium text-white/40">Indicaciones generales</p>
            <p className="text-sm text-white/70">{prescription.instructions}</p>
          </div>
        )}

        {/* Expiration */}
        {prescription.expiresAt && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-white/30" />
            <span className={isExpired ? 'text-red-400' : 'text-white/50'}>
              {isExpired ? 'Expiró el' : 'Válida hasta'}:{' '}
              {new Date(prescription.expiresAt).toLocaleDateString('es-MX')}
            </span>
          </div>
        )}

        {/* Security Code */}
        <div className="flex items-center gap-2 rounded-2xl bg-white/[0.02] p-3">
          <Shield className="h-4 w-4 text-white/30" />
          <span className="text-sm text-white/50">Código:</span>
          <code className="flex-1 truncate font-mono text-sm text-white">
            {prescription.securityCode}
          </code>
          <button
            onClick={handleCopyCode}
            className="rounded p-1.5 text-white/30 hover:bg-white/10 hover:text-white/50"
            title="Copiar código"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-gray-100 bg-white/[0.02] p-4">
        <button
          onClick={handleDownloadPdf}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white hover:from-blue-600 hover:to-cyan-600"
        >
          <Download className="h-4 w-4" />
          Descargar PDF
        </button>

        <a
          href={`/verify?code=${prescription.securityCode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-2xl border border-white/[0.08] px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/[0.06]"
        >
          <ExternalLink className="h-4 w-4" />
          Verificar
        </a>

        {prescription.isValid && (
          <button
            onClick={handleInvalidate}
            disabled={isInvalidating}
            className="ml-auto flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-50 disabled:opacity-50"
          >
            {isInvalidating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Invalidar
          </button>
        )}
      </div>
    </div>
  );
}
