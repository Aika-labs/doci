'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthCompat as useAuth } from '@/hooks/useAuthCompat';
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
      const token = (await getToken()) || 'demo-token';

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

  const handleStatusChange = async (
    appointmentId: string,
    status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  ) => {
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
  const todayAppointments = appointments.filter((apt) => isSameDay(getStartTime(apt), new Date()));
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
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'NO_SHOW':
        return <AlertCircle className="h-4 w-4 text-amber-400" />;
      default:
        return <Clock className="h-4 w-4 text-white/40" />;
    }
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      COMPLETED: 'bg-emerald-500/15 text-emerald-300',
      CONFIRMED: 'bg-blue-500/15 text-blue-300',
      SCHEDULED: 'bg-white/[0.06] text-white/70',
      CANCELLED: 'bg-red-500/15 text-red-300',
      NO_SHOW: 'bg-amber-500/15 text-amber-300',
    };
    return styles[status] || 'bg-white/[0.06] text-white/70';
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
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agenda</h1>
          <p className="text-white/50">Gestiona las citas de tus pacientes</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center rounded-2xl bg-white/[0.06] p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`rounded-xl p-2 transition-colors ${viewMode === 'calendar' ? 'bg-white/10 text-[#a8d944] shadow-sm' : 'text-white/50 hover:text-white'}`}
              title="Vista calendario"
            >
              <Calendar className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`rounded-xl p-2 transition-colors ${viewMode === 'day' ? 'bg-white/10 text-[#a8d944] shadow-sm' : 'text-white/50 hover:text-white'}`}
              title="Vista día"
            >
              <Clock className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-xl p-2 transition-colors ${viewMode === 'list' ? 'bg-white/10 text-[#a8d944] shadow-sm' : 'text-white/50 hover:text-white'}`}
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
            className="flex items-center gap-2 rounded-2xl bg-[#a8d944] px-4 py-2 font-medium text-[#0F1E29] transition-colors hover:bg-[#a8d944]/90"
          >
            <Plus className="h-4 w-4" />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-sm text-white/40">Citas hoy</p>
          <p className="text-2xl font-bold text-white">{todayAppointments.length}</p>
          <p className="text-xs text-white/30">{completedToday} completadas</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-sm text-white/40">Próximas</p>
          <p className="text-2xl font-bold text-[#a8d944]">{upcomingAppointments.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-sm text-white/40">Este mes</p>
          <p className="text-2xl font-bold text-white">{appointments.length}</p>
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
        <div className="glass-card rounded-2xl">
          {/* Day Navigation */}
          <div className="flex items-center justify-between border-b border-white/[0.08] p-4">
            <button
              onClick={() => setSelectedDay(addDays(selectedDay, -1))}
              className="rounded-2xl p-2 hover:bg-white/[0.06]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white">
                {format(selectedDay, "EEEE, d 'de' MMMM", { locale: es })}
              </h2>
              <button
                onClick={() => setSelectedDay(new Date())}
                className="text-sm text-[#a8d944] hover:text-[#a8d944]/80"
              >
                Ir a hoy
              </button>
            </div>
            <button
              onClick={() => setSelectedDay(addDays(selectedDay, 1))}
              className="rounded-2xl p-2 hover:bg-white/[0.06]"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Day Schedule */}
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#a8d944]" />
              </div>
            ) : dayAppointments.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="mx-auto mb-3 h-12 w-12 text-white/20" />
                <p className="text-white/40">No hay citas para este día</p>
                <button
                  onClick={() => {
                    setSelectedDate(selectedDay);
                    setIsModalOpen(true);
                  }}
                  className="mt-4 text-[#a8d944] hover:text-[#a8d944]/80"
                >
                  Agendar una cita
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {dayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex cursor-pointer items-center gap-4 rounded-2xl border border-white/[0.06] p-4 transition-shadow hover:shadow-md"
                    onClick={() => handleEventClick(apt)}
                  >
                    <div className="w-16 text-center">
                      <p className="text-lg font-bold text-white">
                        {format(getStartTime(apt), 'HH:mm')}
                      </p>
                      <p className="text-xs text-white/40">{format(getEndTime(apt), 'HH:mm')}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/patients/${apt.patient?.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-white hover:text-[#a8d944]"
                        >
                          {apt.patient?.firstName} {apt.patient?.lastName}
                        </Link>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusStyle(apt.status)}`}
                        >
                          {getStatusLabel(apt.status)}
                        </span>
                      </div>
                      <p className="text-sm text-white/40">{getTypeLabel(apt.type)}</p>
                      {apt.patient?.phone && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-white/30">
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
                            className="rounded-2xl p-2 text-emerald-400 hover:bg-emerald-500/10"
                            title="Marcar como completada"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(apt.id, 'NO_SHOW');
                            }}
                            className="rounded-2xl p-2 text-amber-400 hover:bg-amber-500/10"
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
        <div className="glass-card rounded-2xl">
          <div className="border-b border-white/[0.08] p-4">
            <h2 className="font-semibold text-white">Próximas citas</h2>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#a8d944]" />
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="mx-auto mb-3 h-12 w-12 text-white/20" />
              <p className="text-white/40">No hay citas próximas</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {upcomingAppointments
                .sort((a, b) => getStartTime(a).getTime() - getStartTime(b).getTime())
                .slice(0, 20)
                .map((apt) => (
                  <div
                    key={apt.id}
                    className="flex cursor-pointer items-center gap-4 p-4 hover:bg-white/[0.02]"
                    onClick={() => handleEventClick(apt)}
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#a8d944]/15">
                      {apt.patient ? (
                        <span className="font-semibold text-[#a8d944]">
                          {apt.patient.firstName[0]}
                          {apt.patient.lastName[0]}
                        </span>
                      ) : (
                        <User className="h-6 w-6 text-[#a8d944]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">
                        {apt.patient?.firstName} {apt.patient?.lastName}
                      </p>
                      <p className="text-sm text-white/40">
                        {format(getStartTime(apt), 'EEE d MMM, HH:mm', { locale: es })}
                        {' • '}
                        {getTypeLabel(apt.type)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusStyle(apt.status)}`}
                    >
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
