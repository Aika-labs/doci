// Re-export Prisma Client and types
export * from '@prisma/client';

import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Helper type for tenant-scoped queries
export type TenantContext = {
  tenantId: string;
  userId?: string;
};

// Utility to create tenant-scoped Prisma operations
export function withTenant<T extends object>(data: T, ctx: TenantContext): T & { tenantId: string } {
  return { ...data, tenantId: ctx.tenantId };
}
