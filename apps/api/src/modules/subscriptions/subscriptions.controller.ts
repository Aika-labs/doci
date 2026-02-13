import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  RawBodyRequest,
  Req,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { SubscriptionsService } from './subscriptions.service';
import { ClerkAuthGuard } from '../../common/guards';
import { TenantId, Public } from '../../common/decorators';
import Stripe from 'stripe';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  private readonly stripe: Stripe;

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY') || '');
  }

  // ============================================
  // Pricing Plans
  // ============================================

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Get all pricing plans' })
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Public()
  @Get('plans/:name')
  @ApiOperation({ summary: 'Get a specific plan' })
  async getPlan(@Param('name') name: string) {
    return this.subscriptionsService.getPlan(name);
  }

  @Post('plans/seed')
  @ApiOperation({ summary: 'Seed default pricing plans' })
  async seedPlans() {
    return this.subscriptionsService.seedPlans();
  }

  // ============================================
  // Subscriptions
  // ============================================

  @Get()
  @ApiOperation({ summary: 'Get current subscription' })
  async getSubscription(@TenantId() tenantId: string) {
    return this.subscriptionsService.getSubscription(tenantId);
  }

  @Post('start-trial/:planName')
  @ApiOperation({ summary: 'Start a trial subscription' })
  async startTrial(@TenantId() tenantId: string, @Param('planName') planName: string) {
    return this.subscriptionsService.createSubscription(tenantId, planName);
  }

  @Post('change-plan/:planName')
  @ApiOperation({ summary: 'Change subscription plan' })
  async changePlan(@TenantId() tenantId: string, @Param('planName') planName: string) {
    return this.subscriptionsService.changePlan(tenantId, planName);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancelSubscription(@TenantId() tenantId: string) {
    return this.subscriptionsService.cancelSubscription(tenantId);
  }

  // ============================================
  // Stripe Checkout
  // ============================================

  @Post('checkout')
  @ApiOperation({ summary: 'Create Stripe checkout session' })
  async createCheckout(
    @TenantId() tenantId: string,
    @Body() body: { planName: string; billingCycle: 'MONTHLY' | 'YEARLY' },
  ) {
    return this.subscriptionsService.createCheckoutSession(
      tenantId,
      body.planName,
      body.billingCycle,
    );
  }

  // ============================================
  // Usage & Limits
  // ============================================

  @Get('usage')
  @ApiOperation({ summary: 'Get current usage' })
  async getUsage(@TenantId() tenantId: string) {
    return this.subscriptionsService.getUsage(tenantId);
  }

  @Get('check-limit/:limitType')
  @ApiOperation({ summary: 'Check if action is allowed based on limits' })
  async checkLimit(
    @TenantId() tenantId: string,
    @Param('limitType') limitType: 'users' | 'patients' | 'appointments' | 'storage',
  ) {
    return this.subscriptionsService.checkLimit(tenantId, limitType);
  }

  // ============================================
  // Stripe Webhook
  // ============================================

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(req.rawBody!, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err}`);
    }

    await this.subscriptionsService.handleWebhook(event);

    return { received: true };
  }
}
