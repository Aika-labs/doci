import { Calendar, Users, FileText, Clock } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Buenos días, Doctor</h1>
        <p className="text-slate-500">Aquí está el resumen de tu día</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={Calendar}
          label="Citas hoy"
          value="8"
          change="+2 vs ayer"
          positive
        />
        <StatCard
          icon={Users}
          label="Pacientes totales"
          value="156"
          change="+12 este mes"
          positive
        />
        <StatCard
          icon={FileText}
          label="Consultas esta semana"
          value="32"
          change="-5 vs semana pasada"
          positive={false}
        />
        <StatCard
          icon={Clock}
          label="Próxima cita"
          value="10:30"
          change="Juan Pérez"
        />
      </div>

      {/* Today's appointments */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Citas de hoy</h2>
        <div className="mt-4 space-y-3">
          <AppointmentRow
            time="09:00"
            patient="María García"
            type="Consulta general"
            status="completed"
          />
          <AppointmentRow
            time="10:30"
            patient="Juan Pérez"
            type="Seguimiento"
            status="upcoming"
          />
          <AppointmentRow
            time="11:30"
            patient="Ana López"
            type="Primera consulta"
            status="scheduled"
          />
          <AppointmentRow
            time="12:30"
            patient="Carlos Ruiz"
            type="Telemedicina"
            status="scheduled"
          />
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <QuickAction
          href="/dashboard/consultations/new"
          icon="🎙️"
          title="Nueva consulta"
          description="Inicia una consulta con dictado por voz"
        />
        <QuickAction
          href="/dashboard/patients/new"
          icon="👤"
          title="Nuevo paciente"
          description="Registra un nuevo paciente"
        />
        <QuickAction
          href="/dashboard/appointments/new"
          icon="📅"
          title="Nueva cita"
          description="Agenda una cita"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  change,
  positive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  change: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
      {change && (
        <p
          className={`mt-2 text-xs ${
            positive === undefined
              ? 'text-slate-500'
              : positive
                ? 'text-green-600'
                : 'text-red-600'
          }`}
        >
          {change}
        </p>
      )}
    </div>
  );
}

function AppointmentRow({
  time,
  patient,
  type,
  status,
}: {
  time: string;
  patient: string;
  type: string;
  status: 'completed' | 'upcoming' | 'scheduled';
}) {
  const statusStyles = {
    completed: 'bg-green-100 text-green-700',
    upcoming: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-slate-100 text-slate-700',
  };

  const statusLabels = {
    completed: 'Completada',
    upcoming: 'Próxima',
    scheduled: 'Programada',
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold text-slate-900">{time}</span>
        <div>
          <p className="font-medium text-slate-900">{patient}</p>
          <p className="text-sm text-slate-500">{type}</p>
        </div>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[status]}`}
      >
        {statusLabels[status]}
      </span>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 rounded-xl border bg-white p-6 transition-colors hover:border-blue-300 hover:bg-blue-50"
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </a>
  );
}
