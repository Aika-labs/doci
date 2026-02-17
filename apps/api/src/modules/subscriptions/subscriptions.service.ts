import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';
import { Prisma } from '@doci/database';

// ============================================
// Default Pricing Plans
// ============================================

const DEFAULT_PLANS = [
  {
    name: 'basic',
    displayName: 'Básico',
    description: 'Ideal para consultorios pequeños',
    monthlyPrice: 499,
    yearlyPrice: 4990,
    currency: 'MXN',
    maxUsers: 2,
    maxPatients: 500,
    maxStorageMb: 5120, // 5GB
    maxAppointments: 200,
    features: ['ai_transcription', 'basic_templates', 'email_support'],
    isPopular: false,
  },
  {
    name: 'professional',
    displayName: 'Profesional',
    description: 'Para clínicas en crecimiento',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    currency: 'MXN',
    maxUsers: 5,
    maxPatients: 2000,
    maxStorageMb: 20480, // 20GB
    maxAppointments: 1000,
    features: [
      'ai_transcription',
      'all_templates',
      'whatsapp_reminders',
      'calendar_sync',
      'priority_support',
    ],
    isPopular: true,
  },
  {
    name: 'enterprise',
    displayName: 'Empresarial',
    description: 'Para hospitales y clínicas grandes',
    monthlyPrice: 2499,
    yearlyPrice: 24990,
    currency: 'MXN',
    maxUsers: null, // Unlimited
    maxPatients: null,
    maxStorageMb: 102400, // 100GB
    maxAppointments: null,
    features: [
      'ai_transcription',
      'all_templates',
      'whatsapp_reminders',
      'calendar_sync',
      'api_access',
      'custom_branding',
      'dedicated_support',
      'sla_99_9',
    ],
    isPopular: false,
  },
];

