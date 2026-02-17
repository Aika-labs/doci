'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthCompat as useAuth } from '@/hooks/useAuthCompat';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Calendar,
  Download,
  Filter,
  Loader2,
  Activity,
  Clock,
  UserPlus,
  Stethoscope,
  Pill,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

type DateRange = '7d' | '30d' | '90d' | 'month';

interface ReportStats {
  totalConsultations: number;
  totalPatients: number;
  newPatients: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  avgConsultationsPerDay: number;
  topDiagnoses: Array<{ name: string; count: number }>;
  consultationsByDay: Array<{ date: string; count: number }>;
  patientsByGender: { male: number; female: number; other: number };
  appointmentsByStatus: Record<string, number>;
  totalPrescriptions: number;
  consultationsByHour: Array<{ hour: number; count: number }>;
  patientRetention: number;
  growthRate: number;
}

export default function ReportsPage() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [isExporting, setIsExporting] = useState(false);

  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return { start: subDays(now, 7), end: now };
      case '30d':
        return { start: subDays(now, 30), end: now };
      case '90d':
        return { start: subDays(now, 90), end: now };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return { start: subDays(now, 30), end: now };
    }
  }, [dateRange]);

  const fetchReportData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const { start, end } = getDateRange();

      // Fetch consultations
      const consultationsRes = await fetch(
        `${apiUrl}/consultations?startDate=${start.toISOString()}&endDate=${end.toISOString()}&limit=1000`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch patients
      const patientsRes = await fetch(`${apiUrl}/patients?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch appointments
      const appointmentsRes = await fetch(
        `${apiUrl}/appointments?startDate=${start.toISOString()}&endDate=${end.toISOString()}&limit=1000`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch prescriptions
      const prescriptionsRes = await fetch(`${apiUrl}/prescriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let consultations: Array<{
        createdAt: string;
        startedAt?: string;
        clinicalData?: { soapNotes?: { assessment?: string } };
      }> = [];
      let patients: Array<{ id: string; createdAt: string; gender: string }> = [];
      let appointments: Array<{ status: string }> = [];
      let prescriptions: Array<{ createdAt: string }> = [];

      if (consultationsRes.ok) {
        const data = await consultationsRes.json();
        consultations = data.data || [];
      }

      if (patientsRes.ok) {
        const data = await patientsRes.json();
        patients = data.data || [];
      }

      if (appointmentsRes.ok) {
        const data = await appointmentsRes.json();
        appointments = data.data || data || [];
      }

      if (prescriptionsRes.ok) {
        const data = await prescriptionsRes.json();
        prescriptions = data || [];
      }

      // Calculate stats
      const days = eachDayOfInterval({ start, end });
      const consultationsByDay = days.map((day) => ({
        date: format(day, 'yyyy-MM-dd'),
        count: consultations.filter(
          (c) => format(new Date(c.createdAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
        ).length,
      }));

      // New patients in range
      const newPatients = patients.filter(
        (p) => new Date(p.createdAt) >= start && new Date(p.createdAt) <= end
      ).length;

      // Gender distribution
      const patientsByGender = {
        male: patients.filter((p) => p.gender === 'MALE').length,
        female: patients.filter((p) => p.gender === 'FEMALE').length,
        other: patients.filter((p) => p.gender === 'OTHER').length,
      };

      // Appointments by status
      const appointmentsByStatus: Record<string, number> = {};
      appointments.forEach((apt) => {
        appointmentsByStatus[apt.status] = (appointmentsByStatus[apt.status] || 0) + 1;
      });

      // Top diagnoses
      const diagnosisCount: Record<string, number> = {};
      consultations.forEach((c) => {
        const diagnosis = c.clinicalData?.soapNotes?.assessment;
        if (diagnosis) {
          diagnosisCount[diagnosis] = (diagnosisCount[diagnosis] || 0) + 1;
        }
      });
      const topDiagnoses = Object.entries(diagnosisCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Consultations by hour
      const hourCount: Record<number, number> = {};
      consultations.forEach((c) => {
        const hour = new Date(c.startedAt || c.createdAt).getHours();
        hourCount[hour] = (hourCount[hour] || 0) + 1;
      });
      const consultationsByHour = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: hourCount[i] || 0,
      }));

      // Patient retention (patients with more than 1 consultation)
      const patientConsultations: Record<string, number> = {};
      consultations.forEach((c) => {
        const patientId = (c as { patientId?: string }).patientId;
        if (patientId) {
          patientConsultations[patientId] = (patientConsultations[patientId] || 0) + 1;
        }
      });
      const returningPatients = Object.values(patientConsultations).filter(
        (count) => count > 1
      ).length;
      const patientRetention =
        patients.length > 0 ? (returningPatients / patients.length) * 100 : 0;

      // Growth rate (compare new patients this period vs previous)
      const periodDays = days.length;
      const previousStart = subDays(start, periodDays);
      const previousNewPatients = patients.filter(
        (p) => new Date(p.createdAt) >= previousStart && new Date(p.createdAt) < start
      ).length;
      const growthRate =
        previousNewPatients > 0
          ? ((newPatients - previousNewPatients) / previousNewPatients) * 100
          : newPatients > 0
            ? 100
            : 0;

      setStats({
        totalConsultations: consultations.length,
        totalPatients: patients.length,
        newPatients,
        totalAppointments: appointments.length,
        completedAppointments: appointmentsByStatus['COMPLETED'] || 0,
        cancelledAppointments: appointmentsByStatus['CANCELLED'] || 0,
        avgConsultationsPerDay: consultations.length / days.length,
        topDiagnoses,
        consultationsByDay,
        patientsByGender,
        appointmentsByStatus,
        totalPrescriptions: prescriptions.length,
        consultationsByHour,
        patientRetention,
        growthRate,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, getDateRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleExportCSV = async () => {
    if (!stats) return;
    setIsExporting(true);

    try {
      // Create CSV content
      const headers = ['Fecha', 'Consultas'];
      const rows = stats.consultationsByDay.map((d) => [d.date, d.count.toString()]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reporte-consultas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  const dateRangeOptions = [
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: '90d', label: 'Últimos 90 días' },
    { value: 'month', label: 'Este mes' },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const maxConsultations = Math.max(...(stats?.consultationsByDay.map((d) => d.count) || [1]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reportes y Estadísticas</h1>
          <p className="text-white/50">Análisis de la actividad de tu clínica</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-white/40" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="rounded-2xl border border-white/[0.08] px-3 py-2 focus:ring-2 focus:ring-blue-500/20"
            >
              {dateRangeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        <MetricCard
          icon={FileText}
          label="Consultas"
          value={stats?.totalConsultations || 0}
          color="blue"
        />
        <MetricCard
          icon={Users}
          label="Pacientes totales"
          value={stats?.totalPatients || 0}
          color="green"
        />
        <MetricCard
          icon={UserPlus}
          label="Nuevos pacientes"
          value={stats?.newPatients || 0}
          color="purple"
          trend={stats?.growthRate}
        />
        <MetricCard
          icon={Calendar}
          label="Citas"
          value={stats?.totalAppointments || 0}
          color="orange"
        />
        <MetricCard
          icon={Pill}
          label="Recetas"
          value={stats?.totalPrescriptions || 0}
          color="teal"
        />
        <MetricCard
          icon={DollarSign}
          label="Retención"
          value={`${(stats?.patientRetention || 0).toFixed(0)}%`}
          color="indigo"
          isPercentage
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Consultations Chart */}
        <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Consultas por día</h2>
            <div className="flex items-center gap-2 text-sm text-white/40">
              <Activity className="h-4 w-4" />
              <span>Promedio: {stats?.avgConsultationsPerDay.toFixed(1)}/día</span>
            </div>
          </div>
          <div className="flex h-48 items-end gap-1">
            {stats?.consultationsByDay.slice(-14).map((day, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-blue-500 transition-all hover:bg-blue-600"
                  style={{
                    height: `${(day.count / maxConsultations) * 100}%`,
                    minHeight: day.count > 0 ? '4px' : '0',
                  }}
                  title={`${day.date}: ${day.count} consultas`}
                />
                <span className="origin-left rotate-45 text-xs text-white/30">
                  {format(new Date(day.date), 'd', { locale: es })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Appointments Status */}
        <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-6">
          <h2 className="mb-6 text-lg font-semibold text-white">Estado de citas</h2>
          <div className="space-y-4">
            <StatusBar
              label="Completadas"
              value={stats?.completedAppointments || 0}
              total={stats?.totalAppointments || 1}
              color="bg-green-500"
            />
            <StatusBar
              label="Confirmadas"
              value={stats?.appointmentsByStatus?.['CONFIRMED'] || 0}
              total={stats?.totalAppointments || 1}
              color="bg-blue-500"
            />
            <StatusBar
              label="Programadas"
              value={stats?.appointmentsByStatus?.['SCHEDULED'] || 0}
              total={stats?.totalAppointments || 1}
              color="bg-gray-400"
            />
            <StatusBar
              label="Canceladas"
              value={stats?.cancelledAppointments || 0}
              total={stats?.totalAppointments || 1}
              color="bg-red-500"
            />
            <StatusBar
              label="No asistió"
              value={stats?.appointmentsByStatus?.['NO_SHOW'] || 0}
              total={stats?.totalAppointments || 1}
              color="bg-yellow-500"
            />
          </div>
        </div>
      </div>

      {/* Peak Hours Chart */}
      <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Horas pico de consultas</h2>
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Clock className="h-4 w-4" />
            <span>Distribución por hora del día</span>
          </div>
        </div>
        <div className="flex h-32 items-end gap-0.5">
          {stats?.consultationsByHour.slice(7, 21).map((hour, i) => {
            const maxHour = Math.max(...(stats?.consultationsByHour.map((h) => h.count) || [1]));
            const isPeak = hour.count === maxHour && hour.count > 0;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t transition-all ${
                    isPeak ? 'bg-green-500' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  style={{
                    height: `${maxHour > 0 ? (hour.count / maxHour) * 100 : 0}%`,
                    minHeight: hour.count > 0 ? '4px' : '0',
                  }}
                  title={`${hour.hour}:00 - ${hour.count} consultas`}
                />
                <span className="text-xs text-white/30">{hour.hour}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-green-500" />
            <span className="text-white/50">Hora pico</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-gray-300" />
            <span className="text-white/50">Otras horas</span>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gender Distribution */}
        <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-6">
          <h2 className="mb-6 text-lg font-semibold text-white">Distribución por género</h2>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/15">
                <span className="text-2xl font-bold text-blue-400">
                  {stats?.patientsByGender.male || 0}
                </span>
              </div>
              <p className="text-sm text-white/50">Masculino</p>
              <p className="text-xs text-white/30">
                {stats?.totalPatients
                  ? ((stats.patientsByGender.male / stats.totalPatients) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </div>
            <div className="text-center">
              <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-pink-500/15">
                <span className="text-2xl font-bold text-pink-400">
                  {stats?.patientsByGender.female || 0}
                </span>
              </div>
              <p className="text-sm text-white/50">Femenino</p>
              <p className="text-xs text-white/30">
                {stats?.totalPatients
                  ? ((stats.patientsByGender.female / stats.totalPatients) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </div>
            <div className="text-center">
              <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.06]">
                <span className="text-2xl font-bold text-white/50">
                  {stats?.patientsByGender.other || 0}
                </span>
              </div>
              <p className="text-sm text-white/50">Otro</p>
              <p className="text-xs text-white/30">
                {stats?.totalPatients
                  ? ((stats.patientsByGender.other / stats.totalPatients) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>

        {/* Top Diagnoses */}
        <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-6">
          <div className="mb-6 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-white/40" />
            <h2 className="text-lg font-semibold text-white">Diagnósticos frecuentes</h2>
          </div>
          {stats?.topDiagnoses && stats.topDiagnoses.length > 0 ? (
            <div className="space-y-3">
              {stats.topDiagnoses.map((diagnosis, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15 text-xs font-medium text-blue-400">
                      {i + 1}
                    </span>
                    <span className="max-w-[200px] truncate text-white/70">{diagnosis.name}</span>
                  </div>
                  <span className="text-sm font-medium text-white/40">{diagnosis.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-white/40">
              <BarChart3 className="mx-auto mb-2 h-12 w-12 text-white/20" />
              <p>No hay diagnósticos registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Resumen de rendimiento</h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <div className="text-center">
            <div className="mb-1 flex items-center justify-center gap-1 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-2xl font-bold">
                {stats?.totalAppointments
                  ? ((stats.completedAppointments / stats.totalAppointments) * 100).toFixed(0)
                  : 0}
                %
              </span>
            </div>
            <p className="text-sm text-white/40">Tasa de completado</p>
          </div>
          <div className="text-center">
            <div className="mb-1 flex items-center justify-center gap-1 text-red-400">
              <Clock className="h-4 w-4" />
              <span className="text-2xl font-bold">
                {stats?.totalAppointments
                  ? ((stats.cancelledAppointments / stats.totalAppointments) * 100).toFixed(0)
                  : 0}
                %
              </span>
            </div>
            <p className="text-sm text-white/40">Tasa de cancelación</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-blue-400">
              {stats?.avgConsultationsPerDay.toFixed(1)}
            </span>
            <p className="text-sm text-white/40">Consultas/día promedio</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-violet-400">{stats?.newPatients || 0}</span>
            <p className="text-sm text-white/40">Nuevos pacientes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  trend,
  isPercentage,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'indigo';
  trend?: number;
  isPercentage?: boolean;
}) {
  const colorStyles = {
    blue: 'bg-blue-500/15 text-blue-400',
    green: 'bg-emerald-500/15 text-emerald-400',
    purple: 'bg-violet-500/15 text-violet-400',
    orange: 'bg-orange-500/15 text-orange-600',
    teal: 'bg-blue-500/100/15 text-blue-400',
    indigo: 'bg-indigo-500/15 text-indigo-600',
  };

  return (
    <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorStyles[color]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`font-bold text-white ${isPercentage ? 'text-xl' : 'text-2xl'}`}>
              {value}
            </p>
            {trend !== undefined && trend !== 0 && (
              <span
                className={`flex items-center text-xs font-medium ${
                  trend > 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {trend > 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(trend).toFixed(0)}%
              </span>
            )}
          </div>
          <p className="truncate text-sm text-white/40">{label}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm text-white/50">{label}</span>
        <span className="text-sm font-medium text-white">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
