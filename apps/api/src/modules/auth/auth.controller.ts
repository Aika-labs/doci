import { Controller, Get, Put, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser, CurrentUserData } from '../../common/decorators';
import { Public } from '../../common/decorators/public.decorator';
import { UpdateProfileDto, UpdateTenantDto } from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile with tenant info' })
  async getCurrentUser(@CurrentUser() user: CurrentUserData) {
    return this.authService.getUserByClerkId(user.clerkId);
  }

  @Put('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateCurrentUser(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Get('tenant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current tenant info' })
  async getCurrentTenant(@CurrentUser() user: CurrentUserData) {
    return user.tenant;
  }

  @Put('tenant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current tenant settings' })
  async updateCurrentTenant(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.authService.updateTenant(user.tenantId, dto);
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
