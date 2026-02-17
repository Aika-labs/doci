import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { AIModule } from './modules/ai/ai.module';
import { PatientsModule } from './modules/patients/patients.module';
import { ConsultationsModule } from './modules/consultations/consultations.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { StorageModule } from './modules/storage/storage.module';
import { FilesModule } from './modules/files/files.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { VademecumModule } from './modules/vademecum/vademecum.module';
import { AuditModule } from './modules/audit/audit.module';
import { BackupModule } from './modules/backup/backup.module';
import { BillingModule } from './modules/billing/billing.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { SearchModule } from './modules/search/search.module';
import { SpecialtyTemplatesModule } from './modules/specialty-templates/specialty-templates.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Sentry error tracking (must be first)
    SentryModule.forRoot(),

    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting: 60 requests per 60 seconds per IP
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 60,
        },
      ],
    }),

    // Scheduling for cron jobs (reminders, etc.)
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,

    // Authentication (global guard)
    AuthModule,

    // Health check
    HealthModule,

    // Feature modules
    AIModule,
    PatientsModule,
    ConsultationsModule,
    AppointmentsModule,
    TemplatesModule,
    PrescriptionsModule,
    StorageModule,
    FilesModule,
    NotificationsModule,
    VademecumModule,
    AuditModule,
    BackupModule,
    BillingModule,
    CalendarModule,
    OnboardingModule,
    SearchModule,
    SpecialtyTemplatesModule,
    SubscriptionsModule,
  ],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