// ============================================
// Service
// ============================================

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private readonly stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY') || '');
  }

  // ============================================
  // Pricing Plans
  // ============================================

  /**
   * Get all pricing plans
   */
  async getPlans() {
    return this.prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: 'asc' },
    });
  }

  /**
   * Get a specific plan
   */
  async getPlan(planName: string) {
    return this.prisma.pricingPlan.findUnique({
      where: { name: planName },
    });
  }

  /**
   * Seed default plans
   */
  async seedPlans(): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    for (const plan of DEFAULT_PLANS) {
      const existing = await this.prisma.pricingPlan.findUnique({
        where: { name: plan.name },
      });

      if (existing) {
        await this.prisma.pricingPlan.update({
          where: { name: plan.name },
          data: {
            displayName: plan.displayName,
            description: plan.description,
            monthlyPrice: new Prisma.Decimal(plan.monthlyPrice),
            yearlyPrice: new Prisma.Decimal(plan.yearlyPrice),
            currency: plan.currency,
            maxUsers: plan.maxUsers,
            maxPatients: plan.maxPatients,
            maxStorageMb: plan.maxStorageMb,
            maxAppointments: plan.maxAppointments,
            features: plan.features,
            isPopular: plan.isPopular,
          },
        });
        updated++;
      } else {
        await this.prisma.pricingPlan.create({
          data: {
            name: plan.name,
            displayName: plan.displayName,
            description: plan.description,
            monthlyPrice: new Prisma.Decimal(plan.monthlyPrice),
            yearlyPrice: new Prisma.Decimal(plan.yearlyPrice),
            currency: plan.currency,
            maxUsers: plan.maxUsers,
            maxPatients: plan.maxPatients,
            maxStorageMb: plan.maxStorageMb,
            maxAppointments: plan.maxAppointments,
            features: plan.features,
            isPopular: plan.isPopular,
          },
        });
        created++;
      }
    }

    return { created, updated };
  }

  // ============================================
  // Subscriptions
  // ============================================

  /**
   * Get subscription for a tenant
   */
  async getSubscription(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription) {
      return null;
    }

    // Check usage limits
    const usage = await this.getUsage(tenantId);

    return {
      ...subscription,
      usage,
    };
  }

  /**
   * Create a new subscription (start trial)
   */
  async createSubscription(tenantId: string, planName: string) {
    const plan = await this.prisma.pricingPlan.findUnique({
      where: { name: planName },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Check if subscription already exists
    const existing = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (existing) {
      throw new BadRequestException('Subscription already exists');
    }

    // Create subscription with 14-day trial
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    return this.prisma.subscription.create({
      data: {
        tenantId,
        planId: plan.id,
        status: 'TRIALING',
        trialEndsAt,
      },
      include: { plan: true },
    });
  }

  /**
   * Upgrade/downgrade subscription
   */
  async changePlan(tenantId: string, newPlanName: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const newPlan = await this.prisma.pricingPlan.findUnique({
      where: { name: newPlanName },
    });

    if (!newPlan) {
      throw new NotFoundException('Plan not found');
    }

    // If has Stripe subscription, update it
    if (subscription.stripeSubscriptionId) {
      // Get Stripe price ID for new plan
      const stripePriceId = await this.getOrCreateStripePrice(newPlan);

      await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [
          {
            id: (await this.stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)).items
              .data[0].id,
            price: stripePriceId,
          },
        ],
        proration_behavior: 'create_prorations',
      });
    }

    return this.prisma.subscription.update({
      where: { tenantId },
      data: { planId: newPlan.id },
      include: { plan: true },
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Cancel in Stripe if exists
    if (subscription.stripeSubscriptionId) {
      await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    return this.prisma.subscription.update({
      where: { tenantId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
  }

  // ============================================
  // Stripe Integration
  // ============================================

  /**
   * Create Stripe checkout session
   */
  async createCheckoutSession(
    tenantId: string,
    planName: string,
    billingCycle: 'MONTHLY' | 'YEARLY'
  ) {
    const plan = await this.prisma.pricingPlan.findUnique({
      where: { name: planName },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    // Get or create Stripe customer
    let customerId = subscription?.stripeCustomerId;
    if (!customerId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { users: { take: 1 } },
      });

      const customer = await this.stripe.customers.create({
        email: tenant?.users[0]?.email,
        metadata: { tenantId },
      });

      customerId = customer.id;

      // Save customer ID
      if (subscription) {
        await this.prisma.subscription.update({
          where: { tenantId },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    // Get or create Stripe price
    const priceId = await this.getOrCreateStripePrice(plan, billingCycle);

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${this.configService.get('APP_URL')}/settings/billing?success=true`,
      cancel_url: `${this.configService.get('APP_URL')}/settings/billing?cancelled=true`,
      metadata: {
        tenantId,
        planName,
        billingCycle,
      },
    });

    return { url: session.url };
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutComplete(session);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handleInvoicePaid(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentFailed(invoice);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionDeleted(subscription);
        break;
      }
    }
  }

  // ============================================
  // Usage & Limits
  // ============================================

  /**
   * Get current usage for a tenant
   */
  async getUsage(tenantId: string) {
    const [userCount, patientCount, appointmentCount, storageUsed] = await Promise.all([
      this.prisma.user.count({ where: { tenantId, isActive: true } }),
      this.prisma.patient.count({ where: { tenantId, isActive: true } }),
      this.prisma.appointment.count({
        where: {
          tenantId,
          startTime: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { storageUsedMb: true },
      }),
    ]);

    return {
      users: userCount,
      patients: patientCount,
      appointmentsThisMonth: appointmentCount,
      storageMb: storageUsed?.storageUsedMb || 0,
    };
  }

  /**
   * Check if tenant can perform action based on limits
   */
  async checkLimit(
    tenantId: string,
    limitType: 'users' | 'patients' | 'appointments' | 'storage'
  ): Promise<{ allowed: boolean; current: number; limit: number | null }> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription) {
      return { allowed: false, current: 0, limit: 0 };
    }

    const usage = await this.getUsage(tenantId);
    const plan = subscription.plan;

    let current: number;
    let limit: number | null;

    switch (limitType) {
      case 'users':
        current = usage.users;
        limit = plan.maxUsers;
        break;
      case 'patients':
        current = usage.patients;
        limit = plan.maxPatients;
        break;
      case 'appointments':
        current = usage.appointmentsThisMonth;
        limit = plan.maxAppointments;
        break;
      case 'storage':
        current = usage.storageMb;
        limit = plan.maxStorageMb;
        break;
    }

    const allowed = limit === null || current < limit;

    return { allowed, current, limit };
  }

  // ============================================
  // Private helpers
  // ============================================

  private async getOrCreateStripePrice(
    plan: { name: string; monthlyPrice: Prisma.Decimal; yearlyPrice: Prisma.Decimal },
    billingCycle: 'MONTHLY' | 'YEARLY' = 'MONTHLY'
  ): Promise<string> {
    const interval = billingCycle === 'YEARLY' ? 'year' : 'month';
    const amount = billingCycle === 'YEARLY' ? Number(plan.yearlyPrice) : Number(plan.monthlyPrice);

    // Search for existing price
    const prices = await this.stripe.prices.search({
      query: `metadata['plan_name']:'${plan.name}' AND metadata['interval']:'${interval}'`,
    });

    if (prices.data.length > 0) {
      return prices.data[0].id;
    }

    // Create product if needed
    const products = await this.stripe.products.search({
      query: `metadata['plan_name']:'${plan.name}'`,
    });

    let productId: string;
    if (products.data.length > 0) {
      productId = products.data[0].id;
    } else {
      const product = await this.stripe.products.create({
        name: `Doci ${plan.name}`,
        metadata: { plan_name: plan.name },
      });
      productId = product.id;
    }

    // Create price
    const price = await this.stripe.prices.create({
      product: productId,
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency: 'mxn',
      recurring: { interval },
      metadata: { plan_name: plan.name, interval },
    });

    return price.id;
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const tenantId = session.metadata?.tenantId;
    const planName = session.metadata?.planName;
    const billingCycle = session.metadata?.billingCycle as 'MONTHLY' | 'YEARLY';

    if (!tenantId || !planName) return;

    const plan = await this.prisma.pricingPlan.findUnique({
      where: { name: planName },
    });

    if (!plan) return;

    await this.prisma.subscription.upsert({
      where: { tenantId },
      create: {
        tenantId,
        planId: plan.id,
        status: 'ACTIVE',
        billingCycle,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
      },
      update: {
        planId: plan.id,
        status: 'ACTIVE',
        billingCycle,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        trialEndsAt: null,
      },
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const subscription = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (subscription) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'ACTIVE' },
      });
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const subscription = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (subscription) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'PAST_DUE' },
      });
    }
  }

  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (subscription) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'EXPIRED',
          endDate: new Date(),
        },
      });
    }
  }
}
