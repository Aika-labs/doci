'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { X, Search } from 'lucide-react';
import { Appointment, Patient, patientsApi } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';

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
  const searchPatients = useCallback(async (search: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await patientsApi.getAll(token, { search, limit: 10 });
      setPatients(response.data);
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  }, [getToken]);

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
        
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {appointment ? 'Editar Cita' : 'Nueva Cita'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paciente *
              </label>
              {selectedPatient ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{selectedPatient.email || selectedPatient.phone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setValue('patientId', '');
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowPatientSearch(true);
                      }}
                      onFocus={() => setShowPatientSearch(true)}
                      placeholder="Buscar paciente..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {showPatientSearch && patients.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {patients.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => selectPatient(patient)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <p className="font-medium text-gray-900">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{patient.email || patient.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <input type="hidden" {...register('patientId')} />
              {errors.patientId && (
                <p className="mt-1 text-sm text-red-600">{errors.patientId.message}</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha y Hora *
                </label>
                <input
                  type="datetime-local"
                  {...register('scheduledAt')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.scheduledAt && (
                  <p className="mt-1 text-sm text-red-600">{errors.scheduledAt.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración (min) *
                </label>
                <select
                  {...register('duration', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Cita *
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo de la Consulta
              </label>
              <input
                type="text"
                {...register('reason')}
                placeholder="Ej: Dolor de cabeza, revisión anual..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Notas adicionales..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
