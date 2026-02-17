'use client';

import { useState } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  Shield,
  FileText,
  User,
  Stethoscope,
  Calendar,
  Loader2,
} from 'lucide-react';
import { prescriptionsApi, PrescriptionVerification } from '@/lib/api';
import Link from 'next/link';

export default function VerifyPrescriptionPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<PrescriptionVerification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const verification = await prescriptionsApi.verify(code.trim());
      setResult(verification);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar la receta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Doci</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="h-4 w-4" />
            Verificación segura
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12">
        {/* Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Verificar Receta Médica</h1>
          <p className="text-gray-600">
            Ingresa el código de seguridad para verificar la autenticidad de una receta
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleVerify} className="mb-8">
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Código de verificación
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ej: clxyz123abc..."
                  className="w-full rounded-xl border border-gray-300 py-3 pr-4 pl-12 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !code.trim()}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar'
                )}
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              El código se encuentra en la parte superior derecha de la receta impresa
            </p>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <XCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            className={`overflow-hidden rounded-2xl shadow-lg ${
              result.valid ? 'bg-white' : 'bg-red-50'
            }`}
          >
            {/* Status Header */}
            <div
              className={`p-6 ${
                result.valid
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                  : 'bg-gradient-to-r from-red-500 to-rose-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full ${
                    result.valid ? 'bg-white/20' : 'bg-white/20'
                  }`}
                >
                  {result.valid ? (
                    <CheckCircle className="h-8 w-8 text-white" />
                  ) : (
                    <XCircle className="h-8 w-8 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {result.valid ? 'Receta Válida' : 'Receta No Válida'}
                  </h2>
                  <p className="text-white/80">
                    {result.valid
                      ? 'Esta receta es auténtica y está vigente'
                      : result.message || 'No se pudo verificar la receta'}
                  </p>
                </div>
              </div>
            </div>

            {/* Details */}
            {result.valid && result.prescription && (
              <div className="space-y-4 p-6">
                <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Paciente</p>
                    <p className="font-semibold text-gray-900">{result.prescription.patient}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <Stethoscope className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Médico</p>
                    <p className="font-semibold text-gray-900">
                      Dr(a). {result.prescription.doctor}
                    </p>
                    {result.prescription.licenseNumber && (
                      <p className="text-sm text-gray-500">
                        Cédula: {result.prescription.licenseNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha de emisión</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(result.prescription.createdAt).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Este sistema de verificación permite confirmar la autenticidad de las recetas emitidas a
            través de la plataforma Doci.
          </p>
          <p className="mt-2">
            Si tienes dudas sobre una receta, contacta directamente al consultorio médico.
          </p>
        </div>
      </main>
    </div>
  );
}
