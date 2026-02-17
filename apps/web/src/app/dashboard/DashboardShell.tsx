'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  PlusCircle,
  ListTodo,
  CalendarDays,
  ShieldCheck,
  Ticket,
  Settings,
  X,
  Activity,
  Mail,
  Bell,
  ChevronDown,
  Menu,
  Users,
  Calendar,
  Plus,
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
/*  Navigation config                                                         */
/* -------------------------------------------------------------------------- */

/** Sidebar icon-rail items (desktop). */
const sidebarItems = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { href: '/dashboard/consultations/new', icon: PlusCircle, label: 'Nueva Consulta' },
  { href: '/dashboard/patients', icon: ListTodo, label: 'Pacientes' },
  { href: '/dashboard/appointments', icon: CalendarDays, label: 'Agenda' },
  { href: '/dashboard/templates', icon: ShieldCheck, label: 'Plantillas' },
  { href: '/dashboard/billing', icon: Ticket, label: 'Facturación' },
];

/** Header nav-pill items (desktop center). */
const headerNavItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/patients', label: 'Pacientes' },
  { href: '/dashboard/appointments', label: 'Agenda' },
  { href: '/dashboard/consultations', label: 'Consultas' },
  { href: '/dashboard/reports', label: 'Reportes', dot: true },
];

/** Mobile overlay menu links. */
const mobileMenuItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/patients', label: 'Pacientes' },
  { href: '/dashboard/appointments', label: 'Agenda' },
  { href: '/dashboard/consultations', label: 'Consultas' },
  { href: '/dashboard/reports', label: 'Reportes' },
  { href: '/dashboard/billing', label: 'Facturación' },
  { href: '/dashboard/templates', label: 'Plantillas' },
  { href: '/dashboard/storage', label: 'Almacenamiento' },
  { href: '/dashboard/settings', label: 'Configuración' },
];

/* -------------------------------------------------------------------------- */
/*  DashboardShell                                                            */
/* -------------------------------------------------------------------------- */

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0F1E29]">
      {/* ── Mobile Menu Overlay ──────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center space-y-8 bg-[#0F1E29]/95 p-8 backdrop-blur-xl md:hidden">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-6 right-6 text-white"
          >
            <X className="h-8 w-8" />
          </button>
          {mobileMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`text-2xl font-medium transition-colors hover:text-[#a8d944] ${
                isActive(item.href) ? 'text-white' : 'text-slate-400'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* ── Left Sidebar — Desktop Icon Rail ─────────────────── */}
      <aside className="hidden w-24 flex-col items-center border-r border-white/5 bg-[#0F1E29] py-8 md:flex">
        {/* Floating pill container */}
        <div className="flex flex-col gap-6 rounded-full border border-white/5 bg-[#162633] px-2 py-4 shadow-2xl">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                  active
                    ? 'bg-white text-[#0F1E29] shadow-lg'
                    : 'text-slate-400 hover:bg-white/5 hover:text-[#a8d944]'
                }`}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </div>

        {/* Settings at bottom */}
        <div className="mt-auto">
          <Link
            href="/dashboard/settings"
            title="Configuración"
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              isActive('/dashboard/settings')
                ? 'bg-[#162633] text-white'
                : 'text-slate-500 hover:bg-[#162633] hover:text-white'
            }`}
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* ── Top Header ───────────────────────────────────── */}
        <header className="z-30 flex h-24 shrink-0 items-center justify-between px-6 md:px-10">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-[#a8d944]" />
            <span className="text-2xl font-bold tracking-tight text-white">Doci</span>
          </Link>

          {/* Desktop Nav Pill (center) */}
          <nav className="hidden items-center rounded-full border border-white/5 bg-[#162633] px-2 py-1.5 shadow-xl lg:flex">
            {headerNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? 'bg-white font-semibold text-[#0F1E29] shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                  {item.dot && !active && (
                    <span className="absolute top-2 right-3 h-1.5 w-1.5 rounded-full bg-[#a8d944]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Search trigger (mobile) — opens CommandPalette */}
            <div className="md:hidden">
              <CommandPalette />
            </div>

            {/* Mail */}
            <button className="flex h-12 w-12 items-center justify-center rounded-full border border-white/5 bg-[#162633] text-slate-300 transition-colors hover:bg-white/10">
              <Mail className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <button className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/5 bg-[#162633] text-slate-300 transition-colors hover:bg-white/10">
              <span className="absolute top-3 right-3 h-2 w-2 rounded-full border border-[#162633] bg-red-500" />
              <Bell className="h-5 w-5" />
            </button>

            {/* Profile pill (desktop) */}
            <div className="hidden items-center gap-3 rounded-full border border-white/5 bg-[#162633] py-1.5 pr-2 pl-2 md:flex">
              <UserAvatar
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: 'h-9 w-9 rounded-full',
                  },
                }}
              />
              <div className="mr-2 flex flex-col">
                <span className="text-xs leading-tight font-semibold text-white">Mi cuenta</span>
                <span className="text-[10px] leading-tight text-slate-400">Gestionar perfil</span>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-500" />
            </div>

            {/* Desktop CommandPalette (hidden on mobile) */}
            <div className="hidden md:block">
              <CommandPalette />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="ml-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#162633] text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* ── Page Content ─────────────────────────────────── */}
        <div className="no-scrollbar flex-1 overflow-y-auto p-6 pt-0 md:p-10 md:pt-0">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>

      {/* ── Bottom Mobile Nav ────────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-20 shrink-0 items-center justify-around border-t border-white/5 bg-[#0F1E29] px-4 md:hidden">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 ${
            pathname === '/dashboard' ? 'text-[#a8d944]' : 'text-slate-500'
          }`}
        >
          <LayoutGrid className="h-6 w-6" />
        </Link>

        <Link
          href="/dashboard/appointments"
          className={`flex flex-col items-center gap-1 ${
            pathname.startsWith('/dashboard/appointments') ? 'text-[#a8d944]' : 'text-slate-500'
          }`}
        >
          <Calendar className="h-6 w-6" />
        </Link>

        {/* Floating lime "+" button */}
        <Link
          href="/dashboard/consultations/new"
          className="-mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#a8d944] text-[#0F1E29] shadow-[0_0_20px_rgba(168,217,68,0.3)]"
        >
          <Plus className="h-8 w-8" />
        </Link>

        <Link
          href="/dashboard/patients"
          className={`flex flex-col items-center gap-1 ${
            pathname.startsWith('/dashboard/patients') ? 'text-[#a8d944]' : 'text-slate-500'
          }`}
        >
          <Users className="h-6 w-6" />
        </Link>

        <Link
          href="/dashboard/settings"
          className={`flex flex-col items-center gap-1 ${
            pathname.startsWith('/dashboard/settings') ? 'text-[#a8d944]' : 'text-slate-500'
          }`}
        >
          <Settings className="h-6 w-6" />
        </Link>
      </nav>
    </div>
  );
}
