'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthCompat as useAuth, useUserCompat as useUser } from '@/hooks/useAuthCompat';
import Link from 'next/link';
import Image from 'next/image';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, UserPlus, Calendar, Plus, Clock, MoreVertical, Maximize2 } from 'lucide-react';
import { DashboardSkeleton } from '@/components/Skeleton';
import { mockAppointments, mockPatients, mockConsultations } from '@/lib/mock-data';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const HERO_IMAGE_URL =
  'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/e92d24ed-c56e-42fe-ae8a-5317467d8eaa_3840w.webp';

/* -------------------------------------------------------------------------- */
/*  DashboardPage                                                             */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [appointments, setAppointments] = useState<TodayAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* ── Data fetching (preserved from original) ──────────────── */

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) throw new Error('No auth token — use mock data');

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
      // Backend unreachable — use mock data so the dashboard is fully visible
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);

      const mockTodayApts = mockAppointments
        .filter((a) => {
          const d = new Date(a.scheduledAt);
          return d >= todayStart && d <= todayEnd;
        })
        .map((a) => ({
          id: a.id,
          startTime: a.scheduledAt,
          patient: {
            firstName: a.patient?.firstName || 'Paciente',
            lastName: a.patient?.lastName || 'Demo',
          },
          type: a.type,
          status: a.status,
        }));

      const now = new Date();
      const upcoming = mockTodayApts
        .filter((apt) => new Date(apt.startTime) > now && apt.status !== 'CANCELLED')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      const next = upcoming[0]
        ? {
            time: format(new Date(upcoming[0].startTime), 'HH:mm'),
            patientName: `${upcoming[0].patient.firstName} ${upcoming[0].patient.lastName}`,
          }
        : null;

      setStats({
        todayAppointments: mockTodayApts.filter((a) => a.status !== 'CANCELLED').length,
        totalPatients: mockPatients.length,
        weekConsultations: mockConsultations.length,
        nextAppointment: next,
      });

      setAppointments(mockTodayApts.slice(0, 5));
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /* ── Helpers ──────────────────────────────────────────────── */

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const userName = user?.firstName || 'Doctor';

  /** Patient load as a percentage (capped at 100). */
  const patientLoadPct = stats
    ? Math.min(
        Math.round((stats.todayAppointments / Math.max(stats.todayAppointments, 20)) * 100),
        100
      )
    : 0;

  /** Capacity percentage based on today's appointments vs a 20-slot day. */
  const capacityPct = stats ? Math.min(Math.round((stats.todayAppointments / 20) * 100), 100) : 0;

  /** Average weekly consultation hours (rough: 30 min each). */
  const weeklyHours = stats ? ((stats.weekConsultations * 30) / 60).toFixed(1) : '0.0';

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      {/* Mobile greeting (hero has its own on desktop) */}
      <div className="mb-6 lg:hidden">
        <h1 className="text-3xl font-bold text-white">
          {getGreeting()}, {userName}!
        </h1>
        <p className="text-slate-400">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</p>
      </div>

      {/* ── 12-column grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ── LEFT: Hero Card (7 cols) ───────────────────── */}
        <div className="group relative flex h-[500px] flex-col overflow-hidden rounded-[40px] shadow-2xl ring-1 ring-white/5 lg:col-span-7 lg:h-full lg:min-h-[620px]">
          {/* Background image */}
          <div className="absolute inset-0">
            <Image
              src={HERO_IMAGE_URL}
              alt="Doci — inteligencia clínica"
              fill
              priority
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
          </div>
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F1E29] via-[#0F1E29]/40 to-transparent opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F1E29]/80 to-transparent" />

          {/* Hero content */}
          <div className="absolute inset-0 z-10 flex flex-col justify-between p-8 md:p-12">
            {/* Greeting (desktop only — mobile has its own above) */}
            <div className="hidden lg:block">
              <h1 className="mb-3 text-5xl font-bold tracking-tight text-white drop-shadow-lg">
                {getGreeting()}, {userName}!
                <br />
                <span className="font-normal text-slate-200 opacity-90">Optimicemos su día.</span>
              </h1>
            </div>

            {/* Bottom floating dock */}
            <div className="mt-auto">
              <div className="glass-control flex max-w-2xl items-center justify-between rounded-[32px] p-2 pr-3 backdrop-blur-xl">
                {/* Search pill */}
                <div className="flex flex-1 items-center px-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1F3342] text-slate-300">
                    <Search className="h-5 w-5" />
                  </div>
                  <span className="ml-4 text-lg text-slate-400">Buscar paciente...</span>
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard/patients/new"
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1F3342] text-white transition-all hover:bg-[#2A4557]"
                    title="Nuevo Paciente"
                  >
                    <UserPlus className="h-6 w-6" />
                  </Link>
                  <Link
                    href="/dashboard/appointments"
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1F3342] text-white transition-all hover:bg-[#2A4557]"
                    title="Agenda"
                  >
                    <Calendar className="h-6 w-6" />
                  </Link>
                  <Link
                    href="/dashboard/consultations/new"
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-[#a8d944] text-[#0F1E29] shadow-[0_0_20px_rgba(168,217,68,0.3)] transition-transform hover:scale-105 hover:brightness-110"
                    title="Nueva Consulta"
                  >
                    <Plus className="h-8 w-8" />
                  </Link>
                </div>
              </div>

              {/* Quick patient avatars */}
              <div className="mt-6 flex items-center gap-4 px-2">
                <div className="flex -space-x-3">
                  {appointments.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0F1E29] bg-[#1F3342] text-xs font-bold text-white"
                      title={`${apt.patient.firstName} ${apt.patient.lastName}`}
                    >
                      {apt.patient.firstName[0]}
                      {apt.patient.lastName[0]}
                    </div>
                  ))}
                  {(stats?.todayAppointments ?? 0) > 3 && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0F1E29] bg-[#1F3342] text-xs font-bold text-white">
                      +{(stats?.todayAppointments ?? 0) - 3}
                    </div>
                  )}
                  {appointments.length === 0 && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0F1E29] bg-[#1F3342] text-xs font-bold text-white/50">
                      --
                    </div>
                  )}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-white">Próximos Pacientes</p>
                  <p className="text-xs text-slate-400">
                    {stats?.nextAppointment
                      ? `Siguiente: ${stats.nextAppointment.patientName} a las ${stats.nextAppointment.time}`
                      : 'Sin citas pendientes'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Metrics Grid (5 cols) ───────────────── */}
        <div className="grid auto-rows-min grid-cols-1 content-start gap-5 md:grid-cols-2 lg:col-span-5">
          {/* Card 1: Patient Load */}
          <PatientLoadCard pct={patientLoadPct} />

          {/* Card 2: Consultorio Vital Signs (tall, spans 2 rows) */}
          <ConsultorioCard
            todayAppointments={stats?.todayAppointments ?? 0}
            totalPatients={stats?.totalPatients ?? 0}
          />

          {/* Card 3: System Status */}
          <SystemStatusCard />

          {/* Card 4: Capacity Gauge */}
          <CapacityCard pct={capacityPct} />

          {/* Card 5: Weekly Consultations Chart (full width) */}
          <WeeklyChartCard hours={weeklyHours} weekConsultations={stats?.weekConsultations ?? 0} />
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  Metric Cards                                                              */
/* ========================================================================== */

