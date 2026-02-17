import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { ConfidentialClientApplication } from '@azure/msal-node';

// ============================================
// Types
// ============================================

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  reminders?: { method: string; minutes: number }[];
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

// ============================================
// Service
// ============================================

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly googleOAuth2Client: OAuth2Client;
  private readonly msalClient: ConfidentialClientApplication;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    // Initialize Google OAuth client
    this.googleOAuth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI')
    );

    // Initialize Microsoft MSAL client
    this.msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: this.configService.get<string>('MICROSOFT_CLIENT_ID') || '',
        clientSecret: this.configService.get<string>('MICROSOFT_CLIENT_SECRET'),
        authority: `https://login.microsoftonline.com/${this.configService.get<string>('MICROSOFT_TENANT_ID') || 'common'}`,
      },
    });
  }

  // ============================================
  // OAuth Flow
  // ============================================

  /**
   * Get Google OAuth authorization URL
   */
  getGoogleAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.googleOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId, // Pass userId to callback
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  /**
   * Get Microsoft OAuth authorization URL
   */
  async getMicrosoftAuthUrl(userId: string): Promise<string> {
    const authUrl = await this.msalClient.getAuthCodeUrl({
      scopes: ['Calendars.ReadWrite', 'offline_access'],
      redirectUri: this.configService.get<string>('MICROSOFT_REDIRECT_URI') || '',
      state: userId,
    });

    return authUrl;
  }

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(code: string, userId: string): Promise<void> {
    const { tokens } = await this.googleOAuth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new BadRequestException('Failed to get access token from Google');
    }

    // Store tokens
    await this.prisma.calendarIntegration.upsert({
      where: { userId },
      create: {
        userId,
        provider: 'GOOGLE',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    });

    this.logger.log(`Google Calendar connected for user ${userId}`);
  }

  /**
   * Handle Microsoft OAuth callback
   */
  async handleMicrosoftCallback(code: string, userId: string): Promise<void> {
    const result = await this.msalClient.acquireTokenByCode({
      code,
      scopes: ['Calendars.ReadWrite', 'offline_access'],
      redirectUri: this.configService.get<string>('MICROSOFT_REDIRECT_URI') || '',
    });

    if (!result?.accessToken) {
      throw new BadRequestException('Failed to get access token from Microsoft');
    }

    // Store tokens
    await this.prisma.calendarIntegration.upsert({
      where: { userId },
      create: {
        userId,
        provider: 'OUTLOOK',
        accessToken: result.accessToken,
        tokenExpiry: result.expiresOn || undefined,
      },
      update: {
        accessToken: result.accessToken,
        tokenExpiry: result.expiresOn || undefined,
      },
    });

    this.logger.log(`Outlook Calendar connected for user ${userId}`);
  }

  /**
   * Disconnect calendar integration
   */
  async disconnect(userId: string): Promise<void> {
    await this.prisma.calendarIntegration.delete({
      where: { userId },
    });

    this.logger.log(`Calendar disconnected for user ${userId}`);
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(userId: string) {
    const integration = await this.prisma.calendarIntegration.findUnique({
      where: { userId },
    });

    if (!integration) {
      return { connected: false };
    }

    return {
      connected: true,
      provider: integration.provider,
      syncEnabled: integration.syncEnabled,
      lastSyncAt: integration.lastSyncAt,
    };
  }

  // ============================================
  // Calendar Operations
  // ============================================

  /**
   * Create a calendar event
   */
  async createEvent(userId: string, event: CalendarEvent): Promise<string> {
    const integration = await this.getIntegration(userId);

    if (integration.provider === 'GOOGLE') {
      return this.createGoogleEvent(integration.accessToken, event);
    } else {
      return this.createOutlookEvent(integration.accessToken, event);
    }
  }

  /**
   * Update a calendar event
   */
  async updateEvent(userId: string, eventId: string, event: Partial<CalendarEvent>): Promise<void> {
    const integration = await this.getIntegration(userId);

    if (integration.provider === 'GOOGLE') {
      await this.updateGoogleEvent(integration.accessToken, eventId, event);
    } else {
      await this.updateOutlookEvent(integration.accessToken, eventId, event);
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(userId: string, eventId: string): Promise<void> {
    const integration = await this.getIntegration(userId);

    if (integration.provider === 'GOOGLE') {
      await this.deleteGoogleEvent(integration.accessToken, eventId);
    } else {
      await this.deleteOutlookEvent(integration.accessToken, eventId);
    }
  }

  /**
   * List calendar events
   */
  async listEvents(
    userId: string,
    options?: { startDate?: Date; endDate?: Date; maxResults?: number }
  ): Promise<CalendarEvent[]> {
    const integration = await this.getIntegration(userId);

    if (integration.provider === 'GOOGLE') {
      return this.listGoogleEvents(integration.accessToken, options);
    } else {
      return this.listOutlookEvents(integration.accessToken, options);
    }
  }

  /**
   * Sync appointment to calendar
   */
  async syncAppointment(
    userId: string,
    appointment: {
      id: string;
      patientName: string;
      startTime: Date;
      endTime: Date;
      notes?: string;
    }
  ): Promise<string | null> {
    const integration = await this.prisma.calendarIntegration.findUnique({
      where: { userId },
    });

    if (!integration || !integration.syncEnabled) {
      return null;
    }

    const event: CalendarEvent = {
      title: `Cita: ${appointment.patientName}`,
      description: appointment.notes,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      reminders: [
        { method: 'popup', minutes: 30 },
        { method: 'email', minutes: 60 },
      ],
    };

    return this.createEvent(userId, event);
  }

  // ============================================
  // Google Calendar Implementation
  // ============================================

  private async createGoogleEvent(accessToken: string, event: CalendarEvent): Promise<string> {
    this.googleOAuth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: this.googleOAuth2Client });

    const googleEvent: calendar_v3.Schema$Event = {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: 'America/Mexico_City',
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: 'America/Mexico_City',
      },
      attendees: event.attendees?.map((email) => ({ email })),
      reminders: {
        useDefault: false,
        overrides: event.reminders?.map((r) => ({
          method: r.method,
          minutes: r.minutes,
        })),
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: googleEvent,
    });

    return response.data.id || '';
  }

  private async updateGoogleEvent(
    accessToken: string,
    eventId: string,
    event: Partial<CalendarEvent>
  ): Promise<void> {
    this.googleOAuth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: this.googleOAuth2Client });

    const updateData: calendar_v3.Schema$Event = {};

    if (event.title) updateData.summary = event.title;
    if (event.description) updateData.description = event.description;
    if (event.location) updateData.location = event.location;
    if (event.startTime) {
      updateData.start = {
        dateTime: event.startTime.toISOString(),
        timeZone: 'America/Mexico_City',
      };
    }
    if (event.endTime) {
      updateData.end = {
        dateTime: event.endTime.toISOString(),
        timeZone: 'America/Mexico_City',
      };
    }

    await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: updateData,
    });
  }

  private async deleteGoogleEvent(accessToken: string, eventId: string): Promise<void> {
    this.googleOAuth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: this.googleOAuth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
  }

  private async listGoogleEvents(
    accessToken: string,
    options?: { startDate?: Date; endDate?: Date; maxResults?: number }
  ): Promise<CalendarEvent[]> {
    this.googleOAuth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: this.googleOAuth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: options?.startDate?.toISOString() || new Date().toISOString(),
      timeMax: options?.endDate?.toISOString(),
      maxResults: options?.maxResults || 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return (response.data.items || []).map((item) => ({
      id: item.id || undefined,
      title: item.summary || '',
      description: item.description || undefined,
      startTime: new Date(item.start?.dateTime || item.start?.date || ''),
      endTime: new Date(item.end?.dateTime || item.end?.date || ''),
      location: item.location || undefined,
      attendees: item.attendees?.map((a) => a.email || '').filter(Boolean),
    }));
  }

  // ============================================
  // Outlook Calendar Implementation
  // ============================================

  private async createOutlookEvent(accessToken: string, event: CalendarEvent): Promise<string> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: event.title,
        body: {
          contentType: 'Text',
          content: event.description || '',
        },
        start: {
          dateTime: event.startTime.toISOString(),
          timeZone: 'America/Mexico_City',
        },
        end: {
          dateTime: event.endTime.toISOString(),
          timeZone: 'America/Mexico_City',
        },
        location: event.location ? { displayName: event.location } : undefined,
        attendees: event.attendees?.map((email) => ({
          emailAddress: { address: email },
          type: 'required',
        })),
      }),
    });

    if (!response.ok) {
      throw new BadRequestException('Failed to create Outlook event');
    }

    const data = await response.json();
    return data.id;
  }

  private async updateOutlookEvent(
    accessToken: string,
    eventId: string,
    event: Partial<CalendarEvent>
  ): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (event.title) updateData.subject = event.title;
    if (event.description) {
      updateData.body = { contentType: 'Text', content: event.description };
    }
    if (event.startTime) {
      updateData.start = {
        dateTime: event.startTime.toISOString(),
        timeZone: 'America/Mexico_City',
      };
    }
    if (event.endTime) {
      updateData.end = {
        dateTime: event.endTime.toISOString(),
        timeZone: 'America/Mexico_City',
      };
    }
    if (event.location) {
      updateData.location = { displayName: event.location };
    }

    const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new BadRequestException('Failed to update Outlook event');
    }
  }

  private async deleteOutlookEvent(accessToken: string, eventId: string): Promise<void> {
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new BadRequestException('Failed to delete Outlook event');
    }
  }

  private async listOutlookEvents(
    _accessToken: string,
    options?: { startDate?: Date; endDate?: Date; maxResults?: number }
  ): Promise<CalendarEvent[]> {
    const startDate = options?.startDate || new Date();
    const endDate = options?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${startDate.toISOString()}&endDateTime=${endDate.toISOString()}&$top=${options?.maxResults || 50}`,
      {
        headers: {
          Authorization: `Bearer ${_accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new BadRequestException('Failed to list Outlook events');
    }

    const data = await response.json();

    return (data.value || []).map(
      (item: {
        id: string;
        subject: string;
        bodyPreview: string;
        start: { dateTime: string };
        end: { dateTime: string };
        location: { displayName: string };
        attendees: Array<{ emailAddress: { address: string } }>;
      }) => ({
        id: item.id,
        title: item.subject || '',
        description: item.bodyPreview || undefined,
        startTime: new Date(item.start?.dateTime || ''),
        endTime: new Date(item.end?.dateTime || ''),
        location: item.location?.displayName || undefined,
        attendees: item.attendees?.map((a) => a.emailAddress?.address).filter(Boolean),
      })
    );
  }

  // ============================================
  // Private helpers
  // ============================================

  private async getIntegration(userId: string) {
    const integration = await this.prisma.calendarIntegration.findUnique({
      where: { userId },
    });

    if (!integration) {
      throw new NotFoundException('Calendar not connected');
    }

    // Check if token is expired and needs refresh
    if (integration.tokenExpiry && integration.tokenExpiry < new Date()) {
      if (integration.provider === 'GOOGLE' && integration.refreshToken) {
        await this.refreshGoogleToken(userId, integration.refreshToken);
        // Re-fetch updated integration
        return this.prisma.calendarIntegration.findUniqueOrThrow({
          where: { userId },
        });
      }
      throw new BadRequestException('Calendar token expired. Please reconnect.');
    }

    return integration;
  }

  private async refreshGoogleToken(userId: string, refreshToken: string): Promise<void> {
    this.googleOAuth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.googleOAuth2Client.refreshAccessToken();

    await this.prisma.calendarIntegration.update({
      where: { userId },
      data: {
        accessToken: credentials.access_token || '',
        tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
      },
    });
  }
}
