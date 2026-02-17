// ============================================
// Tipos compartidos entre frontend y backend
// ============================================

// Enums (deben coincidir con Prisma schema)
export type Plan = 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
export type UserRole = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type ConsultationStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type AppointmentType =
  | 'CONSULTATION'
  | 'FOLLOW_UP'
  | 'PROCEDURE'
  | 'TELEMEDICINE'
  | 'EMERGENCY';
export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';
export type FileType = 'IMAGE' | 'DOCUMENT' | 'LAB_RESULT' | 'IMAGING' | 'PRESCRIPTION' | 'OTHER';

// ============================================
// Tipos para JSONB fields
// ============================================

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface Allergy {
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction?: string;
}

export interface ChronicCondition {
  condition: string;
  diagnosedDate?: string;
  notes?: string;
}

export interface CurrentMedication {
  name: string;
  dose: string;
  frequency: string;
  startDate?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface TenantBranding {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  favicon?: string;
}

export interface TenantSettings {
  timezone?: string;
  language?: string;
  currency?: string;
  appointmentDuration?: number;
  workingHours?: {
    start: string;
    end: string;
    days: number[];
  };
}

// ============================================
// Tipos para plantillas clínicas dinámicas
// ============================================

export type TemplateFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file'
  | 'signature';

export interface TemplateField {
  name: string;
  label: string;
  type: TemplateFieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[]; // Para select/multiselect
  min?: number;
  max?: number;
  defaultValue?: unknown;
  helpText?: string;
  section?: string; // Para agrupar campos
}

export type TemplateSchema = TemplateField[];

// ============================================
// Tipos para notas SOAP
// ============================================

export interface SOAPNotes {
  subjective?: string; // Lo que el paciente reporta
  objective?: string; // Hallazgos del examen
  assessment?: string; // Diagnóstico/evaluación
  plan?: string; // Plan de tratamiento
}

// ============================================
// Tipos para signos vitales
// ============================================

export interface VitalSigns {
  weight?: number; // kg
  height?: number; // cm
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number; // bpm
  temperature?: number; // °C
  oxygenSaturation?: number; // %
  respiratoryRate?: number; // rpm
}

// ============================================
// Tipos para diagnósticos CIE-10
// ============================================

export interface Diagnosis {
  code: string; // Código CIE-10
  description: string;
  type: 'primary' | 'secondary';
}

// ============================================
// Tipos para medicamentos en recetas
// ============================================

export interface PrescriptionMedication {
  name: string;
  dose: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  quantity?: number;
}

// ============================================
// Tipos para IA
// ============================================

export interface AIPreferences {
  language?: 'es' | 'en';
  voiceSpeed?: number;
  autoSuggest?: boolean;
  autoTranscribe?: boolean;
}

export interface AISuggestion {
  type: 'diagnosis' | 'medication' | 'procedure' | 'warning';
  content: string;
  confidence: number; // 0-1
  metadata?: Record<string, unknown>;
}

export interface AIAnalysis {
  summary?: string;
  findings?: string[];
  confidence?: number;
}

// ============================================
// Tipos para protocolos de tratamiento
// ============================================

export interface TreatmentProtocolConfig {
  totalSessions: number;
  intervalDays: number;
  services: {
    name: string;
    price: number;
  }[];
  autoSchedule: boolean;
}

// ============================================
// API Response types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Tipos para transcripción de voz
// ============================================

export interface TranscriptionRequest {
  audioBlob: Blob;
  language?: 'es' | 'en';
  patientId?: string; // Para contexto
}

export interface TranscriptionResponse {
  text: string;
  confidence: number;
  duration: number; // segundos
  language: string;
}

export interface StructuredNoteRequest {
  transcription: string;
  patientId: string;
  templateId?: string;
  includeHistory?: boolean;
}

export interface StructuredNoteResponse {
  soapNotes: SOAPNotes;
  suggestedDiagnoses: Diagnosis[];
  suggestions: AISuggestion[];
  extractedVitals?: Partial<VitalSigns>;
}
