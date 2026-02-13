'use client';

import { useState } from 'react';
import { Search, CheckCircle, XCircle, Shield, FileText, User, Stethoscope, Calendar, Loader2 } from 'lucide-react';
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
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Doci</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="h-4 w-4" />
            Verificación segura
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verificar Receta Médica
          </h1>
          <p className="text-gray-600">
            Ingresa el código de seguridad para verificar la autenticidad de una receta
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleVerify} className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de verificación
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ej: clxyz123abc..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !code.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
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
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`rounded-2xl shadow-lg overflow-hidden ${
            result.valid ? 'bg-white' : 'bg-red-50'
          }`}>
            {/* Status Header */}
            <div className={`p-6 ${
              result.valid 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                : 'bg-gradient-to-r from-red-500 to-rose-600'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  result.valid ? 'bg-white/20' : 'bg-white/20'
                }`}>
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
                      : result.message || 'No se pudo verificar la receta'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Details */}
            {result.valid && result.prescription && (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Paciente</p>
                    <p className="font-semibold text-gray-900">{result.prescription.patient}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Stethoscope className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Médico</p>
                    <p className="font-semibold text-gray-900">Dr(a). {result.prescription.doctor}</p>
                    {result.prescription.licenseNumber && (
                      <p className="text-sm text-gray-500">Cédula: {result.prescription.licenseNumber}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
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
            Este sistema de verificación permite confirmar la autenticidad de las recetas
            emitidas a través de la plataforma Doci.
          </p>
          <p className="mt-2">
            Si tienes dudas sobre una receta, contacta directamente al consultorio médico.
          </p>
        </div>
      </main>
    </div>
  );
}
