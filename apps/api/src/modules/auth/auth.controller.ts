import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser, ClerkUser } from '../../common/decorators';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getCurrentUser(@CurrentUser() user: ClerkUser) {
    const dbUser = await this.authService.getUserByClerkId(user.id);
    return {
      clerk: user,
      profile: dbUser,
    };
  }

  @Post('sync')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync Clerk user with database' })
  async syncUser(
    @CurrentUser() user: ClerkUser,
    @Body() body: { tenantId: string },
  ) {
    return this.authService.syncUser(user.id, body.tenantId);
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
        // User sync is handled on first API call
        break;
      case 'user.deleted':
        // Handle user deletion if needed
        break;
    }

    return { received: true };
  }
}
