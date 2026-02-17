import DashboardShell from './DashboardShell';

// Prevent static generation of dashboard pages — they require Clerk auth at runtime.
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
