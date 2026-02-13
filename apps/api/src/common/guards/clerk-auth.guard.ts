import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifyToken, createClerkClient } from '@clerk/backend';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

// User type attached to request
export interface RequestUser {
  id: string; // Internal user ID (from our DB)
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
}

// Extend Express Request - using module augmentation
declare module 'express' {
  interface Request {
    user?: RequestUser;
    tenantId?: string;
    userId?: string;
  }
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      const { sub: clerkUserId } = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      if (!clerkUserId) {
        throw new UnauthorizedException('Invalid token');
      }

      // Get user from our database (includes tenant info)
      let dbUser = await this.prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              plan: true,
            },
          },
        },
      });

      // If user doesn't exist in our DB, create them (first-time login)
      if (!dbUser) {
        dbUser = await this.createUserFromClerk(clerkUserId);
      }

      if (!dbUser) {
        throw new ForbiddenException('User not found and could not be created');
      }

      if (!dbUser.isActive) {
        throw new ForbiddenException('User account is deactivated');
      }

      // Attach user info to request
      request.user = {
        id: dbUser.id,
        clerkId: dbUser.clerkId,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: dbUser.role,
        tenantId: dbUser.tenantId,
        tenant: dbUser.tenant,
      };

      // Also set these for backward compatibility with TenantContext
      request.tenantId = dbUser.tenantId;
      request.userId = dbUser.id;

      return true;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Create a new user in our database from Clerk data
   * This handles first-time login scenarios
   */
  private async createUserFromClerk(clerkUserId: string) {
    try {
      const clerkUser = await this.clerk.users.getUser(clerkUserId);
      const email = clerkUser.emailAddresses[0]?.emailAddress;

      if (!email) {
        return null;
      }

      // Get tenant from Clerk metadata or create a default one
      const tenantSlug =
        (clerkUser.publicMetadata?.tenantSlug as string) ||
        email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');

      // Find or create tenant
      let tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantSlug },
      });

      if (!tenant) {
        // Create a new tenant for this user (they become the admin)
        tenant = await this.prisma.tenant.create({
          data: {
            name: `${clerkUser.firstName || 'Mi'} Consultorio`,
            slug: tenantSlug,
            plan: 'BASIC',
          },
        });
      }

      // Get role from Clerk metadata
      const roleFromMetadata = clerkUser.publicMetadata?.role as string;
      const validRoles = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] as const;
      type ValidRole = (typeof validRoles)[number];
      const role: ValidRole = validRoles.includes(roleFromMetadata as ValidRole)
        ? (roleFromMetadata as ValidRole)
        : 'DOCTOR';

      // Create user
      const user = await this.prisma.user.create({
        data: {
          clerkId: clerkUserId,
          email,
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          role,
          tenantId: tenant.id,
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
              plan: true,
            },
          },
        },
      });

      return user;
    } catch (error) {
      console.error('Error creating user from Clerk:', error);
      return null;
    }
  }
}
