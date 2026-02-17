'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] py-12 text-center">
      <Icon className="mx-auto mb-3 h-12 w-12 text-white/20" />
      <p className="mb-1 font-medium text-white/70">{title}</p>
      {description && <p className="mb-4 text-sm text-white/40">{description}</p>}
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white transition-colors hover:from-blue-600 hover:to-cyan-600"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white transition-colors hover:from-blue-600 hover:to-cyan-600"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
