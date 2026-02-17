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
    <nav className="mb-4 flex items-center text-sm text-gray-500">
      {allItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />}
          {index === 0 && showHome ? (
            <Link
              href={item.href || '/'}
              className="flex items-center gap-1 transition-colors hover:text-gray-700"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ) : item.href ? (
            <Link href={item.href} className="transition-colors hover:text-gray-700">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-gray-900">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
