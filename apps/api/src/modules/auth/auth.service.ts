import { Injectable } from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  private clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  constructor(private prisma: PrismaService) {}

  /**
   * Sync Clerk user with our database
   * Creates or updates the user record
   */
  async syncUser(clerkUserId: string, tenantId: string) {
    const clerkUser = await this.clerk.users.getUser(clerkUserId);

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) {
      throw new Error('User must have an email address');
    }

    // Get role from Clerk metadata or default to DOCTOR
    const roleFromMetadata = clerkUser.publicMetadata?.role as string | undefined;
    const validRoles = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] as const;
    type ValidRole = (typeof validRoles)[number];
    const role: ValidRole = validRoles.includes(roleFromMetadata as ValidRole)
      ? (roleFromMetadata as ValidRole)
      : 'DOCTOR';

    const user = await this.prisma.user.upsert({
      where: { clerkId: clerkUserId },
      update: {
        email,
        firstName: clerkUser.firstName ?? undefined,
        lastName: clerkUser.lastName ?? undefined,
        updatedAt: new Date(),
      },
      create: {
        clerkId: clerkUserId,
        email,
        firstName: clerkUser.firstName ?? '',
        lastName: clerkUser.lastName ?? '',
        role,
        tenantId,
      },
    });

    return user;
  }

  /**
   * Get user by Clerk ID
   */
  async getUserByClerkId(clerkId: string) {
    return this.prisma.user.findUnique({
      where: { clerkId },
      include: { tenant: true },
    });
  }

  /**
   * Update user role in Clerk metadata
   */
  async updateUserRole(clerkUserId: string, role: string) {
    await this.clerk.users.updateUserMetadata(clerkUserId, {
      publicMetadata: { role },
    });
  }
}
