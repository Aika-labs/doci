import { z } from 'zod';

// ============================================
// Validadores Zod para formularios y API
// ============================================

// Enums
export const PlanSchema = z.enum(['BASIC', 'PROFESSIONAL', 'ENTERPRISE']);
export const UserRoleSchema = z.enum(['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']);
export const GenderSchema = z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']);
export const ConsultationStatusSchema = z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export const AppointmentTypeSchema = z.enum([
  'CONSULTATION',
  'FOLLOW_UP',
  'PROCEDURE',
  'TELEMEDICINE',
  'EMERGENCY',
]);
export const AppointmentStatusSchema = z.enum([
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);
export const FileTypeSchema = z.enum([
  'IMAGE',
  'DOCUMENT',
  'LAB_RESULT',
  'IMAGING',
  'PRESCRIPTION',
  'OTHER',
]);

// ============================================
// Pacientes
// ============================================

export const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
});

export const AllergySchema = z.object({
  allergen: z.string().min(1, 'El alérgeno es requerido'),
  severity: z.enum(['mild', 'moderate', 'severe']),
  reaction: z.string().optional(),
});

export const ChronicConditionSchema = z.object({
  condition: z.string().min(1, 'La condición es requerida'),
  diagnosedDate: z.string().optional(),
  notes: z.string().optional(),
});

export const CurrentMedicationSchema = z.object({
  name: z.string().min(1, 'El nombre del medicamento es requerido'),
  dose: z.string().min(1, 'La dosis es requerida'),
  frequency: z.string().min(1, 'La frecuencia es requerida'),
  startDate: z.string().optional(),
});

export const EmergencyContactSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().min(1, 'El teléfono es requerido'),
  relationship: z.string().min(1, 'La relación es requerida'),
});

export const CreatePatientSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').max(100),
  lastName: z.string().min(1, 'El apellido es requerido').max(100),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  gender: GenderSchema.optional(),
  nationalId: z.string().optional(),
  insuranceId: z.string().optional(),
  insuranceCompany: z.string().optional(),
  address: AddressSchema.optional(),
  bloodType: z.string().optional(),
  allergies: z.array(AllergySchema).optional(),
  chronicConditions: z.array(ChronicConditionSchema).optional(),
  currentMedications: z.array(CurrentMedicationSchema).optional(),
  emergencyContact: EmergencyContactSchema.optional(),
  notes: z.string().optional(),
});

export const UpdatePatientSchema = CreatePatientSchema.partial();

// ============================================
// Usuarios
// ============================================

export const CreateUserSchema = z.object({
  email: z.string().email('Email inválido'),
  firstName: z.string().min(1, 'El nombre es requerido').max(100),
  lastName: z.string().min(1, 'El apellido es requerido').max(100),
  role: UserRoleSchema,
  specialty: z.string().optional(),
  licenseNumber: z.string().optional(),
  phone: z.string().optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial();

// ============================================
// Plantillas clínicas
// ============================================

export const TemplateFieldTypeSchema = z.enum([
  'text',
  'textarea',
  'number',
  'select',
  'multiselect',
  'checkbox',
  'date',
  'time',
  'datetime',
  'file',
  'signature',
]);

export const TemplateFieldSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del campo es requerido')
    .regex(/^[a-z_][a-z0-9_]*$/, 'Nombre inválido (use snake_case)'),
  label: z.string().min(1, 'La etiqueta es requerida'),
  type: TemplateFieldTypeSchema,
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  defaultValue: z.unknown().optional(),
  helpText: z.string().optional(),
  section: z.string().optional(),
});

export const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  description: z.string().optional(),
  specialty: z.string().optional(),
  schema: z.array(TemplateFieldSchema).min(1, 'Debe tener al menos un campo'),
  aiPrompt: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const UpdateTemplateSchema = CreateTemplateSchema.partial();

// ============================================
// Citas
// ============================================

