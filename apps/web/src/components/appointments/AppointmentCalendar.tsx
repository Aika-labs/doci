'use client';

import { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Appointment } from '@/lib/api';
import { EventClickArg, DateSelectArg } from '@fullcalendar/core';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onDateSelect: (start: Date, end: Date) => void;
  onEventClick: (appointment: Appointment) => void;
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  SCHEDULED: '#3b82f6', // blue
  CONFIRMED: '#22c55e', // green
  IN_PROGRESS: '#f59e0b', // amber
  COMPLETED: '#6b7280', // gray
  CANCELLED: '#ef4444', // red
  NO_SHOW: '#dc2626', // red darker
};

const typeLabels: Record<string, string> = {
  FIRST_VISIT: 'Primera Visita',
  FOLLOW_UP: 'Seguimiento',
  EMERGENCY: 'Emergencia',
  ROUTINE: 'Rutina',
  PROCEDURE: 'Procedimiento',
};

export function AppointmentCalendar({
  appointments,
  onDateSelect,
  onEventClick,
  isLoading,
}: AppointmentCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    // Refresh calendar when appointments change
    if (calendarRef.current) {
      calendarRef.current.getApi().refetchEvents();
    }
  }, [appointments]);

  const events = appointments.map((apt) => ({
    id: apt.id,
    title: apt.patient
      ? `${apt.patient.firstName} ${apt.patient.lastName}`
      : 'Paciente',
    start: apt.scheduledAt,
    end: new Date(new Date(apt.scheduledAt).getTime() + apt.duration * 60000).toISOString(),
    backgroundColor: statusColors[apt.status] || statusColors.SCHEDULED,
    borderColor: statusColors[apt.status] || statusColors.SCHEDULED,
    extendedProps: {
      appointment: apt,
      type: typeLabels[apt.type] || apt.type,
      status: apt.status,
    },
  }));

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    onDateSelect(selectInfo.start, selectInfo.end);
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const appointment = clickInfo.event.extendedProps.appointment as Appointment;
    onEventClick(appointment);
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${isLoading ? 'opacity-50' : ''}`}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        locale="es"
        buttonText={{
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día',
        }}
        events={events}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        select={handleDateSelect}
        eventClick={handleEventClick}
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        allDaySlot={false}
        slotDuration="00:30:00"
        height="auto"
        eventContent={(eventInfo) => (
          <div className="p-1 overflow-hidden">
            <div className="font-medium text-xs truncate">{eventInfo.event.title}</div>
            <div className="text-xs opacity-75 truncate">
              {eventInfo.event.extendedProps.type}
            </div>
          </div>
        )}
      />
    </div>
  );
}
