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
  Loader2
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
    <div className={`bg-white rounded-xl border ${
      !prescription.isValid || isExpired 
        ? 'border-red-200 bg-red-50/50' 
        : 'border-gray-200'
    } overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            !prescription.isValid || isExpired 
              ? 'bg-red-100 text-red-600' 
              : 'bg-blue-100 text-blue-600'
          }`}>
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Receta Médica</h3>
            <p className="text-sm text-gray-500">
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
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            Invalidada
          </span>
        ) : isExpired ? (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            Expirada
          </span>
        ) : (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Válida
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Diagnosis */}
        {prescription.diagnosis && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Diagnóstico</p>
            <p className="text-gray-900">{prescription.diagnosis}</p>
          </div>
        )}

        {/* Medications */}
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Medicamentos ({prescription.medications.length})
          </p>
          <div className="space-y-2">
            {prescription.medications.map((med, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{med.name}</p>
                <div className="mt-1 text-sm text-gray-600 grid grid-cols-2 gap-x-4 gap-y-1">
                  <span>Dosis: {med.dose}</span>
                  <span>Frecuencia: {med.frequency}</span>
                  <span>Duración: {med.duration}</span>
                  {med.quantity && <span>Cantidad: {med.quantity}</span>}
                </div>
                {med.instructions && (
                  <p className="mt-2 text-sm text-gray-500 italic">{med.instructions}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* General Instructions */}
        {prescription.instructions && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Indicaciones generales</p>
            <p className="text-gray-700 text-sm">{prescription.instructions}</p>
          </div>
        )}

        {/* Expiration */}
        {prescription.expiresAt && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className={isExpired ? 'text-red-600' : 'text-gray-600'}>
              {isExpired ? 'Expiró el' : 'Válida hasta'}: {' '}
              {new Date(prescription.expiresAt).toLocaleDateString('es-MX')}
            </span>
          </div>
        )}

        {/* Security Code */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Shield className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">Código:</span>
          <code className="text-sm font-mono text-gray-900 flex-1 truncate">
            {prescription.securityCode}
          </code>
          <button
            onClick={handleCopyCode}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
            title="Copiar código"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 p-4 border-t border-gray-100 bg-gray-50">
        <button
          onClick={handleDownloadPdf}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Download className="h-4 w-4" />
          Descargar PDF
        </button>
        
        <a
          href={`/verify?code=${prescription.securityCode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium"
        >
          <ExternalLink className="h-4 w-4" />
          Verificar
        </a>

        {prescription.isValid && (
          <button
            onClick={handleInvalidate}
            disabled={isInvalidating}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium ml-auto disabled:opacity-50"
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
