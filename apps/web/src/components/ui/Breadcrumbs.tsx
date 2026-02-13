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
  const allItems = showHome
    ? [{ label: 'Inicio', href: '/' }, ...items]
    : items;

  return (
    <nav className="flex items-center text-sm text-gray-500 mb-4">
      {allItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />}
          {index === 0 && showHome ? (
            <Link
              href={item.href || '/'}
              className="flex items-center gap-1 hover:text-gray-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ) : item.href ? (
            <Link
              href={item.href}
              className="hover:text-gray-700 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
