'use client';

/**
 * Reusable skeleton loading components for consistent loading states.
 */

interface SkeletonProps {
  className?: string;
}

/** Base skeleton block with shimmer animation */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-2xl bg-white/10 ${className}`} />;
}

/** Skeleton for stat/metric cards (used in Dashboard, Billing) */
export function StatCardSkeleton() {
  return (
    <div className="rounded-[2rem] border bg-white/[0.03] p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton for a table row */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

/** Skeleton for a full table (used in Patients, Billing invoices) */
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03]">
      <table className="w-full">
        <thead className="bg-white/[0.02]">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Skeleton for a card in a grid (used in Billing services) */
export function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <div className="flex items-center justify-between border-t pt-3">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

/** Full dashboard skeleton layout */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Appointments list */}
      <div className="space-y-4 rounded-[2rem] border bg-white/[0.03] p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-2xl border p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-14" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-[2rem] border bg-white/[0.03] p-6"
          >
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Patients list skeleton */
export function PatientsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
      <TableSkeleton rows={6} columns={5} />
    </div>
  );
}

/** Billing page skeleton */
export function BillingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <Skeleton className="h-10 w-56 rounded-lg" />
      <TableSkeleton rows={5} columns={6} />
    </div>
  );
}
