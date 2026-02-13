import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ============================================
// Types
// ============================================

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
}

export interface OnboardingStatus {
  isCompleted: boolean;
  completedAt?: Date;
  progress: number;
  steps: OnboardingStep[];
}

// Default onboarding steps
const DEFAULT_STEPS: Omit<OnboardingStep, 'completed'>[] = [
  {
    id: 'profile',
    title: 'Completa tu perfil',
    description: 'Agrega tu información profesional, cédula y firma digital',
    order: 1,
  },
  {
    id: 'clinic',
    title: 'Configura tu clínica',
    description: 'Personaliza el nombre, logo y colores de tu consultorio',
    order: 2,
  },
  {
    id: 'schedule',
    title: 'Define tu horario',
    description: 'Configura tus días y horas de atención',
    order: 3,
  },
  {
    id: 'firstPatient',
    title: 'Registra tu primer paciente',
    description: 'Agrega un paciente para comenzar a usar el sistema',
    order: 4,
  },
  {
    id: 'firstConsultation',
    title: 'Crea tu primera consulta',
    description: 'Realiza una consulta de prueba con transcripción de voz',
    order: 5,
  },
  {
    id: 'templates',
    title: 'Personaliza tus plantillas',
    description: 'Configura las plantillas SOAP según tu especialidad',
    order: 6,
  },
];

// ============================================
// Service
// ============================================

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get onboarding status for a user
   */
  async getStatus(userId: string, tenantId: string): Promise<OnboardingStatus> {
    let progress = await this.prisma.onboardingProgress.findUnique({
      where: { userId },
    });

    // Create progress record if it doesn't exist
    if (!progress) {
      progress = await this.prisma.onboardingProgress.create({
        data: {
          userId,
          tenantId,
          completedSteps: {},
        },
      });
    }

    const completedSteps = (progress.completedSteps as Record<string, boolean>) || {};

    const steps: OnboardingStep[] = DEFAULT_STEPS.map((step) => ({
      ...step,
      completed: completedSteps[step.id] || false,
    }));

    const completedCount = steps.filter((s) => s.completed).length;
    const progressPercent = Math.round((completedCount / steps.length) * 100);

    return {
      isCompleted: progress.isCompleted,
      completedAt: progress.completedAt || undefined,
      progress: progressPercent,
      steps,
    };
  }

  /**
   * Mark a step as completed
   */
  async completeStep(userId: string, tenantId: string, stepId: string): Promise<OnboardingStatus> {
    const validStep = DEFAULT_STEPS.find((s) => s.id === stepId);
    if (!validStep) {
      throw new Error(`Invalid step: ${stepId}`);
    }

    let progress = await this.prisma.onboardingProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      progress = await this.prisma.onboardingProgress.create({
        data: {
          userId,
          tenantId,
          completedSteps: { [stepId]: true },
        },
      });
    } else {
      const completedSteps = (progress.completedSteps as Record<string, boolean>) || {};
      completedSteps[stepId] = true;

      // Check if all steps are completed
      const allCompleted = DEFAULT_STEPS.every((step) => completedSteps[step.id]);

      progress = await this.prisma.onboardingProgress.update({
        where: { userId },
        data: {
          completedSteps,
          ...(allCompleted && {
            isCompleted: true,
            completedAt: new Date(),
          }),
        },
      });
    }

    return this.getStatus(userId, tenantId);
  }

  /**
   * Skip onboarding
   */
  async skip(userId: string): Promise<void> {
    await this.prisma.onboardingProgress.update({
      where: { userId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Reset onboarding (for testing)
   */
  async reset(userId: string, tenantId: string): Promise<OnboardingStatus> {
    await this.prisma.onboardingProgress.upsert({
      where: { userId },
      create: {
        userId,
        tenantId,
        completedSteps: {},
      },
      update: {
        completedSteps: {},
        isCompleted: false,
        completedAt: null,
      },
    });

    return this.getStatus(userId, tenantId);
  }

  /**
   * Auto-detect completed steps based on user data
   */
  async autoDetectProgress(userId: string, tenantId: string): Promise<OnboardingStatus> {
    const [user, tenant, patients, consultations, templates] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
      this.prisma.patient.count({ where: { tenantId } }),
      this.prisma.consultation.count({ where: { tenantId } }),
      this.prisma.clinicalTemplate.count({ where: { tenantId } }),
    ]);

    const completedSteps: Record<string, boolean> = {};

    // Check profile completion
    if (user?.firstName && user?.lastName && user?.licenseNumber) {
      completedSteps['profile'] = true;
    }

    // Check clinic setup
    if (tenant?.name && tenant?.branding) {
      completedSteps['clinic'] = true;
    }

    // Check schedule (simplified - just check if tenant has settings)
    if (tenant?.settings) {
      completedSteps['schedule'] = true;
    }

    // Check first patient
    if (patients > 0) {
      completedSteps['firstPatient'] = true;
    }

    // Check first consultation
    if (consultations > 0) {
      completedSteps['firstConsultation'] = true;
    }

    // Check templates
    if (templates > 0) {
      completedSteps['templates'] = true;
    }

    // Update progress
    const allCompleted = DEFAULT_STEPS.every((step) => completedSteps[step.id]);

    await this.prisma.onboardingProgress.upsert({
      where: { userId },
      create: {
        userId,
        tenantId,
        completedSteps,
        isCompleted: allCompleted,
        completedAt: allCompleted ? new Date() : null,
      },
      update: {
        completedSteps,
        isCompleted: allCompleted,
        completedAt: allCompleted ? new Date() : null,
      },
    });

    return this.getStatus(userId, tenantId);
  }
}
