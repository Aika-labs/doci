'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

export function Breadcrumbs({ items, showHome = true }: BreadcrumbsProps) {
  const allItems = showHome ? [{ label: 'Inicio', href: '/' }, ...items] : items;

  return (
    <nav className="mb-4 flex items-center text-sm text-white/40">
      {allItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="mx-2 h-4 w-4 text-white/30" />}
          {index === 0 && showHome ? (
            <Link
              href={item.href || '/'}
              className="flex items-center gap-1 transition-colors hover:text-white/70"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ) : item.href ? (
            <Link href={item.href} className="transition-colors hover:text-white/70">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-white">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
