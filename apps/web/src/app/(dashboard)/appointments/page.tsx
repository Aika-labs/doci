'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { format, startOfMonth, endOfMonth, addMonths, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { AppointmentCalendar, AppointmentModal } from '@/components/appointments';
import { appointmentsApi, Appointment } from '@/lib/api';
import {
  Plus,
  Calendar,
  List,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Phone,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui';

type ViewMode = 'calendar' | 'list' | 'day';

export default function AppointmentsPage() {
  const { getToken } = useAuth();
  const { success, error: showError } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [currentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDay, setSelectedDay] = useState(new Date());

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      const start = startOfMonth(addMonths(currentMonth, -1)).toISOString();
      const end = endOfMonth(addMonths(currentMonth, 1)).toISOString();

      const response = await appointmentsApi.getAll(token, { start, end });
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, currentMonth]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleDateSelect = (start: Date) => {
    setSelectedDate(start);
    setSelectedAppointment(undefined);
    setIsModalOpen(true);
  };

  const handleEventClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDate(undefined);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: {
    patientId: string;
    scheduledAt: string;
    duration: number;
    type: 'FIRST_VISIT' | 'FOLLOW_UP' | 'EMERGENCY' | 'ROUTINE' | 'PROCEDURE';
    reason?: string;
    notes?: string;
  }) => {
    const token = await getToken();
    if (!token) return;

    try {
      if (selectedAppointment) {
        await appointmentsApi.update(token, selectedAppointment.id, {
          ...data,
          scheduledAt: new Date(data.scheduledAt).toISOString(),
        });
        success('Cita actualizada', 'Los cambios han sido guardados');
      } else {
        await appointmentsApi.create(token, {
          ...data,
          scheduledAt: new Date(data.scheduledAt).toISOString(),
        });
        success('Cita creada', 'La cita ha sido agendada correctamente');
      }
      await fetchAppointments();
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'No se pudo guardar la cita');
    }
  };

  const handleStatusChange = async (appointmentId: string, status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW') => {
    try {
      const token = await getToken();
      if (!token) return;

      await appointmentsApi.update(token, appointmentId, { status });
      await fetchAppointments();
      
      const statusMessages: Record<string, string> = {
        COMPLETED: 'Cita marcada como completada',
        CANCELLED: 'Cita cancelada',
        NO_SHOW: 'Paciente marcado como no asistió',
        CONFIRMED: 'Cita confirmada',
      };
      success('Estado actualizado', statusMessages[status] || 'Estado de la cita actualizado');
    } catch (error) {
      console.error('Error updating appointment status:', error);
      showError('Error', 'No se pudo actualizar el estado de la cita');
    }
  };

  // Helper to get start/end times from appointment
  const getStartTime = (apt: Appointment) => new Date(apt.scheduledAt);
  const getEndTime = (apt: Appointment) => {
    const start = new Date(apt.scheduledAt);
    return new Date(start.getTime() + apt.duration * 60000);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(undefined);
    setSelectedDate(undefined);
  };

  // Stats
  const todayAppointments = appointments.filter((apt) =>
    isSameDay(getStartTime(apt), new Date())
  );
  const upcomingAppointments = appointments.filter(
    (apt) => getStartTime(apt) > new Date() && apt.status !== 'CANCELLED'
  );
  const completedToday = todayAppointments.filter((apt) => apt.status === 'COMPLETED').length;

  // Day view appointments
  const dayAppointments = appointments
    .filter((apt) => isSameDay(getStartTime(apt), selectedDay))
    .sort((a, b) => getStartTime(a).getTime() - getStartTime(b).getTime());

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'NO_SHOW':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-700',
      CONFIRMED: 'bg-blue-100 text-blue-700',
      SCHEDULED: 'bg-gray-100 text-gray-700',
      CANCELLED: 'bg-red-100 text-red-700',
      NO_SHOW: 'bg-yellow-100 text-yellow-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      COMPLETED: 'Completada',
      CONFIRMED: 'Confirmada',
      SCHEDULED: 'Programada',
      CANCELLED: 'Cancelada',
      NO_SHOW: 'No asistió',
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FIRST_VISIT: 'Primera visita',
      FOLLOW_UP: 'Seguimiento',
      EMERGENCY: 'Urgencia',
      ROUTINE: 'Rutina',
      PROCEDURE: 'Procedimiento',
    };
    return labels[type] || type;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-600">Gestiona las citas de tus pacientes</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded ${viewMode === 'calendar' ? 'bg-white shadow-sm' : ''}`}
              title="Vista calendario"
            >
              <Calendar className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`p-2 rounded ${viewMode === 'day' ? 'bg-white shadow-sm' : ''}`}
              title="Vista día"
            >
              <Clock className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              title="Vista lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => {
              setSelectedAppointment(undefined);
              setSelectedDate(new Date());
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Citas hoy</p>
          <p className="text-2xl font-bold text-gray-900">{todayAppointments.length}</p>
          <p className="text-xs text-gray-400">{completedToday} completadas</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Próximas</p>
          <p className="text-2xl font-bold text-blue-600">{upcomingAppointments.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Este mes</p>
          <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <AppointmentCalendar
          appointments={appointments}
          onDateSelect={handleDateSelect}
          onEventClick={handleEventClick}
          isLoading={isLoading}
        />
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Day Navigation */}
          <div className="flex items-center justify-between p-4 border-b">
            <button
              onClick={() => setSelectedDay(addDays(selectedDay, -1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {format(selectedDay, "EEEE, d 'de' MMMM", { locale: es })}
              </h2>
              <button
                onClick={() => setSelectedDay(new Date())}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Ir a hoy
              </button>
            </div>
            <button
              onClick={() => setSelectedDay(addDays(selectedDay, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Day Schedule */}
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : dayAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No hay citas para este día</p>
                <button
                  onClick={() => {
                    setSelectedDate(selectedDay);
                    setIsModalOpen(true);
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700"
                >
                  Agendar una cita
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {dayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleEventClick(apt)}
                  >
                    <div className="text-center w-16">
                      <p className="text-lg font-bold text-gray-900">
                        {format(getStartTime(apt), 'HH:mm')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(getEndTime(apt), 'HH:mm')}
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/patients/${apt.patient?.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {apt.patient?.firstName} {apt.patient?.lastName}
                        </Link>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(apt.status)}`}>
                          {getStatusLabel(apt.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{getTypeLabel(apt.type)}</p>
                      {apt.patient?.phone && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          {apt.patient.phone}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(apt.id, 'COMPLETED');
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Marcar como completada"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(apt.id, 'NO_SHOW');
                            }}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Marcar como no asistió"
                          >
                            <AlertCircle className="h-5 w-5" />
                          </button>
                        </>
                      ) : (
                        getStatusIcon(apt.status)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Próximas citas</h2>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No hay citas próximas</p>
            </div>
          ) : (
            <div className="divide-y">
              {upcomingAppointments
                .sort((a, b) => getStartTime(a).getTime() - getStartTime(b).getTime())
                .slice(0, 20)
                .map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleEventClick(apt)}
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {apt.patient ? (
                        <span className="text-blue-600 font-semibold">
                          {apt.patient.firstName[0]}{apt.patient.lastName[0]}
                        </span>
                      ) : (
                        <User className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {apt.patient?.firstName} {apt.patient?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(getStartTime(apt), "EEE d MMM, HH:mm", { locale: es })}
                        {' • '}
                        {getTypeLabel(apt.type)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(apt.status)}`}>
                      {getStatusLabel(apt.status)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        appointment={selectedAppointment}
        initialDate={selectedDate}
      />
    </div>
  );
}
