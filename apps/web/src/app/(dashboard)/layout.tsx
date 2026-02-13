'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
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
} from 'lucide-react';
import { CommandPalette } from '@/components/search';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Pacientes', href: '/patients', icon: Users },
    { name: 'Agenda', href: '/appointments', icon: Calendar },
    { name: 'Consultas', href: '/consultations', icon: FileText },
    { name: 'Plantillas', href: '/templates', icon: FileStack },
  ];

  const secondaryNavigation = [
    { name: 'Reportes', href: '/reports', icon: BarChart3 },
    { name: 'Almacenamiento', href: '/storage', icon: HardDrive },
    { name: 'Configuración', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200/60 bg-white/80 backdrop-blur-xl transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 ${collapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200/60 px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25">
              <span className="text-lg font-bold">D</span>
            </div>
            {!collapsed && <span className="text-xl font-semibold text-gray-900">Doci</span>}
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 hover:bg-slate-100 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
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

          <div className="my-4 border-t border-gray-200/60" />

          <NavItem
            href="/consultations/new"
            icon={Mic}
            highlight
            collapsed={collapsed}
            active={pathname === '/consultations/new'}
          >
            Nueva Consulta
          </NavItem>

          <div className="my-4 border-t border-gray-200/60" />

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
        <div className="border-t border-gray-200/60 p-3">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: 'h-9 w-9',
                },
              }}
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Mi cuenta</p>
                <p className="text-xs text-gray-500">Gestionar perfil</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse button (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3 top-20 h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-gray-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25">
              <span className="text-sm font-bold">D</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">Doci</span>
          </Link>
          <div className="flex-1 hidden md:block">
            <CommandPalette />
          </div>
          <div className="ml-auto">
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>

        <div className="p-4 md:p-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200/60 bg-white/80 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-around py-2">
          <MobileNavItem href="/" icon={Home} label="Inicio" active={pathname === '/'} />
          <MobileNavItem href="/patients" icon={Users} label="Pacientes" active={pathname.startsWith('/patients')} />
          <MobileNavItem
            href="/consultations/new"
            icon={Mic}
            label="Grabar"
            highlight
            active={pathname === '/consultations/new'}
          />
          <MobileNavItem href="/appointments" icon={Calendar} label="Agenda" active={pathname.startsWith('/appointments')} />
          <MobileNavItem href="/settings" icon={Settings} label="Config" active={pathname.startsWith('/settings')} />
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
  const baseStyles = 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200';
  
  let styles = baseStyles;
  if (highlight) {
    styles += ' bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30';
  } else if (active) {
    styles += ' bg-teal-50 text-teal-700';
  } else {
    styles += ' text-gray-600 hover:bg-gray-100 hover:text-gray-900';
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
  let textColor = 'text-gray-500';
  if (highlight) textColor = 'text-teal-600';
  else if (active) textColor = 'text-teal-600';

  return (
    <Link href={href} className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${textColor}`}>
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}
