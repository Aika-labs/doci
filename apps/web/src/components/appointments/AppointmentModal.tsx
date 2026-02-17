'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { X, Search } from 'lucide-react';
import { Appointment, Patient, patientsApi } from '@/lib/api';
import { useAuthCompat as useAuth } from '@/hooks/useAuthCompat';

const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Selecciona un paciente'),
  scheduledAt: z.string().min(1, 'Selecciona fecha y hora'),
  duration: z.number().min(15, 'Mínimo 15 minutos').max(240, 'Máximo 4 horas'),
  type: z.enum(['FIRST_VISIT', 'FOLLOW_UP', 'EMERGENCY', 'ROUTINE', 'PROCEDURE']),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AppointmentFormData) => Promise<void>;
  appointment?: Appointment;
  initialDate?: Date;
  preselectedPatientId?: string;
}

export function AppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  appointment,
  initialDate,
  preselectedPatientId,
}: AppointmentModalProps) {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      duration: 30,
      type: 'FOLLOW_UP',
    },
  });

  // Watch patientId for form state (used by form validation)
  watch('patientId');

  // Search patients
  const searchPatients = useCallback(
    async (search: string) => {
      try {
        const token = await getToken();
        if (!token) return;

        const response = await patientsApi.getAll(token, { search, limit: 10 });
        setPatients(response.data);
      } catch (error) {
        console.error('Error searching patients:', error);
      }
    },
    [getToken]
  );

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchPatients(searchTerm);
    } else {
      setPatients([]);
    }
  }, [searchTerm, searchPatients]);

  // Load preselected patient
  useEffect(() => {
    const loadPreselectedPatient = async () => {
      if (preselectedPatientId) {
        try {
          const token = await getToken();
          if (!token) return;

          const patient = await patientsApi.getById(token, preselectedPatientId);
          setSelectedPatient(patient);
          setValue('patientId', patient.id);
        } catch (error) {
          console.error('Error loading patient:', error);
        }
      }
    };

    loadPreselectedPatient();
  }, [preselectedPatientId, getToken, setValue]);

  // Set initial values when editing
  useEffect(() => {
    if (appointment) {
      reset({
        patientId: appointment.patientId,
        scheduledAt: format(new Date(appointment.scheduledAt), "yyyy-MM-dd'T'HH:mm"),
        duration: appointment.duration,
        type: appointment.type,
        reason: appointment.reason || '',
        notes: appointment.notes || '',
      });
      if (appointment.patient) {
        setSelectedPatient(appointment.patient);
      }
    } else if (initialDate) {
      setValue('scheduledAt', format(initialDate, "yyyy-MM-dd'T'HH:mm"));
    }
  }, [appointment, initialDate, reset, setValue]);

  const handleFormSubmit = async (data: AppointmentFormData) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
      reset();
      setSelectedPatient(null);
      onClose();
    } catch (error) {
      console.error('Error saving appointment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setValue('patientId', patient.id);
    setShowPatientSearch(false);
    setSearchTerm('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold text-white">
              {appointment ? 'Editar Cita' : 'Nueva Cita'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-2xl p-1 text-white/30 hover:bg-white/[0.06] hover:text-white/50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 p-4">
            {/* Patient Selection */}
            <div>
              <label className="mb-1 block text-sm font-medium text-white/70">Paciente *</label>
              {selectedPatient ? (
                <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 p-3">
                  <div>
                    <p className="font-medium text-white">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </p>
                    <p className="text-sm text-white/40">
                      {selectedPatient.email || selectedPatient.phone}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setValue('patientId', '');
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowPatientSearch(true);
                      }}
                      onFocus={() => setShowPatientSearch(true)}
                      placeholder="Buscar paciente..."
                      className="w-full rounded-2xl border border-white/[0.08] py-2 pr-4 pl-10 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  {showPatientSearch && patients.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-white/[0.06] bg-white shadow-lg">
                      {patients.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => selectPatient(patient)}
                          className="w-full border-b px-4 py-2 text-left last:border-b-0 hover:bg-white/[0.02]"
                        >
                          <p className="font-medium text-white">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-sm text-white/40">{patient.email || patient.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <input type="hidden" {...register('patientId')} />
              {errors.patientId && (
                <p className="mt-1 text-sm text-red-400">{errors.patientId.message}</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-white/70">
                  Fecha y Hora *
                </label>
                <input
                  type="datetime-local"
                  {...register('scheduledAt')}
                  className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
                />
                {errors.scheduledAt && (
                  <p className="mt-1 text-sm text-red-400">{errors.scheduledAt.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white/70">
                  Duración (min) *
                </label>
                <select
                  {...register('duration', { valueAsNumber: true })}
                  className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1 hora</option>
                  <option value={90}>1.5 horas</option>
                  <option value={120}>2 horas</option>
                </select>
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="mb-1 block text-sm font-medium text-white/70">Tipo de Cita *</label>
              <select
                {...register('type')}
                className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="FIRST_VISIT">Primera Visita</option>
                <option value="FOLLOW_UP">Seguimiento</option>
                <option value="ROUTINE">Rutina</option>
                <option value="PROCEDURE">Procedimiento</option>
                <option value="EMERGENCY">Emergencia</option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="mb-1 block text-sm font-medium text-white/70">
                Motivo de la Consulta
              </label>
              <input
                type="text"
                {...register('reason')}
                placeholder="Ej: Dolor de cabeza, revisión anual..."
                className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1 block text-sm font-medium text-white/70">Notas</label>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Notas adicionales..."
                className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/[0.08] bg-white px-4 py-2 text-white/70 hover:bg-white/[0.02]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
              >
                {isLoading ? 'Guardando...' : appointment ? 'Actualizar' : 'Crear Cita'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
