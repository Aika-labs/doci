import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CalendarService, CalendarEvent } from './calendar.service';
import { ClerkAuthGuard } from '../../common/guards';
import { CurrentUser, Public } from '../../common/decorators';

@ApiTags('Calendar')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // ============================================
  // OAuth Flow
  // ============================================

  @Get('status')
  @ApiOperation({ summary: 'Get calendar integration status' })
  async getStatus(@CurrentUser('id') userId: string) {
    return this.calendarService.getIntegrationStatus(userId);
  }

  @Get('connect/google')
  @ApiOperation({ summary: 'Get Google OAuth URL' })
  async connectGoogle(@CurrentUser('id') userId: string) {
    const url = this.calendarService.getGoogleAuthUrl(userId);
    return { url };
  }

  @Get('connect/microsoft')
  @ApiOperation({ summary: 'Get Microsoft OAuth URL' })
  async connectMicrosoft(@CurrentUser('id') userId: string) {
    const url = await this.calendarService.getMicrosoftAuthUrl(userId);
    return { url };
  }

  @Public()
  @Get('callback/google')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Res() res: Response
  ) {
    try {
      await this.calendarService.handleGoogleCallback(code, userId);
      // Redirect to success page
      res.redirect('/settings/calendar?connected=google');
    } catch (error) {
      res.redirect(`/settings/calendar?error=${encodeURIComponent(String(error))}`);
    }
  }

  @Public()
  @Get('callback/microsoft')
  @ApiOperation({ summary: 'Microsoft OAuth callback' })
  async microsoftCallback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Res() res: Response
  ) {
    try {
      await this.calendarService.handleMicrosoftCallback(code, userId);
      res.redirect('/settings/calendar?connected=microsoft');
    } catch (error) {
      res.redirect(`/settings/calendar?error=${encodeURIComponent(String(error))}`);
    }
  }

  @Post('disconnect')
  @ApiOperation({ summary: 'Disconnect calendar integration' })
  async disconnect(@CurrentUser('id') userId: string) {
    await this.calendarService.disconnect(userId);
    return { success: true };
  }

  // ============================================
  // Calendar Events
  // ============================================

  @Get('events')
  @ApiOperation({ summary: 'List calendar events' })
  async listEvents(
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('maxResults') maxResults?: number
  ) {
    return this.calendarService.listEvents(userId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      maxResults: maxResults || 50,
    });
  }

  @Post('events')
  @ApiOperation({ summary: 'Create a calendar event' })
  async createEvent(@CurrentUser('id') userId: string, @Body() event: CalendarEvent) {
    const eventId = await this.calendarService.createEvent(userId, event);
    return { id: eventId };
  }

  @Put('events/:id')
  @ApiOperation({ summary: 'Update a calendar event' })
  async updateEvent(
    @CurrentUser('id') userId: string,
    @Param('id') eventId: string,
    @Body() event: Partial<CalendarEvent>
  ) {
    await this.calendarService.updateEvent(userId, eventId, event);
    return { success: true };
  }

  @Delete('events/:id')
  @ApiOperation({ summary: 'Delete a calendar event' })
  async deleteEvent(@CurrentUser('id') userId: string, @Param('id') eventId: string) {
    await this.calendarService.deleteEvent(userId, eventId);
    return { success: true };
  }
}