export const CreateAppointmentSchema = z.object({
  patientId: z.string().cuid('ID de paciente inválido'),
  userId: z.string().cuid('ID de usuario inválido'),
  startTime: z.string().datetime('Fecha/hora inválida'),
  endTime: z.string().datetime('Fecha/hora inválida'),
  duration: z.number().min(5).max(480).optional(),
  type: AppointmentTypeSchema.optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  isTelemedicine: z.boolean().optional(),
});

export const UpdateAppointmentSchema = CreateAppointmentSchema.partial().extend({
  status: AppointmentStatusSchema.optional(),
  cancelReason: z.string().optional(),
});

// ============================================
// Consultas
// ============================================

export const VitalSignsSchema = z.object({
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  bloodPressure: z
    .object({
      systolic: z.number().positive(),
      diastolic: z.number().positive(),
    })
    .optional(),
  heartRate: z.number().positive().optional(),
  temperature: z.number().optional(),
  oxygenSaturation: z.number().min(0).max(100).optional(),
  respiratoryRate: z.number().positive().optional(),
});

export const SOAPNotesSchema = z.object({
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
});

export const DiagnosisSchema = z.object({
  code: z.string().min(1, 'El código CIE-10 es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  type: z.enum(['primary', 'secondary']),
});

export const CreateConsultationSchema = z.object({
  patientId: z.string().cuid('ID de paciente inválido'),
  templateId: z.string().cuid('ID de plantilla inválido').optional(),
  appointmentId: z.string().cuid('ID de cita inválido').optional(),
  clinicalData: z.record(z.unknown()),
  soapNotes: SOAPNotesSchema.optional(),
  vitalSigns: VitalSignsSchema.optional(),
  diagnoses: z.array(DiagnosisSchema).optional(),
});

export const UpdateConsultationSchema = CreateConsultationSchema.partial().extend({
  status: ConsultationStatusSchema.optional(),
  aiTranscription: z.string().optional(),
  aiSummary: z.string().optional(),
});

// ============================================
// Recetas
// ============================================

export const PrescriptionMedicationSchema = z.object({
  name: z.string().min(1, 'El nombre del medicamento es requerido'),
  dose: z.string().min(1, 'La dosis es requerida'),
  frequency: z.string().min(1, 'La frecuencia es requerida'),
  duration: z.string().optional(),
  instructions: z.string().optional(),
  quantity: z.number().positive().optional(),
});

export const CreatePrescriptionSchema = z.object({
  consultationId: z.string().cuid('ID de consulta inválido'),
  medications: z.array(PrescriptionMedicationSchema).min(1, 'Debe incluir al menos un medicamento'),
  instructions: z.string().optional(),
  diagnosis: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

// ============================================
// IA / Transcripción
// ============================================

export const TranscriptionRequestSchema = z.object({
  language: z.enum(['es', 'en']).optional().default('es'),
  patientId: z.string().cuid().optional(),
});

export const StructuredNoteRequestSchema = z.object({
  transcription: z.string().min(1, 'La transcripción es requerida'),
  patientId: z.string().cuid('ID de paciente inválido'),
  templateId: z.string().cuid().optional(),
  includeHistory: z.boolean().optional().default(true),
});

// ============================================
// Paginación
// ============================================

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const SearchSchema = PaginationSchema.extend({
  q: z.string().optional(),
});

// ============================================
// Type exports
// ============================================

export type CreatePatient = z.infer<typeof CreatePatientSchema>;
export type UpdatePatient = z.infer<typeof UpdatePatientSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type CreateTemplate = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplate = z.infer<typeof UpdateTemplateSchema>;
export type CreateAppointment = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointment = z.infer<typeof UpdateAppointmentSchema>;
export type CreateConsultation = z.infer<typeof CreateConsultationSchema>;
export type UpdateConsultation = z.infer<typeof UpdateConsultationSchema>;
export type CreatePrescription = z.infer<typeof CreatePrescriptionSchema>;
export type TranscriptionRequest = z.infer<typeof TranscriptionRequestSchema>;
export type StructuredNoteRequest = z.infer<typeof StructuredNoteRequestSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type Search = z.infer<typeof SearchSchema>;
