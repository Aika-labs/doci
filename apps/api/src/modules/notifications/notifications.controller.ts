import { Controller, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentTenant, TenantContext } from '../../common/decorators';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send-reminder')
  @ApiOperation({ summary: 'Send appointment reminder to a patient' })
  async sendReminder(
    @CurrentTenant() ctx: TenantContext,
    @Body()
    data: {
      patientName: string;
      patientPhone: string;
      doctorName: string;
      appointmentDate: string;
      appointmentTime: string;
      clinicName: string;
      clinicAddress?: string;
    }
  ) {
    const success = await this.notificationsService.sendAppointmentReminder(data);
    return { success };
  }

  @Post('send-text')
  @ApiOperation({ summary: 'Send a text message via WhatsApp' })
  async sendText(
    @CurrentTenant() ctx: TenantContext,
    @Body() data: { to: string; message: string }
  ) {
    const success = await this.notificationsService.sendTextMessage(data.to, data.message);
    return { success };
  }

  @Post('bulk-reminders')
  @ApiOperation({ summary: 'Send bulk reminders for upcoming appointments' })
  async sendBulkReminders(
    @CurrentTenant() ctx: TenantContext,
    @Query('hoursAhead') hoursAhead?: number
  ) {
    const result = await this.notificationsService.sendBulkReminders(hoursAhead || 24);
    return result;
  }
}
