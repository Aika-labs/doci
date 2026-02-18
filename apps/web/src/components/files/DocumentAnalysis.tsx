'use client';

import { useState } from 'react';
import { useAuthCompat as useAuth } from '@/hooks/useAuthCompat';
import {
  Brain,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileSearch,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AIAnalysis {
  summary: string;
  findings: string[];
  confidence: number;
}

interface DocumentAnalysisProps {
  /** ID of the PatientFile to analyze. */
  fileId: string;
  /** Optional patient ID for enriched context. */
  patientId?: string;
  /** Pre-existing analysis result (if already analyzed). */
  existingAnalysis?: AIAnalysis | null;
  /** Callback after a successful analysis. */
  onAnalysisComplete?: (analysis: AIAnalysis) => void;
}

/**
 * Component that displays AI analysis results for a medical document
 * and provides a button to trigger analysis if not yet performed.
 */
export function DocumentAnalysis({
  fileId,
  patientId,
  existingAnalysis,
  onAnalysisComplete,
}: DocumentAnalysisProps) {
  const { getToken } = useAuth();
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(existingAnalysis ?? null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        setError('No estás autenticado');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/ai/analyze-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileId, patientId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const result = await response.json();
      const analysisData = result.data as AIAnalysis;
      setAnalysis(analysisData);
      onAnalysisComplete?.(analysisData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al analizar el documento';
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceLabel = (confidence: number): { text: string; color: string } => {
    if (confidence >= 0.8) return { text: 'Alta', color: 'text-emerald-400' };
    if (confidence >= 0.5) return { text: 'Media', color: 'text-amber-400' };
    return { text: 'Baja', color: 'text-red-400' };
  };

  const getConfidenceBarColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-emerald-500';
    if (confidence >= 0.5) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // No analysis yet: show the trigger button
  if (!analysis && !isAnalyzing && !error) {
    return (
      <button
        onClick={handleAnalyze}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#a8d944]/30 bg-[#a8d944]/10 px-4 py-3 text-sm font-medium text-[#a8d944] transition-colors hover:bg-[#a8d944]/20"
      >
        <Brain className="h-4 w-4" />
        Analizar con IA
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03]">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <FileSearch className="h-4 w-4 text-[#a8d944]" />
          <span className="text-sm font-medium text-white">Análisis IA</span>
          {analysis && (
            <span className={`text-xs ${getConfidenceLabel(analysis.confidence).color}`}>
              ({getConfidenceLabel(analysis.confidence).text})
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-white/30" />
        ) : (
          <ChevronDown className="h-4 w-4 text-white/30" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-white/[0.06] p-4">
          {/* Loading state */}
          {isAnalyzing && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-[#a8d944]" />
              <p className="text-sm text-white/50">Analizando documento con IA...</p>
              <p className="text-xs text-white/30">Esto puede tomar unos segundos</p>
            </div>
          )}

          {/* Error state */}
          {error && !isAnalyzing && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl bg-red-500/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-400">Error en el análisis</p>
                  <p className="mt-1 text-xs text-red-400/70">{error}</p>
                </div>
              </div>
              <button
                onClick={handleAnalyze}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/[0.02]"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Analysis results */}
          {analysis && !isAnalyzing && (
            <div className="space-y-4">
              {/* Confidence bar */}
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-white/40">Confianza del análisis</span>
                  <span className={getConfidenceLabel(analysis.confidence).color}>
                    {Math.round(analysis.confidence * 100)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full transition-all ${getConfidenceBarColor(analysis.confidence)}`}
                    style={{ width: `${analysis.confidence * 100}%` }}
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-white/50">
                  <CheckCircle className="h-3.5 w-3.5 text-[#a8d944]" />
                  Resumen
                </h4>
                <p className="text-sm leading-relaxed text-white/80">{analysis.summary}</p>
              </div>

              {/* Findings */}
              {analysis.findings.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-medium text-white/50">
                    Hallazgos ({analysis.findings.length})
                  </h4>
                  <ul className="space-y-2">
                    {analysis.findings.map((finding, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 rounded-xl bg-white/[0.02] p-3 text-sm text-white/70"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#a8d944]/15 text-xs font-medium text-[#a8d944]">
                          {index + 1}
                        </span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Re-analyze button */}
              <button
                onClick={handleAnalyze}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-white/40 transition-colors hover:bg-white/[0.02] hover:text-white/60"
              >
                <Brain className="h-3.5 w-3.5" />
                Volver a analizar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
