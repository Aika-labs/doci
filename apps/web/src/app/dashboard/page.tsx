'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthCompat as useAuth, useUserCompat as useUser } from '@/hooks/useAuthCompat';
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

      const today = new Date();
      const appointmentsRes = await fetch(
        `${apiUrl}/appointments?startDate=${startOfDay(today).toISOString()}&endDate=${endOfDay(today).toISOString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const patientsRes = await fetch(`${apiUrl}/patients?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
    } catch {
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
      COMPLETED: 'bg-emerald-500/15 text-emerald-400',
      CONFIRMED: 'bg-blue-500/15 text-blue-400',
      SCHEDULED: 'bg-white/10 text-white/60',
      CANCELLED: 'bg-red-500/15 text-red-400',
      NO_SHOW: 'bg-amber-500/15 text-amber-400',
    };
    return styles[status] || 'bg-white/10 text-white/60';
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
        <h1 className="text-2xl font-bold text-white">
          {getGreeting()}, {user?.firstName || 'Doctor'}
        </h1>
        <p className="text-white/50">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</p>
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
      <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Citas de hoy</h2>
          <Link
            href="/dashboard/appointments"
            className="text-sm text-blue-400 transition-colors hover:text-blue-300"
          >
            Ver todas
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="py-8 text-center text-white/40">
            <Calendar className="mx-auto mb-3 h-12 w-12 text-white/20" />
            <p>No hay citas programadas para hoy</p>
            <Link
              href="/dashboard/appointments"
              className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300"
            >
              Agendar una cita
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-4">
                  <span className="w-14 text-lg font-semibold text-white">
                    {format(new Date(apt.startTime), 'HH:mm')}
                  </span>
                  <div>
                    <p className="font-medium text-white/90">
                      {apt.patient.firstName} {apt.patient.lastName}
                    </p>
                    <p className="text-sm text-white/40">{apt.type || 'Consulta'}</p>
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
          href="/dashboard/consultations/new"
          icon={<Mic className="h-6 w-6 text-blue-400" />}
          title="Nueva consulta"
          description="Inicia una consulta con dictado por voz"
          accent="blue"
        />
        <QuickAction
          href="/dashboard/patients/new"
          icon={<UserPlus className="h-6 w-6 text-emerald-400" />}
          title="Nuevo paciente"
          description="Registra un nuevo paciente"
          accent="emerald"
        />
        <QuickAction
          href="/dashboard/appointments"
          icon={<CalendarPlus className="h-6 w-6 text-violet-400" />}
          title="Nueva cita"
          description="Agenda una cita"
          accent="violet"
        />
      </div>
    </div>
  );
}

/* ── StatCard ────────────────────────────────────────────────────────────── */

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
    <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm transition-colors hover:bg-white/[0.06]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.06]">
          <Icon className="h-5 w-5 text-white/60" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-white/50">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-white">{value}</p>
            {trend &&
              (trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              ))}
          </div>
        </div>
      </div>
      {subtitle && <p className="mt-2 truncate text-xs text-white/40">{subtitle}</p>}
    </div>
  );
}

/* ── QuickAction ─────────────────────────────────────────────────────────── */

function QuickAction({
  href,
  icon,
  title,
  description,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: 'blue' | 'emerald' | 'violet';
}) {
  const hoverStyles = {
    blue: 'hover:border-blue-500/20 hover:bg-blue-500/5',
    emerald: 'hover:border-emerald-500/20 hover:bg-emerald-500/5',
    violet: 'hover:border-violet-500/20 hover:bg-violet-500/5',
  };

  return (
    <Link
      href={href}
      className={`flex items-center gap-4 rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 ${hoverStyles[accent]}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06]">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="text-sm text-white/40">{description}</p>
      </div>
    </Link>
  );
}
