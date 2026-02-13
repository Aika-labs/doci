'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { AppointmentCalendar, AppointmentModal } from '@/components/appointments';
import { appointmentsApi, Appointment } from '@/lib/api';
import { Plus } from 'lucide-react';

export default function AppointmentsPage() {
  const { getToken } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [currentMonth] = useState(new Date());

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      const start = startOfMonth(addMonths(currentMonth, -1)).toISOString();
      const end = endOfMonth(addMonths(currentMonth, 1)).toISOString();

      const response = await appointmentsApi.getAll(token, { start, end });
      setAppointments(response.data);
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

    if (selectedAppointment) {
      await appointmentsApi.update(token, selectedAppointment.id, {
        ...data,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
      });
    } else {
      await appointmentsApi.create(token, {
        ...data,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
      });
    }

    await fetchAppointments();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(undefined);
    setSelectedDate(undefined);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-600">Gestiona las citas de tus pacientes</p>
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

      <AppointmentCalendar
        appointments={appointments}
        onDateSelect={handleDateSelect}
        onEventClick={handleEventClick}
        isLoading={isLoading}
      />

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
