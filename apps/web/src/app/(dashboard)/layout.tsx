import Link from 'next/link';
import {
  Users,
  Calendar,
  FileText,
  Settings,
  Home,
  Mic,
  LogOut,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-white">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <span className="text-sm font-bold">D</span>
            </div>
            <span className="text-xl font-semibold">Doci</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            <NavItem href="/dashboard" icon={Home}>
              Inicio
            </NavItem>
            <NavItem href="/dashboard/patients" icon={Users}>
              Pacientes
            </NavItem>
            <NavItem href="/dashboard/appointments" icon={Calendar}>
              Agenda
            </NavItem>
            <NavItem href="/dashboard/consultations" icon={FileText}>
              Consultas
            </NavItem>

            <div className="my-4 border-t" />

            <NavItem href="/dashboard/consultations/new" icon={Mic} highlight>
              Nueva Consulta
            </NavItem>
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <NavItem href="/dashboard/settings" icon={Settings}>
              Configuración
            </NavItem>
            <NavItem href="/api/auth/signout" icon={LogOut}>
              Cerrar sesión
            </NavItem>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1">
        <div className="p-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-white md:hidden">
        <div className="flex items-center justify-around py-2">
          <MobileNavItem href="/dashboard" icon={Home} label="Inicio" />
          <MobileNavItem href="/dashboard/patients" icon={Users} label="Pacientes" />
          <MobileNavItem
            href="/dashboard/consultations/new"
            icon={Mic}
            label="Grabar"
            highlight
          />
          <MobileNavItem href="/dashboard/appointments" icon={Calendar} label="Agenda" />
          <MobileNavItem href="/dashboard/settings" icon={Settings} label="Config" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  children,
  highlight = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        highlight
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className="h-5 w-5" />
      {children}
    </Link>
  );
}

function MobileNavItem({
  href,
  icon: Icon,
  label,
  highlight = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 px-3 py-1 ${
        highlight ? 'text-blue-600' : 'text-slate-500'
      }`}
    >
      <Icon className={`h-5 w-5 ${highlight ? 'text-blue-600' : ''}`} />
      <span className="text-xs">{label}</span>
    </Link>
  );
}
