import { Injectable } from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PrismaService type not available without generated client
    const user = await (this.prisma as any).user.upsert({
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PrismaService type not available without generated client
    return (this.prisma as any).user.findUnique({
      where: { clerkId },
      include: { tenant: true },
    });
  }

  /**
   * Update user profile fields
   */
  async updateProfile(userId: string, data: UpdateProfileDto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PrismaService type not available without generated client
    return (this.prisma as any).user.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.specialty !== undefined && { specialty: data.specialty }),
        ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.bio !== undefined && { aiPreferences: { bio: data.bio } }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        specialty: true,
        licenseNumber: true,
        phone: true,
        aiPreferences: true,
      },
    });
  }

  /**
   * Update tenant/clinic settings
   */
  async updateTenant(tenantId: string, data: UpdateTenantDto) {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;

    // Store address, contact, and schedule in the settings JSONB field
    const settings: Record<string, unknown> = {};
    if (data.address !== undefined) settings.address = data.address;
    if (data.city !== undefined) settings.city = data.city;
    if (data.state !== undefined) settings.state = data.state;
    if (data.postalCode !== undefined) settings.postalCode = data.postalCode;
    if (data.phone !== undefined) settings.phone = data.phone;
    if (data.email !== undefined) settings.email = data.email;
    if (data.website !== undefined) settings.website = data.website;
    if (data.schedule !== undefined) settings.schedule = data.schedule;

    if (Object.keys(settings).length > 0) {
      updateData.settings = settings;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PrismaService type not available without generated client
    return (this.prisma as any).tenant.update({
      where: { id: tenantId },
      data: updateData,
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