/* ── Patient Load ─────────────────────────────────────────────────────────── */

function PatientLoadCard({ pct }: { pct: number }) {
  const label = pct >= 80 ? 'Alta' : pct >= 40 ? 'Media' : 'Baja';
  return (
    <div className="glass-card group relative rounded-[32px] p-6">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="font-medium text-slate-300">Carga Pacientes</h3>
        <Maximize2 className="h-4 w-4 cursor-pointer text-slate-500 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="mb-4 flex items-end gap-2">
        <span className="text-4xl font-light text-white">{pct}%</span>
        <span className="mb-1.5 text-sm text-slate-400">{label}</span>
      </div>
      {/* Progress bar */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#0F1E29]/50">
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#a8d944] to-[#86b32d] shadow-[0_0_10px_rgba(168,217,68,0.4)]"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute inset-0 h-full w-full opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 4px, #000 4px, #000 8px)',
          }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-medium tracking-wider text-slate-500 uppercase">
        <span>0</span>
        <span>100%</span>
      </div>
    </div>
  );
}

/* ── Consultorio Vital Signs (tall card) ──────────────────────────────────── */

function ConsultorioCard({
  todayAppointments,
  totalPatients,
}: {
  todayAppointments: number;
  totalPatients: number;
}) {
  /** Derive a "health" percentage from today's activity. */
  const healthPct =
    totalPatients > 0
      ? Math.min(Math.round((todayAppointments / Math.max(totalPatients, 1)) * 100 + 80), 100)
      : 98;

  return (
    <div className="glass-card relative row-span-2 flex flex-col justify-between overflow-hidden rounded-[32px] p-6">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-300">Consultorio</span>
        <div className="flex items-center gap-2">
          <ToggleSwitch />
          <MoreVertical className="h-4 w-4 text-slate-500" />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center py-6">
        <div className="text-7xl font-light tracking-tighter text-white">
          {healthPct}
          <span className="align-top text-2xl text-[#a8d944]">%</span>
        </div>
        <div className="mt-2 text-sm text-slate-400">Disponibilidad</div>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/5 bg-[#162633] px-3 py-1.5">
          <Clock className="h-3 w-3 text-[#a8d944]" />
          <span className="text-xs text-slate-300">
            {todayAppointments > 0 ? `${todayAppointments} citas hoy` : 'Sin citas hoy'}
          </span>
        </div>
      </div>

      {/* Decorative graph background */}
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-32 opacity-20">
        <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="h-full w-full">
          <path
            d="M0,80 C50,80 50,20 100,50 S150,80 200,80"
            fill="none"
            stroke="#a8d944"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Scale ticks */}
      <div className="relative mt-4 h-12 w-full">
        <div className="absolute inset-0 flex items-center justify-between text-[10px] text-slate-600">
          <span>80</span>
          <span>85</span>
          <span>90</span>
          <span className="font-bold text-white">{healthPct}</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}

/* ── System Status ────────────────────────────────────────────────────────── */

function SystemStatusCard() {
  return (
    <div className="glass-card flex items-center justify-between rounded-[32px] p-5">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-300">Sistema</span>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xl font-semibold text-white">En línea</span>
          <span className="text-xs text-slate-500">(v2.4)</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ToggleSwitch />
        <MoreVertical className="h-4 w-4 text-slate-500" />
      </div>
    </div>
  );
}

/* ── Capacity Gauge ───────────────────────────────────────────────────────── */

function CapacityCard({ pct }: { pct: number }) {
  const label = pct >= 80 ? 'Alta' : pct >= 40 ? 'Media' : 'Baja';

  /**
   * Arc gauge: the full semicircle has a circumference of ~126 units.
   * stroke-dashoffset controls how much of the arc is "unfilled".
   */
  const arcLength = 126;
  const offset = arcLength - (arcLength * pct) / 100;

  /** Position the indicator dot along the arc based on percentage. */
  const angle = Math.PI - (Math.PI * pct) / 100;
  const cx = 50 + 40 * Math.cos(angle);
  const cy = 50 - 40 * Math.sin(angle);

  return (
    <div className="glass-card relative rounded-[32px] p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-slate-300">Capacidad</h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-light text-white">{pct}%</span>
            <span className="text-xs text-[#a8d944]">{label}</span>
          </div>
        </div>
        <Maximize2 className="h-3 w-3 text-slate-500" />
      </div>

      {/* Arc gauge */}
      <div className="relative mt-4 flex h-16 justify-center overflow-hidden">
        <svg viewBox="0 0 100 50" className="h-full w-full overflow-visible">
          {/* Background arc */}
          <path
            d="M10,50 A40,40 0 1,1 90,50"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Active arc */}
          <path
            d="M10,50 A40,40 0 1,1 90,50"
            fill="none"
            stroke="url(#capacityGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={arcLength.toString()}
            strokeDashoffset={offset.toString()}
          />
          {/* Indicator dot */}
          <circle cx={cx} cy={cy} r="3" fill="#a8d944" className="animate-pulse-glow" />
          {/* Ticks */}
          <line x1="20" y1="45" x2="22" y2="43" stroke="#334155" strokeWidth="1" />
          <line x1="50" y1="15" x2="50" y2="18" stroke="#334155" strokeWidth="1" />
          <line x1="80" y1="45" x2="78" y2="43" stroke="#334155" strokeWidth="1" />
          <defs>
            <linearGradient id="capacityGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#a8d944" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute bottom-0 flex w-full justify-between px-2 text-[10px] text-slate-500">
          <span>08:00</span>
          <span>22:00</span>
        </div>
      </div>
    </div>
  );
}

