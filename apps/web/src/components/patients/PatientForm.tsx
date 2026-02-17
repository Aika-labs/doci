'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientSchema, PatientFormData } from '@/lib/validations/patient';
import { Patient } from '@/lib/api';
import { useToast } from '@/components/ui';

interface PatientFormProps {
  patient?: Patient;
  onSubmit: (data: PatientFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PatientForm({ patient, onSubmit, onCancel, isLoading }: PatientFormProps) {
  const { warning } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient
      ? {
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email || '',
          phone: patient.phone || '',
          dateOfBirth: patient.dateOfBirth.split('T')[0],
          gender: patient.gender,
          bloodType: patient.bloodType || '',
          allergies: patient.allergies?.join(', ') || '',
          currentMedications: patient.currentMedications?.join(', ') || '',
          address: patient.address || '',
          city: patient.city || '',
          state: patient.state || '',
          country: patient.country || '',
          postalCode: patient.postalCode || '',
          notes: patient.notes || '',
          emergencyContactName: (patient.emergencyContact as Record<string, string>)?.name || '',
          emergencyContactPhone: (patient.emergencyContact as Record<string, string>)?.phone || '',
          emergencyContactRelation:
            (patient.emergencyContact as Record<string, string>)?.relation || '',
          insuranceProvider: (patient.insuranceInfo as Record<string, string>)?.provider || '',
          insurancePolicyNumber:
            (patient.insuranceInfo as Record<string, string>)?.policyNumber || '',
        }
      : {
          gender: 'MALE',
        },
  });

  // Show toast when form has validation errors
  useEffect(() => {
    if (isSubmitted && Object.keys(errors).length > 0) {
      const errorCount = Object.keys(errors).length;
      warning(
        'Formulario incompleto',
        `Por favor corrige ${errorCount} ${errorCount === 1 ? 'campo' : 'campos'} requerido${errorCount === 1 ? '' : 's'}`
      );
    }
  }, [isSubmitted, errors, warning]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Información Personal */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Información Personal</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Nombre *</label>
            <input
              {...register('firstName')}
              type="text"
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Juan"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-400">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Apellido *</label>
            <input
              {...register('lastName')}
              type="text"
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Pérez"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-400">{errors.lastName.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">
              Fecha de Nacimiento *
            </label>
            <input
              {...register('dateOfBirth')}
              type="date"
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-red-400">{errors.dateOfBirth.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Género *</label>
            <select
              {...register('gender')}
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="MALE">Masculino</option>
              <option value="FEMALE">Femenino</option>
              <option value="OTHER">Otro</option>
            </select>
            {errors.gender && <p className="mt-1 text-sm text-red-400">{errors.gender.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              placeholder="juan@ejemplo.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Teléfono</label>
            <input
              {...register('phone')}
              type="tel"
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              placeholder="+52 55 1234 5678"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Tipo de Sangre</label>
            <select
              {...register('bloodType')}
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Seleccionar...</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </div>
      </div>

      {/* Información Médica */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Información Médica</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Alergias</label>
            <input
              {...register('allergies')}
              type="text"
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Penicilina, Mariscos (separar con comas)"
            />
            <p className="mt-1 text-xs text-white/40">Separar múltiples alergias con comas</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">
              Medicamentos Actuales
            </label>
            <input
              {...register('currentMedications')}
              type="text"
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Metformina 500mg, Losartán 50mg (separar con comas)"
            />
            <p className="mt-1 text-xs text-white/40">Separar múltiples medicamentos con comas</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">
              Notas Adicionales
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Información adicional relevante..."
            />
          </div>
        </div>
      </div>

      {/* Dirección */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Dirección</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-white/70">Dirección</label>
            <input
              {...register('address')}
              type="text"
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Calle y número"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Ciudad</label>
            <input
              {...register('city')}
              type="text"
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Ciudad de México"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Estado</label>
            <input
              {...register('state')}
              type="text"
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              placeholder="CDMX"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">País</label>
            <input
              {...register('country')}
              type="text"
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              placeholder="México"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Código Postal</label>
            <input
              {...register('postalCode')}
              type="text"
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              placeholder="06600"
            />
          </div>
        </div>
      </div>

      {/* Contacto de Emergencia */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Contacto de Emergencia</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Nombre</label>
            <input
              {...register('emergencyContactName')}
              type="text"
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              placeholder="María García"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Teléfono</label>
            <input
              {...register('emergencyContactPhone')}
              type="tel"
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              placeholder="+52 55 9876 5432"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Relación</label>
            <input
              {...register('emergencyContactRelation')}
              type="text"
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Esposa"
            />
          </div>
        </div>
      </div>

      {/* Seguro Médico */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Seguro Médico</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Aseguradora</label>
            <input
              {...register('insuranceProvider')}
              type="text"
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              placeholder="GNP Seguros"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Número de Póliza</label>
            <input
              {...register('insurancePolicyNumber')}
              type="text"
              className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              placeholder="POL-123456"
            />
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-white/[0.08] bg-white px-4 py-2 text-white/70 transition-colors hover:bg-white/[0.02]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white transition-colors hover:from-blue-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Guardando...' : patient ? 'Actualizar' : 'Crear Paciente'}
        </button>
      </div>
    </form>
  );
}
