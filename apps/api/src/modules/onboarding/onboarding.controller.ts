import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { ClerkAuthGuard } from '../../common/guards';
import { CurrentUser, TenantId } from '../../common/decorators';

@ApiTags('Onboarding')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get onboarding status' })
  async getStatus(@CurrentUser('id') userId: string, @TenantId() tenantId: string) {
    return this.onboardingService.getStatus(userId, tenantId);
  }

  @Post('complete/:stepId')
  @ApiOperation({ summary: 'Mark a step as completed' })
  async completeStep(
    @CurrentUser('id') userId: string,
    @TenantId() tenantId: string,
    @Param('stepId') stepId: string
  ) {
    return this.onboardingService.completeStep(userId, tenantId, stepId);
  }

  @Post('skip')
  @ApiOperation({ summary: 'Skip onboarding' })
  async skip(@CurrentUser('id') userId: string) {
    await this.onboardingService.skip(userId);
    return { success: true };
  }

  @Post('detect')
  @ApiOperation({ summary: 'Auto-detect completed steps' })
  async autoDetect(@CurrentUser('id') userId: string, @TenantId() tenantId: string) {
    return this.onboardingService.autoDetectProgress(userId, tenantId);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset onboarding (for testing)' })
  async reset(@CurrentUser('id') userId: string, @TenantId() tenantId: string) {
    return this.onboardingService.reset(userId, tenantId);
  }
}
