import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser, CurrentUserData } from '../../common/decorators';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile with tenant info' })
  async getCurrentUser(@CurrentUser() user: CurrentUserData) {
    // User is already populated by the guard with full tenant info
    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenant: user.tenant,
    };
  }

  @Get('tenant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current tenant info' })
  async getCurrentTenant(@CurrentUser() user: CurrentUserData) {
    return user.tenant;
  }

  @Post('sync')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync Clerk user with database (manual trigger)' })
  async syncUser(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { tenantId?: string },
  ) {
    return this.authService.syncUser(user.clerkId, body.tenantId || user.tenantId);
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Clerk webhook endpoint' })
  async handleWebhook(@Body() payload: Record<string, unknown>) {
    // Handle Clerk webhooks (user.created, user.updated, etc.)
    const eventType = payload.type as string;

    switch (eventType) {
      case 'user.created':
      case 'user.updated':
        // User sync is handled on first API call via ClerkAuthGuard
        break;
      case 'user.deleted':
        // Handle user deletion if needed
        break;
    }

    return { received: true };
  }
}
