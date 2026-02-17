import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface AppointmentReminder {
  patientName: string;
  patientPhone: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  clinicName: string;
  clinicAddress?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly whatsappApiUrl: string;
  private readonly whatsappToken: string;
  private readonly whatsappPhoneId: string;
  private readonly enabled: boolean;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    this.whatsappApiUrl = 'https://graph.facebook.com/v18.0';
    this.whatsappToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN') || '';
    this.whatsappPhoneId = this.configService.get<string>('WHATSAPP_PHONE_ID') || '';
    this.enabled = Boolean(this.whatsappToken && this.whatsappPhoneId);

    if (!this.enabled) {
      this.logger.warn(
        'WhatsApp notifications disabled: missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_ID'
      );
    }
  }

  /**
   * Send appointment reminder via WhatsApp
   */
  async sendAppointmentReminder(data: AppointmentReminder): Promise<boolean> {
    if (!this.enabled) {
      this.logger.log(
        `[MOCK] Would send reminder to ${data.patientPhone}: ${data.patientName} - ${data.appointmentDate} ${data.appointmentTime}`
      );
      return true;
    }

    const formattedPhone = this.formatPhoneNumber(data.patientPhone);
    if (!formattedPhone) {
      this.logger.warn(`Invalid phone number: ${data.patientPhone}`);
      return false;
    }

    try {
      // Using WhatsApp Business API template message
      const response = await fetch(`${this.whatsappApiUrl}/${this.whatsappPhoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: 'appointment_reminder',
            language: { code: 'es_MX' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: data.patientName },
                  { type: 'text', text: data.appointmentDate },
                  { type: 'text', text: data.appointmentTime },
                  { type: 'text', text: data.doctorName },
                  { type: 'text', text: data.clinicName },
                ],
              },
            ],
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error(`WhatsApp API error: ${JSON.stringify(error)}`);
        return false;
      }

      this.logger.log(`Reminder sent to ${formattedPhone}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message: ${error}`);
      return false;
    }
  }

  /**
   * Send a simple text message via WhatsApp (for testing)
   */
  async sendTextMessage(to: string, message: string): Promise<boolean> {
    if (!this.enabled) {
      this.logger.log(`[MOCK] Would send message to ${to}: ${message}`);
      return true;
    }

    const formattedPhone = this.formatPhoneNumber(to);
    if (!formattedPhone) {
      this.logger.warn(`Invalid phone number: ${to}`);
      return false;
    }

    try {
      const response = await fetch(`${this.whatsappApiUrl}/${this.whatsappPhoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { body: message },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error(`WhatsApp API error: ${JSON.stringify(error)}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message: ${error}`);
      return false;
    }
  }

  /**
   * Send bulk appointment reminders for upcoming appointments
   */
  async sendBulkReminders(hoursAhead: number = 24): Promise<{ sent: number; failed: number }> {
    const now = new Date();
    const targetTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    // Find appointments in the next X hours that haven't had reminders sent
    const appointments = await this.prisma.appointment.findMany({
      where: {
        startTime: {
          gte: now,
          lte: targetTime,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
        reminderSentAt: null,
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        tenant: {
          select: {
            name: true,
            settings: true,
          },
        },
      },
    });

    let sent = 0;
    let failed = 0;

    for (const appointment of appointments) {
      if (!appointment.patient.phone) {
        this.logger.warn(
          `No phone number for patient ${appointment.patient.firstName} ${appointment.patient.lastName}`
        );
        failed++;
        continue;
      }

      const settings = appointment.tenant.settings as Record<string, unknown> | null;
      const success = await this.sendAppointmentReminder({
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        patientPhone: appointment.patient.phone,
        doctorName: `${appointment.user.firstName} ${appointment.user.lastName}`,
        appointmentDate: appointment.startTime.toLocaleDateString('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        appointmentTime: appointment.startTime.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        clinicName: appointment.tenant.name,
        clinicAddress: settings?.address as string | undefined,
      });

      if (success) {
        // Mark reminder as sent
        await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: { reminderSentAt: new Date() },
        });
        sent++;
      } else {
        failed++;
      }
    }

    this.logger.log(`Bulk reminders: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Format phone number to international format for WhatsApp
   * Assumes Mexican numbers if no country code
   */
  private formatPhoneNumber(phone: string): string | null {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length < 10) {
      return null;
    }

    // If starts with country code (52 for Mexico), use as is
    if (cleaned.startsWith('52') && cleaned.length >= 12) {
      return cleaned;
    }

    // If 10 digits, assume Mexican number and add country code
    if (cleaned.length === 10) {
      return `52${cleaned}`;
    }

    // If starts with 1 (US/Canada), use as is
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      return cleaned;
    }

    // Return as is if already has country code
    if (cleaned.length >= 11) {
      return cleaned;
    }

    return null;
  }
}