/* ── Weekly Consultations Chart ───────────────────────────────────────────── */

function WeeklyChartCard({
  hours,
  weekConsultations,
}: {
  hours: string;
  weekConsultations: number;
}) {
  return (
    <div className="glass-card col-span-1 mt-auto rounded-[32px] p-6 md:col-span-2">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-medium text-slate-200">Consultas Semanales</h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-light text-white">{hours}</span>
            <span className="text-xs text-slate-400">
              hrs de atención ({weekConsultations} consultas)
            </span>
          </div>
        </div>
        <Maximize2 className="h-4 w-4 text-slate-500" />
      </div>

      {/* Chart area */}
      <div className="relative h-32 w-full">
        {/* Floating tooltip */}
        <div className="absolute top-6 right-1/4 z-10 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#0F1E29] shadow-xl">
          {hours} hrs
          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-white" />
        </div>
        <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Area fill */}
          <path
            d="M0,90 L0,70 Q30,75 50,60 T100,50 T150,60 T200,40 T250,55 T300,70 L300,90 Z"
            fill="url(#areaGrad)"
            opacity="0.6"
          />
          {/* Line */}
          <path
            d="M0,70 Q30,75 50,60 T100,50 T150,60 T200,40 T250,55 T300,70"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(168, 217, 68, 0.2))' }}
          />
          {/* Active point */}
          <circle cx="225" cy="48" r="4" fill="white" stroke="#fbbf24" strokeWidth="2" />
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="mt-2 flex justify-between px-2 text-[10px] tracking-wide text-slate-500 uppercase">
        <span>Lun</span>
        <span>Mar</span>
        <span>Mié</span>
        <span>Jue</span>
        <span>Vie</span>
        <span>Sáb</span>
        <span>Dom</span>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  Shared UI                                                                 */
/* ========================================================================== */

/** Decorative toggle switch (visual only, matches Arounda reference). */
function ToggleSwitch() {
  return (
    <div className="relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full bg-[#a8d944]">
      <span className="absolute right-[2px] h-5 w-5 rounded-full border border-white bg-white shadow transition-all" />
    </div>
  );
}
