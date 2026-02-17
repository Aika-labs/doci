'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar,
  Users,
  FileText,
  Clock,
  Mic,
  UserPlus,
  CalendarPlus,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { DashboardSkeleton } from '@/components/Skeleton';

interface DashboardStats {
  todayAppointments: number;
  totalPatients: number;
  weekConsultations: number;
  nextAppointment: {
    time: string;
    patientName: string;
  } | null;
}

interface TodayAppointment {
  id: string;
  startTime: string;
  patient: {
    firstName: string;
    lastName: string;
  };
  type: string;
  status: string;
}

export default function DashboardPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [appointments, setAppointments] = useState<TodayAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      // Fetch today's appointments
      const today = new Date();
      const appointmentsRes = await fetch(
        `${apiUrl}/appointments?startDate=${startOfDay(today).toISOString()}&endDate=${endOfDay(today).toISOString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Fetch patients count
      const patientsRes = await fetch(`${apiUrl}/patients?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch consultations this week
      const consultationsRes = await fetch(`${apiUrl}/consultations?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let todayAppointments: TodayAppointment[] = [];
      let totalPatients = 0;
      let weekConsultations = 0;

      if (appointmentsRes.ok) {
        const data = await appointmentsRes.json();
        todayAppointments = data.data || data || [];
      }

      if (patientsRes.ok) {
        const data = await patientsRes.json();
        totalPatients = data.total || data.data?.length || 0;
      }

      if (consultationsRes.ok) {
        const data = await consultationsRes.json();
        weekConsultations = data.data?.length || 0;
      }

      // Find next upcoming appointment
      const now = new Date();
      const upcomingAppointments = todayAppointments
        .filter((apt) => new Date(apt.startTime) > now && apt.status !== 'CANCELLED')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      const nextAppointment = upcomingAppointments[0]
        ? {
            time: format(new Date(upcomingAppointments[0].startTime), 'HH:mm'),
            patientName: `${upcomingAppointments[0].patient.firstName} ${upcomingAppointments[0].patient.lastName}`,
          }
        : null;

      setStats({
        todayAppointments: todayAppointments.filter((a) => a.status !== 'CANCELLED').length,
        totalPatients,
        weekConsultations,
        nextAppointment,
      });

      setAppointments(todayAppointments.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default stats on error
      setStats({
        todayAppointments: 0,
        totalPatients: 0,
        weekConsultations: 0,
        nextAppointment: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-700',
      CONFIRMED: 'bg-blue-100 text-blue-700',
      SCHEDULED: 'bg-slate-100 text-slate-700',
      CANCELLED: 'bg-red-100 text-red-700',
      NO_SHOW: 'bg-yellow-100 text-yellow-700',
    };
    return styles[status] || 'bg-slate-100 text-slate-700';
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

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {getGreeting()}, {user?.firstName || 'Doctor'}
        </h1>
        <p className="text-slate-500">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={Calendar}
          label="Citas hoy"
          value={stats?.todayAppointments.toString() || '0'}
          trend={(stats?.todayAppointments ?? 0) > 0 ? 'up' : undefined}
        />
        <StatCard
          icon={Users}
          label="Pacientes totales"
          value={stats?.totalPatients.toString() || '0'}
          trend="up"
        />
        <StatCard
          icon={FileText}
          label="Consultas esta semana"
          value={stats?.weekConsultations.toString() || '0'}
        />
        <StatCard
          icon={Clock}
          label="Próxima cita"
          value={stats?.nextAppointment?.time || '--:--'}
          subtitle={stats?.nextAppointment?.patientName || 'Sin citas pendientes'}
        />
      </div>

      {/* Today's appointments */}
      <div className="rounded-xl border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Citas de hoy</h2>
          <Link href="/appointments" className="text-sm text-blue-600 hover:text-blue-700">
            Ver todas
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <Calendar className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p>No hay citas programadas para hoy</p>
            <Link
              href="/appointments"
              className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700"
            >
              Agendar una cita
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <span className="w-14 text-lg font-semibold text-slate-900">
                    {format(new Date(apt.startTime), 'HH:mm')}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">
                      {apt.patient.firstName} {apt.patient.lastName}
                    </p>
                    <p className="text-sm text-slate-500">{apt.type || 'Consulta'}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(apt.status)}`}
                >
                  {getStatusLabel(apt.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <QuickAction
          href="/consultations/new"
          icon={<Mic className="h-6 w-6 text-blue-600" />}
          title="Nueva consulta"
          description="Inicia una consulta con dictado por voz"
          color="blue"
        />
        <QuickAction
          href="/patients/new"
          icon={<UserPlus className="h-6 w-6 text-green-600" />}
          title="Nuevo paciente"
          description="Registra un nuevo paciente"
          color="green"
        />
        <QuickAction
          href="/appointments"
          icon={<CalendarPlus className="h-6 w-6 text-purple-600" />}
          title="Nueva cita"
          description="Agenda una cita"
          color="purple"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down';
}) {
  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-500">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {trend &&
              (trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ))}
          </div>
        </div>
      </div>
      {subtitle && <p className="mt-2 truncate text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'green' | 'purple';
}) {
  const colorStyles = {
    blue: 'hover:border-blue-300 hover:bg-blue-50',
    green: 'hover:border-green-300 hover:bg-green-50',
    purple: 'hover:border-purple-300 hover:bg-purple-50',
  };

  return (
    <Link
      href={href}
      className={`flex items-center gap-4 rounded-xl border bg-white p-6 transition-colors ${colorStyles[color]}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </Link>
  );
}
