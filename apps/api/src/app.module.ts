import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { AIModule } from './modules/ai/ai.module';
import { PatientsModule } from './modules/patients/patients.module';
import { ConsultationsModule } from './modules/consultations/consultations.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { FilesModule } from './modules/files/files.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Scheduling for cron jobs (reminders, etc.)
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,

    // Authentication (global guard)
    AuthModule,

    // Feature modules
    AIModule,
    PatientsModule,
    ConsultationsModule,
    AppointmentsModule,
    TemplatesModule,
    PrescriptionsModule,
    FilesModule,
  ],
})
export class AppModule {}
