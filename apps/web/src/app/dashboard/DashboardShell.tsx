'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Calendar,
  FileText,
  Settings,
  Home,
  Mic,
  Menu,
  X,
  ChevronLeft,
  FileStack,
  HardDrive,
  BarChart3,
  Receipt,
} from 'lucide-react';
import { CommandPalette } from '@/components/search';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/* -------------------------------------------------------------------------- */
/*  UserAvatar — renders Clerk UserButton when key is present, else fallback  */
/* -------------------------------------------------------------------------- */

function UserAvatar(props: { afterSignOutUrl?: string; appearance?: object }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white/70">
        U
      </div>
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { UserButton } = require('@clerk/nextjs');
  return <UserButton {...props} />;
}

/* -------------------------------------------------------------------------- */
/*  DashboardShell                                                            */
/* -------------------------------------------------------------------------- */

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Inicio', href: '/dashboard', icon: Home },
    { name: 'Pacientes', href: '/dashboard/patients', icon: Users },
    { name: 'Agenda', href: '/dashboard/appointments', icon: Calendar },
    { name: 'Consultas', href: '/dashboard/consultations', icon: FileText },
    { name: 'Plantillas', href: '/dashboard/templates', icon: FileStack },
  ];

  const secondaryNavigation = [
    { name: 'Facturación', href: '/dashboard/billing', icon: Receipt },
    { name: 'Reportes', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Almacenamiento', href: '/dashboard/storage', icon: HardDrive },
    { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-[#0F1D32]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-[#0A1628] transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 ${collapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/25">
              <span className="text-base font-bold text-white">D</span>
            </div>
            {!collapsed && <span className="text-lg font-semibold text-white/90">Doci</span>}
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-white/40 hover:bg-white/5 hover:text-white/70 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navigation.map((item) => (
            <NavItem
              key={item.name}
              href={item.href}
              icon={item.icon}
              active={isActive(item.href)}
              collapsed={collapsed}
            >
              {item.name}
            </NavItem>
          ))}

          <div className="my-4 border-t border-white/[0.06]" />

          <NavItem
            href="/dashboard/consultations/new"
            icon={Mic}
            highlight
            collapsed={collapsed}
            active={pathname === '/dashboard/consultations/new'}
          >
            Nueva Consulta
          </NavItem>

          <div className="my-4 border-t border-white/[0.06]" />

          {secondaryNavigation.map((item) => (
            <NavItem
              key={item.name}
              href={item.href}
              icon={item.icon}
              active={isActive(item.href)}
              collapsed={collapsed}
            >
              {item.name}
            </NavItem>
          ))}
        </nav>

        {/* Footer with user */}
        <div className="border-t border-white/[0.06] p-3">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <UserAvatar
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: 'h-9 w-9',
                },
              }}
            />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/80">Mi cuenta</p>
                <p className="text-xs text-white/40">Gestionar perfil</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse button (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-20 -right-3 hidden h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#0A1628] shadow-sm hover:bg-white/10 md:flex"
        >
          <ChevronLeft
            className={`h-4 w-4 text-white/50 transition-transform ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/[0.06] bg-[#0A1628]/80 px-4 backdrop-blur-xl">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white/80 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/25">
              <span className="text-sm font-bold text-white">D</span>
            </div>
            <span className="text-lg font-semibold text-white/90">Doci</span>
          </Link>
          <div className="hidden flex-1 md:block">
            <CommandPalette />
          </div>
          <div className="ml-auto">
            <UserAvatar afterSignOutUrl="/sign-in" />
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 md:p-8">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>

      {/* ── Mobile bottom nav ───────────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06] bg-[#0A1628]/90 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-around py-2">
          <MobileNavItem
            href="/dashboard"
            icon={Home}
            label="Inicio"
            active={pathname === '/dashboard'}
          />
          <MobileNavItem
            href="/dashboard/patients"
            icon={Users}
            label="Pacientes"
            active={pathname.startsWith('/dashboard/patients')}
          />
          <MobileNavItem
            href="/dashboard/consultations/new"
            icon={Mic}
            label="Grabar"
            highlight
            active={pathname === '/dashboard/consultations/new'}
          />
          <MobileNavItem
            href="/dashboard/appointments"
            icon={Calendar}
            label="Agenda"
            active={pathname.startsWith('/dashboard/appointments')}
          />
          <MobileNavItem
            href="/dashboard/settings"
            icon={Settings}
            label="Config"
            active={pathname.startsWith('/dashboard/settings')}
          />
        </div>
      </nav>
    </div>
  );
}

/* ── NavItem ─────────────────────────────────────────────────────────────── */

function NavItem({
  href,
  icon: Icon,
  children,
  highlight = false,
  collapsed = false,
  active = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  highlight?: boolean;
  collapsed?: boolean;
  active?: boolean;
}) {
  const baseStyles =
    'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200';

  let styles = baseStyles;
  if (highlight) {
    styles +=
      ' bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30';
  } else if (active) {
    styles += ' bg-white/10 text-white';
  } else {
    styles += ' text-white/50 hover:bg-white/5 hover:text-white/80';
  }

  if (collapsed) {
    styles += ' justify-center';
  }

  return (
    <Link href={href} className={styles} title={collapsed ? String(children) : undefined}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && <span>{children}</span>}
    </Link>
  );
}

/* ── MobileNavItem ───────────────────────────────────────────────────────── */

function MobileNavItem({
  href,
  icon: Icon,
  label,
  highlight = false,
  active = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  highlight?: boolean;
  active?: boolean;
}) {
  let textColor = 'text-white/40';
  if (highlight) textColor = 'text-blue-400';
  else if (active) textColor = 'text-blue-400';

  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${textColor}`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}
