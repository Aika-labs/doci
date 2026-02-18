/**
 * Comprehensive mock data for the Doci EHR dashboard.
 *
 * Used as a fallback when the backend API is unreachable so every feature
 * is visible in demo / landing-only mode.  All data uses Venezuelan medical
 * context: names, cities, cédulas, Bs/USD pricing, MPPS references, etc.
 */

import type {
  Patient,
  PatientsResponse,
  Appointment,
  AppointmentsResponse,
  Prescription,
  MedicationItem,
  Service,
  Invoice,
  InvoiceItem,
  Payment,
  InvoicesResponse,
  ServicesResponse,
  FinancialSummary,
  UserProfile,
  TenantSettings,
} from './api';

/* ========================================================================== */
/*  Helpers                                                                    */
/* ========================================================================== */

const TENANT_ID = 'tenant-demo-001';
const USER_ID = 'user-demo-001';

/** Return an ISO string for today at the given hour:minute. */
function todayAt(hour: number, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Return an ISO string for N days ago at the given hour. */
function daysAgo(days: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/** Return an ISO string for N days from now at the given hour. */
function daysFromNow(days: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/* ========================================================================== */
/*  Patients                                                                   */
/* ========================================================================== */

export const mockPatients: Patient[] = [
  {
    id: 'pat-001',
    tenantId: TENANT_ID,
    firstName: 'María',
    lastName: 'González Pérez',
    email: 'maria.gonzalez@gmail.com',
    phone: '+58 412-555-0101',
    dateOfBirth: '1985-03-15',
    gender: 'FEMALE',
    bloodType: 'O+',
    allergies: ['Penicilina', 'Ibuprofeno'],
    medicalHistory: { hipertension: true, diabetes: false },
    currentMedications: ['Losartán 50mg', 'Atorvastatina 20mg'],
    emergencyContact: { name: 'Carlos González', phone: '+58 412-555-0102', relation: 'Esposo' },
    insuranceInfo: { provider: 'Seguros Caracas', policyNumber: 'SC-2024-78901' },
    address: 'Av. Libertador, Edif. Torre Capriles, Piso 8',
    city: 'Caracas',
    state: 'Distrito Capital',
    country: 'Venezuela',
    postalCode: '1010',
    notes: 'Paciente con hipertensión controlada. Control trimestral.',
    isActive: true,
    createdAt: daysAgo(180),
    updatedAt: daysAgo(5),
  },
  {
    id: 'pat-002',
    tenantId: TENANT_ID,
    firstName: 'José',
    lastName: 'Rodríguez Martínez',
    email: 'jose.rodriguez@hotmail.com',
    phone: '+58 414-555-0201',
    dateOfBirth: '1972-08-22',
    gender: 'MALE',
    bloodType: 'A+',
    allergies: [],
    medicalHistory: { diabetes_tipo2: true, hipertension: true },
    currentMedications: ['Metformina 850mg', 'Enalapril 10mg', 'Aspirina 100mg'],
    emergencyContact: { name: 'Ana Martínez', phone: '+58 414-555-0202', relation: 'Esposa' },
    insuranceInfo: { provider: 'Seguros Mercantil', policyNumber: 'SM-2024-45678' },
    address: 'Calle 5, Qta. Los Pinos, Altamira',
    city: 'Caracas',
    state: 'Distrito Capital',
    country: 'Venezuela',
    postalCode: '1060',
    notes: 'Diabético tipo 2. HbA1c último: 7.2%. Próximo control en 3 meses.',
    isActive: true,
    createdAt: daysAgo(365),
    updatedAt: daysAgo(2),
  },
  {
    id: 'pat-003',
    tenantId: TENANT_ID,
    firstName: 'Valentina',
    lastName: 'López Hernández',
    email: 'valentina.lopez@gmail.com',
    phone: '+58 424-555-0301',
    dateOfBirth: '1995-11-08',
    gender: 'FEMALE',
    bloodType: 'B+',
    allergies: ['Sulfonamidas'],
    medicalHistory: { asma: true },
    currentMedications: ['Salbutamol inhalador PRN'],
    emergencyContact: {
      name: 'Pedro López',
      phone: '+58 424-555-0302',
      relation: 'Padre',
    },
    insuranceInfo: null,
    address: 'Urb. El Cafetal, Res. Monte Verde, Apto 4-B',
    city: 'Caracas',
    state: 'Miranda',
    country: 'Venezuela',
    postalCode: '1080',
    notes: 'Asma leve intermitente. Buena adherencia al tratamiento.',
    isActive: true,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(10),
  },
  {
    id: 'pat-004',
    tenantId: TENANT_ID,
    firstName: 'Carlos',
    lastName: 'Mendoza Rivas',
    email: 'carlos.mendoza@yahoo.com',
    phone: '+58 416-555-0401',
    dateOfBirth: '1960-01-30',
    gender: 'MALE',
    bloodType: 'AB+',
    allergies: ['Mariscos', 'Contraste yodado'],
    medicalHistory: { cardiopatia_isquemica: true, hipercolesterolemia: true },
    currentMedications: ['Clopidogrel 75mg', 'Atorvastatina 40mg', 'Bisoprolol 5mg'],
    emergencyContact: {
      name: 'Luisa Rivas',
      phone: '+58 416-555-0402',
      relation: 'Hija',
    },
    insuranceInfo: { provider: 'Seguros La Previsora', policyNumber: 'LP-2024-12345' },
    address: 'Av. Principal de Las Mercedes, Centro Comercial Paseo',
    city: 'Caracas',
    state: 'Distrito Capital',
    country: 'Venezuela',
    postalCode: '1060',
    notes: 'Post-IAM 2023. Stent en DA. Control cardiológico cada 2 meses.',
    isActive: true,
    createdAt: daysAgo(400),
    updatedAt: daysAgo(1),
  },
  {
    id: 'pat-005',
    tenantId: TENANT_ID,
    firstName: 'Ana',
    lastName: 'Ramírez Torres',
    email: 'ana.ramirez@gmail.com',
    phone: '+58 412-555-0501',
    dateOfBirth: '1990-06-12',
    gender: 'FEMALE',
    bloodType: 'O-',
    allergies: [],
    medicalHistory: { hipotiroidismo: true },
    currentMedications: ['Levotiroxina 75mcg'],
    emergencyContact: {
      name: 'Miguel Torres',
      phone: '+58 412-555-0502',
      relation: 'Hermano',
    },
    insuranceInfo: { provider: 'Seguros Caracas', policyNumber: 'SC-2024-33456' },
    address: 'Calle Bolívar, Casa 12, El Hatillo',
    city: 'Caracas',
    state: 'Miranda',
    country: 'Venezuela',
    postalCode: '1083',
    notes: 'Hipotiroidismo controlado. TSH último: 2.8 mUI/L.',
    isActive: true,
    createdAt: daysAgo(150),
    updatedAt: daysAgo(15),
  },
  {
    id: 'pat-006',
    tenantId: TENANT_ID,
    firstName: 'Luis',
    lastName: 'Fernández Díaz',
    email: 'luis.fernandez@outlook.com',
    phone: '+58 426-555-0601',
    dateOfBirth: '1988-09-25',
    gender: 'MALE',
    bloodType: 'A-',
    allergies: ['Látex'],
    medicalHistory: { migraña_cronica: true },
    currentMedications: ['Topiramato 50mg', 'Sumatriptán 50mg PRN'],
    emergencyContact: {
      name: 'Carmen Díaz',
      phone: '+58 426-555-0602',
      relation: 'Madre',
    },
    insuranceInfo: null,
    address: 'Av. Urdaneta, Edif. Galipán, Piso 3',
    city: 'Caracas',
    state: 'Distrito Capital',
    country: 'Venezuela',
    postalCode: '1010',
    notes: 'Migraña crónica con aura. Frecuencia: 4-5 episodios/mes.',
    isActive: true,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(8),
  },
  {
    id: 'pat-007',
    tenantId: TENANT_ID,
    firstName: 'Isabella',
    lastName: 'Morales Gutiérrez',
    email: 'isabella.morales@gmail.com',
    phone: '+58 414-555-0701',
    dateOfBirth: '2000-04-18',
    gender: 'FEMALE',
    bloodType: 'B-',
    allergies: [],
    medicalHistory: {},
    currentMedications: [],
    emergencyContact: {
      name: 'Rosa Gutiérrez',
      phone: '+58 414-555-0702',
      relation: 'Madre',
    },
    insuranceInfo: { provider: 'Seguros Horizonte', policyNumber: 'SH-2024-67890' },
    address: 'Urb. Santa Fe, Calle 3, Casa 8',
    city: 'Barquisimeto',
    state: 'Lara',
    country: 'Venezuela',
    postalCode: '3001',
    notes: 'Paciente joven, sin antecedentes patológicos relevantes.',
    isActive: true,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
  },
  {
    id: 'pat-008',
    tenantId: TENANT_ID,
    firstName: 'Roberto',
    lastName: 'Castillo Vargas',
    email: 'roberto.castillo@gmail.com',
    phone: '+58 424-555-0801',
    dateOfBirth: '1978-12-03',
    gender: 'MALE',
    bloodType: 'O+',
    allergies: ['AINEs'],
    medicalHistory: { gastritis_cronica: true, hernia_hiatal: true },
    currentMedications: ['Omeprazol 20mg', 'Sucralfato 1g'],
    emergencyContact: {
      name: 'Patricia Vargas',
      phone: '+58 424-555-0802',
      relation: 'Esposa',
    },
    insuranceInfo: { provider: 'Seguros Mercantil', policyNumber: 'SM-2024-99012' },
    address: 'Av. Francisco de Miranda, Torre Parque Cristal',
    city: 'Caracas',
    state: 'Distrito Capital',
    country: 'Venezuela',
    postalCode: '1060',
    notes: 'Gastritis crónica. Endoscopia anual. Última: hace 8 meses.',
    isActive: true,
    createdAt: daysAgo(200),
    updatedAt: daysAgo(3),
  },
  {
    id: 'pat-009',
    tenantId: TENANT_ID,
    firstName: 'Gabriela',
    lastName: 'Herrera Blanco',
    email: 'gabriela.herrera@gmail.com',
    phone: '+58 412-555-0901',
    dateOfBirth: '1992-07-20',
    gender: 'FEMALE',
    bloodType: 'A+',
    allergies: [],
    medicalHistory: { ansiedad_generalizada: true },
    currentMedications: ['Sertralina 50mg'],
    emergencyContact: {
      name: 'Diego Herrera',
      phone: '+58 412-555-0902',
      relation: 'Esposo',
    },
    insuranceInfo: null,
    address: 'Calle Los Mangos, Res. Bello Monte, Apto 2-A',
    city: 'Valencia',
    state: 'Carabobo',
    country: 'Venezuela',
    postalCode: '2001',
    notes: 'TAG en tratamiento. Buena evolución con ISRS.',
    isActive: true,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(20),
  },
  {
    id: 'pat-010',
    tenantId: TENANT_ID,
    firstName: 'Andrés',
    lastName: 'Paredes Soto',
    email: 'andres.paredes@hotmail.com',
    phone: '+58 416-555-1001',
    dateOfBirth: '1965-02-14',
    gender: 'MALE',
    bloodType: 'AB-',
    allergies: ['Cefalosporinas'],
    medicalHistory: { epoc: true, tabaquismo: true },
    currentMedications: ['Tiotropio 18mcg', 'Salbutamol inhalador PRN', 'Fluticasona 250mcg'],
    emergencyContact: {
      name: 'Marta Soto',
      phone: '+58 416-555-1002',
      relation: 'Esposa',
    },
    insuranceInfo: { provider: 'Seguros La Previsora', policyNumber: 'LP-2024-55678' },
    address: 'Av. Bolívar Norte, Edif. Camoruco, Piso 5',
    city: 'Valencia',
    state: 'Carabobo',
    country: 'Venezuela',
    postalCode: '2001',
    notes: 'EPOC moderado. Ex-fumador (dejó hace 2 años). Espirometría cada 6 meses.',
    isActive: true,
    createdAt: daysAgo(300),
    updatedAt: daysAgo(7),
  },
];

export function getMockPatientsResponse(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): PatientsResponse {
  let filtered = [...mockPatients];
  if (params?.search) {
    const s = params.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.firstName.toLowerCase().includes(s) ||
        p.lastName.toLowerCase().includes(s) ||
        p.email?.toLowerCase().includes(s)
    );
  }
  const page = params?.page || 1;
  const limit = params?.limit || 12;
  const start = (page - 1) * limit;
  return {
    data: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    limit,
  };
}

/* ========================================================================== */
/*  Appointments                                                               */
/* ========================================================================== */

export const mockAppointments: Appointment[] = [
  // Today's appointments
  {
    id: 'apt-001',
    tenantId: TENANT_ID,
    patientId: 'pat-001',
    userId: USER_ID,
    patient: mockPatients[0],
    scheduledAt: todayAt(8, 0),
    duration: 30,
    type: 'FOLLOW_UP',
    status: 'COMPLETED',
    reason: 'Control de hipertensión',
    notes: 'PA: 130/85. Ajustar dosis.',
    reminderSent: true,
    createdAt: daysAgo(7),
    updatedAt: todayAt(8, 30),
  },
  {
    id: 'apt-002',
    tenantId: TENANT_ID,
    patientId: 'pat-002',
    userId: USER_ID,
    patient: mockPatients[1],
    scheduledAt: todayAt(9, 0),
    duration: 45,
    type: 'FOLLOW_UP',
    status: 'COMPLETED',
    reason: 'Control de diabetes',
    notes: 'Glicemia en ayunas: 126 mg/dL',
    reminderSent: true,
    createdAt: daysAgo(5),
    updatedAt: todayAt(9, 45),
  },
  {
    id: 'apt-003',
    tenantId: TENANT_ID,
    patientId: 'pat-003',
    userId: USER_ID,
    patient: mockPatients[2],
    scheduledAt: todayAt(10, 0),
    duration: 30,
    type: 'ROUTINE',
    status: 'IN_PROGRESS',
    reason: 'Chequeo general',
    notes: null,
    reminderSent: true,
    createdAt: daysAgo(3),
    updatedAt: todayAt(10, 0),
  },
  {
    id: 'apt-004',
    tenantId: TENANT_ID,
    patientId: 'pat-004',
    userId: USER_ID,
    patient: mockPatients[3],
    scheduledAt: todayAt(11, 0),
    duration: 30,
    type: 'FOLLOW_UP',
    status: 'CONFIRMED',
    reason: 'Control post-stent',
    notes: null,
    reminderSent: true,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(1),
  },
  {
    id: 'apt-005',
    tenantId: TENANT_ID,
    patientId: 'pat-005',
    userId: USER_ID,
    patient: mockPatients[4],
    scheduledAt: todayAt(14, 0),
    duration: 30,
    type: 'FOLLOW_UP',
    status: 'SCHEDULED',
    reason: 'Control de tiroides',
    notes: null,
    reminderSent: true,
    createdAt: daysAgo(14),
    updatedAt: daysAgo(14),
  },
  {
    id: 'apt-006',
    tenantId: TENANT_ID,
    patientId: 'pat-006',
    userId: USER_ID,
    patient: mockPatients[5],
    scheduledAt: todayAt(15, 0),
    duration: 45,
    type: 'ROUTINE',
    status: 'SCHEDULED',
    reason: 'Evaluación de migraña',
    notes: null,
    reminderSent: false,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: 'apt-007',
    tenantId: TENANT_ID,
    patientId: 'pat-008',
    userId: USER_ID,
    patient: mockPatients[7],
    scheduledAt: todayAt(16, 0),
    duration: 30,
    type: 'FOLLOW_UP',
    status: 'SCHEDULED',
    reason: 'Control gastritis',
    notes: null,
    reminderSent: false,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },
  // Future appointments
  {
    id: 'apt-008',
    tenantId: TENANT_ID,
    patientId: 'pat-007',
    userId: USER_ID,
    patient: mockPatients[6],
    scheduledAt: daysFromNow(1, 9),
    duration: 60,
    type: 'FIRST_VISIT',
    status: 'CONFIRMED',
    reason: 'Primera consulta - chequeo general',
    notes: null,
    reminderSent: true,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(1),
  },
  {
    id: 'apt-009',
    tenantId: TENANT_ID,
    patientId: 'pat-009',
    userId: USER_ID,
    patient: mockPatients[8],
    scheduledAt: daysFromNow(1, 11),
    duration: 45,
    type: 'FOLLOW_UP',
    status: 'SCHEDULED',
    reason: 'Control de ansiedad',
    notes: null,
    reminderSent: false,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
  },
  {
    id: 'apt-010',
    tenantId: TENANT_ID,
    patientId: 'pat-010',
    userId: USER_ID,
    patient: mockPatients[9],
    scheduledAt: daysFromNow(2, 10),
    duration: 30,
    type: 'FOLLOW_UP',
    status: 'SCHEDULED',
    reason: 'Control EPOC - espirometría',
    notes: null,
    reminderSent: false,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: 'apt-011',
    tenantId: TENANT_ID,
    patientId: 'pat-001',
    userId: USER_ID,
    patient: mockPatients[0],
    scheduledAt: daysFromNow(3, 8),
    duration: 30,
    type: 'FOLLOW_UP',
    status: 'SCHEDULED',
    reason: 'Revisión de laboratorios',
    notes: null,
    reminderSent: false,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 'apt-012',
    tenantId: TENANT_ID,
    patientId: 'pat-002',
    userId: USER_ID,
    patient: mockPatients[1],
    scheduledAt: daysFromNow(5, 14),
    duration: 30,
    type: 'ROUTINE',
    status: 'SCHEDULED',
    reason: 'Control trimestral diabetes',
    notes: null,
    reminderSent: false,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  // Past appointments
  {
    id: 'apt-013',
    tenantId: TENANT_ID,
    patientId: 'pat-004',
    userId: USER_ID,
    patient: mockPatients[3],
    scheduledAt: daysAgo(7, 10),
    duration: 45,
    type: 'EMERGENCY',
    status: 'COMPLETED',
    reason: 'Dolor torácico agudo',
    notes: 'Descartado SCA. Dolor musculoesquelético.',
    reminderSent: true,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
  {
    id: 'apt-014',
    tenantId: TENANT_ID,
    patientId: 'pat-006',
    userId: USER_ID,
    patient: mockPatients[5],
    scheduledAt: daysAgo(14, 15),
    duration: 30,
    type: 'FOLLOW_UP',
    status: 'COMPLETED',
    reason: 'Seguimiento migraña',
    notes: 'Mejoría con topiramato. Reducción de episodios.',
    reminderSent: true,
    createdAt: daysAgo(21),
    updatedAt: daysAgo(14),
  },
  {
    id: 'apt-015',
    tenantId: TENANT_ID,
    patientId: 'pat-003',
    userId: USER_ID,
    patient: mockPatients[2],
    scheduledAt: daysAgo(3, 11),
    duration: 30,
    type: 'ROUTINE',
    status: 'NO_SHOW',
    reason: 'Control de asma',
    notes: 'Paciente no asistió. Reprogramar.',
    reminderSent: true,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(3),
  },
];

export function getMockAppointmentsResponse(params?: {
  start?: string;
  end?: string;
  patientId?: string;
}): AppointmentsResponse {
  let filtered = [...mockAppointments];
  if (params?.start) {
    const s = new Date(params.start);
    filtered = filtered.filter((a) => new Date(a.scheduledAt) >= s);
  }
  if (params?.end) {
    const e = new Date(params.end);
    filtered = filtered.filter((a) => new Date(a.scheduledAt) <= e);
  }
  if (params?.patientId) {
    filtered = filtered.filter((a) => a.patientId === params.patientId);
  }
  return { data: filtered, total: filtered.length };
}

/* ========================================================================== */
/*  Consultations                                                              */
/* ========================================================================== */

export interface MockConsultation {
  id: string;
  patientId: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    bloodType?: string;
    allergies?: string[];
    currentMedications?: string[];
  };
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    specialty?: string;
    licenseNumber?: string;
  };
  status: string;
  createdAt: string;
  startedAt: string;
  completedAt?: string;
  clinicalData?: {
    soapNotes?: {
      subjective?: string;
      objective?: string;
      assessment?: string;
      plan?: string;
    };
  };
  soapNotes?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  vitalSigns?: {
    weight?: number;
    height?: number;
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
  };
  aiTranscription?: string;
  aiSummary?: string;
  diagnoses?: Array<{ code: string; description: string; type: 'primary' | 'secondary' }>;
}

const mockDoctor = {
  id: USER_ID,
  firstName: 'Carlos',
  lastName: 'Martínez',
  specialty: 'Medicina Interna',
  licenseNumber: 'MPPS-78542',
};

export const mockConsultations: MockConsultation[] = [
  {
    id: 'con-001',
    patientId: 'pat-001',
    patient: {
      id: 'pat-001',
      firstName: 'María',
      lastName: 'González Pérez',
      dateOfBirth: '1985-03-15',
      gender: 'FEMALE',
      bloodType: 'O+',
      allergies: ['Penicilina', 'Ibuprofeno'],
      currentMedications: ['Losartán 50mg', 'Atorvastatina 20mg'],
    },
    userId: USER_ID,
    user: mockDoctor,
    status: 'COMPLETED',
    createdAt: daysAgo(5),
    startedAt: daysAgo(5, 8),
    completedAt: daysAgo(5, 9),
    clinicalData: {
      soapNotes: {
        subjective:
          'Paciente refiere cefalea ocasional y mareos leves al levantarse. Niega dolor torácico.',
        objective: 'PA: 140/90 mmHg. FC: 78 lpm. Peso: 68 kg. Sin edemas.',
        assessment: 'Hipertensión arterial estadio 1 - control subóptimo',
        plan: 'Aumentar Losartán a 100mg/día. Control en 4 semanas. Solicitar perfil lipídico.',
      },
    },
    soapNotes: {
      subjective:
        'Paciente refiere cefalea ocasional y mareos leves al levantarse. Niega dolor torácico.',
      objective: 'PA: 140/90 mmHg. FC: 78 lpm. Peso: 68 kg. Sin edemas.',
      assessment: 'Hipertensión arterial estadio 1 - control subóptimo',
      plan: 'Aumentar Losartán a 100mg/día. Control en 4 semanas. Solicitar perfil lipídico.',
    },
    vitalSigns: {
      weight: 68,
      height: 162,
      bloodPressure: '140/90',
      heartRate: 78,
      temperature: 36.5,
      oxygenSaturation: 98,
    },
    diagnoses: [{ code: 'I10', description: 'Hipertensión arterial esencial', type: 'primary' }],
  },
  {
    id: 'con-002',
    patientId: 'pat-002',
    patient: {
      id: 'pat-002',
      firstName: 'José',
      lastName: 'Rodríguez Martínez',
      dateOfBirth: '1972-08-22',
      gender: 'MALE',
      bloodType: 'A+',
      allergies: [],
      currentMedications: ['Metformina 850mg', 'Enalapril 10mg'],
    },
    userId: USER_ID,
    user: mockDoctor,
    status: 'COMPLETED',
    createdAt: daysAgo(3),
    startedAt: daysAgo(3, 9),
    completedAt: daysAgo(3, 10),
    clinicalData: {
      soapNotes: {
        subjective:
          'Paciente acude a control trimestral. Refiere poliuria nocturna (2-3 veces). Niega polidipsia.',
        objective:
          'PA: 125/80 mmHg. FC: 72 lpm. Peso: 85 kg. IMC: 28.4. Pie diabético: sin lesiones.',
        assessment: 'Diabetes mellitus tipo 2 - control aceptable',
        plan: 'Mantener Metformina 850mg BID. Solicitar HbA1c y perfil renal. Control en 3 meses.',
      },
    },
    soapNotes: {
      subjective:
        'Paciente acude a control trimestral. Refiere poliuria nocturna (2-3 veces). Niega polidipsia.',
      objective:
        'PA: 125/80 mmHg. FC: 72 lpm. Peso: 85 kg. IMC: 28.4. Pie diabético: sin lesiones.',
      assessment: 'Diabetes mellitus tipo 2 - control aceptable',
      plan: 'Mantener Metformina 850mg BID. Solicitar HbA1c y perfil renal. Control en 3 meses.',
    },
    vitalSigns: {
      weight: 85,
      height: 173,
      bloodPressure: '125/80',
      heartRate: 72,
      temperature: 36.7,
      oxygenSaturation: 97,
    },
    diagnoses: [
      { code: 'E11', description: 'Diabetes mellitus tipo 2', type: 'primary' },
      { code: 'I10', description: 'Hipertensión arterial esencial', type: 'secondary' },
    ],
  },
  {
    id: 'con-003',
    patientId: 'pat-004',
    patient: {
      id: 'pat-004',
      firstName: 'Carlos',
      lastName: 'Mendoza Rivas',
      dateOfBirth: '1960-01-30',
      gender: 'MALE',
      bloodType: 'AB+',
      allergies: ['Mariscos', 'Contraste yodado'],
      currentMedications: ['Clopidogrel 75mg', 'Atorvastatina 40mg', 'Bisoprolol 5mg'],
    },
    userId: USER_ID,
    user: mockDoctor,
    status: 'COMPLETED',
    createdAt: daysAgo(7),
    startedAt: daysAgo(7, 10),
    completedAt: daysAgo(7, 11),
    clinicalData: {
      soapNotes: {
        subjective:
          'Dolor torácico opresivo de 2 horas de evolución. Irradiación a brazo izquierdo. Diaforesis.',
        objective:
          'PA: 150/95 mmHg. FC: 92 lpm. ECG: sin cambios isquémicos agudos. Troponina: negativa.',
        assessment: 'Dolor torácico atípico - descartado SCA',
        plan: 'Observación 6 horas. Troponina seriada. Alta con control en 48 horas.',
      },
    },
    soapNotes: {
      subjective:
        'Dolor torácico opresivo de 2 horas de evolución. Irradiación a brazo izquierdo. Diaforesis.',
      objective:
        'PA: 150/95 mmHg. FC: 92 lpm. ECG: sin cambios isquémicos agudos. Troponina: negativa.',
      assessment: 'Dolor torácico atípico - descartado SCA',
      plan: 'Observación 6 horas. Troponina seriada. Alta con control en 48 horas.',
    },
    vitalSigns: {
      weight: 78,
      height: 170,
      bloodPressure: '150/95',
      heartRate: 92,
      temperature: 36.8,
      oxygenSaturation: 96,
    },
    diagnoses: [{ code: 'R07.9', description: 'Dolor torácico no especificado', type: 'primary' }],
  },
  {
    id: 'con-004',
    patientId: 'pat-006',
    patient: {
      id: 'pat-006',
      firstName: 'Luis',
      lastName: 'Fernández Díaz',
      dateOfBirth: '1988-09-25',
      gender: 'MALE',
      bloodType: 'A-',
      allergies: ['Látex'],
      currentMedications: ['Topiramato 50mg', 'Sumatriptán 50mg PRN'],
    },
    userId: USER_ID,
    user: mockDoctor,
    status: 'COMPLETED',
    createdAt: daysAgo(14),
    startedAt: daysAgo(14, 15),
    completedAt: daysAgo(14, 16),
    clinicalData: {
      soapNotes: {
        subjective:
          'Seguimiento de migraña. Refiere reducción de episodios de 8 a 4 por mes con topiramato.',
        objective: 'PA: 118/75 mmHg. Examen neurológico normal. Fondo de ojo: normal.',
        assessment: 'Migraña con aura - mejoría parcial con profilaxis',
        plan: 'Aumentar Topiramato a 75mg. Diario de cefaleas. Control en 6 semanas.',
      },
    },
    soapNotes: {
      subjective:
        'Seguimiento de migraña. Refiere reducción de episodios de 8 a 4 por mes con topiramato.',
      objective: 'PA: 118/75 mmHg. Examen neurológico normal. Fondo de ojo: normal.',
      assessment: 'Migraña con aura - mejoría parcial con profilaxis',
      plan: 'Aumentar Topiramato a 75mg. Diario de cefaleas. Control en 6 semanas.',
    },
    vitalSigns: {
      weight: 75,
      height: 178,
      bloodPressure: '118/75',
      heartRate: 68,
      temperature: 36.4,
      oxygenSaturation: 99,
    },
    diagnoses: [{ code: 'G43.1', description: 'Migraña con aura', type: 'primary' }],
  },
  {
    id: 'con-005',
    patientId: 'pat-005',
    patient: {
      id: 'pat-005',
      firstName: 'Ana',
      lastName: 'Ramírez Torres',
      dateOfBirth: '1990-06-12',
      gender: 'FEMALE',
      bloodType: 'O-',
      allergies: [],
      currentMedications: ['Levotiroxina 75mcg'],
    },
    userId: USER_ID,
    user: mockDoctor,
    status: 'COMPLETED',
    createdAt: daysAgo(15),
    startedAt: daysAgo(15, 14),
    completedAt: daysAgo(15, 15),
    clinicalData: {
      soapNotes: {
        subjective: 'Control de hipotiroidismo. Se siente bien, sin fatiga ni aumento de peso.',
        objective: 'PA: 110/70 mmHg. Tiroides: no palpable. Piel: hidratada, sin mixedema.',
        assessment: 'Hipotiroidismo primario - controlado',
        plan: 'Mantener Levotiroxina 75mcg. TSH y T4L en 3 meses.',
      },
    },
    soapNotes: {
      subjective: 'Control de hipotiroidismo. Se siente bien, sin fatiga ni aumento de peso.',
      objective: 'PA: 110/70 mmHg. Tiroides: no palpable. Piel: hidratada, sin mixedema.',
      assessment: 'Hipotiroidismo primario - controlado',
      plan: 'Mantener Levotiroxina 75mcg. TSH y T4L en 3 meses.',
    },
    vitalSigns: {
      weight: 58,
      height: 165,
      bloodPressure: '110/70',
      heartRate: 72,
      temperature: 36.6,
      oxygenSaturation: 98,
    },
    diagnoses: [{ code: 'E03.9', description: 'Hipotiroidismo no especificado', type: 'primary' }],
  },
  {
    id: 'con-006',
    patientId: 'pat-008',
    patient: {
      id: 'pat-008',
      firstName: 'Roberto',
      lastName: 'Castillo Vargas',
      dateOfBirth: '1978-12-03',
      gender: 'MALE',
      bloodType: 'O+',
      allergies: ['AINEs'],
      currentMedications: ['Omeprazol 20mg', 'Sucralfato 1g'],
    },
    userId: USER_ID,
    user: mockDoctor,
    status: 'COMPLETED',
    createdAt: daysAgo(10),
    startedAt: daysAgo(10, 11),
    completedAt: daysAgo(10, 12),
    clinicalData: {
      soapNotes: {
        subjective: 'Epigastralgia postprandial. Pirosis nocturna. Mejoría parcial con omeprazol.',
        objective:
          'Abdomen: blando, dolor a la palpación en epigastrio. Sin signos de irritación peritoneal.',
        assessment: 'Gastritis crónica con hernia hiatal',
        plan: 'Aumentar Omeprazol a 40mg. Dieta blanda. Endoscopia de control en 4 meses.',
      },
    },
    soapNotes: {
      subjective: 'Epigastralgia postprandial. Pirosis nocturna. Mejoría parcial con omeprazol.',
      objective:
        'Abdomen: blando, dolor a la palpación en epigastrio. Sin signos de irritación peritoneal.',
      assessment: 'Gastritis crónica con hernia hiatal',
      plan: 'Aumentar Omeprazol a 40mg. Dieta blanda. Endoscopia de control en 4 meses.',
    },
    vitalSigns: {
      weight: 82,
      height: 175,
      bloodPressure: '120/78',
      heartRate: 70,
      temperature: 36.5,
      oxygenSaturation: 98,
    },
    diagnoses: [
      { code: 'K29.5', description: 'Gastritis crónica no especificada', type: 'primary' },
      { code: 'K44.9', description: 'Hernia diafragmática sin obstrucción', type: 'secondary' },
    ],
  },
  {
    id: 'con-007',
    patientId: 'pat-009',
    patient: {
      id: 'pat-009',
      firstName: 'Gabriela',
      lastName: 'Herrera Blanco',
      dateOfBirth: '1992-07-20',
      gender: 'FEMALE',
      bloodType: 'A+',
      allergies: [],
      currentMedications: ['Sertralina 50mg'],
    },
    userId: USER_ID,
    user: mockDoctor,
    status: 'COMPLETED',
    createdAt: daysAgo(20),
    startedAt: daysAgo(20, 16),
    completedAt: daysAgo(20, 17),
    clinicalData: {
      soapNotes: {
        subjective:
          'Ansiedad persistente. Dificultad para dormir. Preocupación excesiva por el trabajo.',
        objective: 'Paciente ansiosa pero cooperadora. GAD-7: 12 (moderado). PHQ-9: 8 (leve).',
        assessment: 'Trastorno de ansiedad generalizada',
        plan: 'Mantener Sertralina 50mg. Referir a psicología para TCC. Control en 4 semanas.',
      },
    },
    soapNotes: {
      subjective:
        'Ansiedad persistente. Dificultad para dormir. Preocupación excesiva por el trabajo.',
      objective: 'Paciente ansiosa pero cooperadora. GAD-7: 12 (moderado). PHQ-9: 8 (leve).',
      assessment: 'Trastorno de ansiedad generalizada',
      plan: 'Mantener Sertralina 50mg. Referir a psicología para TCC. Control en 4 semanas.',
    },
    vitalSigns: {
      weight: 55,
      height: 160,
      bloodPressure: '115/72',
      heartRate: 82,
      temperature: 36.5,
      oxygenSaturation: 99,
    },
    diagnoses: [
      { code: 'F41.1', description: 'Trastorno de ansiedad generalizada', type: 'primary' },
    ],
  },
  {
    id: 'con-008',
    patientId: 'pat-010',
    patient: {
      id: 'pat-010',
      firstName: 'Andrés',
      lastName: 'Paredes Soto',
      dateOfBirth: '1965-02-14',
      gender: 'MALE',
      bloodType: 'AB-',
      allergies: ['Cefalosporinas'],
      currentMedications: ['Tiotropio 18mcg', 'Salbutamol inhalador PRN'],
    },
    userId: USER_ID,
    user: mockDoctor,
    status: 'IN_PROGRESS',
    createdAt: daysAgo(1),
    startedAt: daysAgo(1, 10),
    clinicalData: {
      soapNotes: {
        subjective: 'Disnea de esfuerzo progresiva. Tos productiva matutina. Ex-fumador.',
        objective:
          'PA: 130/82 mmHg. Auscultación: sibilancias espiratorias bilaterales. SpO2: 94%.',
        assessment: 'EPOC moderado - exacerbación leve',
        plan: 'Nebulización con salbutamol. Prednisona 40mg x 5 días. Espirometría de control.',
      },
    },
    soapNotes: {
      subjective: 'Disnea de esfuerzo progresiva. Tos productiva matutina. Ex-fumador.',
      objective: 'PA: 130/82 mmHg. Auscultación: sibilancias espiratorias bilaterales. SpO2: 94%.',
      assessment: 'EPOC moderado - exacerbación leve',
      plan: 'Nebulización con salbutamol. Prednisona 40mg x 5 días. Espirometría de control.',
    },
    vitalSigns: {
      weight: 72,
      height: 168,
      bloodPressure: '130/82',
      heartRate: 88,
      temperature: 37.1,
      oxygenSaturation: 94,
    },
    diagnoses: [{ code: 'J44.1', description: 'EPOC con exacerbación aguda', type: 'primary' }],
  },
];

export function getMockConsultationsResponse(params?: { patientId?: string; status?: string }): {
  data: MockConsultation[];
} {
  let filtered = [...mockConsultations];
  if (params?.patientId) {
    filtered = filtered.filter((c) => c.patientId === params.patientId);
  }
  if (params?.status) {
    filtered = filtered.filter((c) => c.status === params.status);
  }
  return { data: filtered };
}

/* ========================================================================== */
/*  Prescriptions                                                              */
/* ========================================================================== */

const mockMedications: Record<string, MedicationItem[]> = {
  'con-001': [
    {
      name: 'Losartán',
      dose: '100mg',
      frequency: 'Una vez al día',
      duration: '30 días',
      instructions: 'Tomar en la mañana con el desayuno',
      quantity: '30 tabletas',
    },
    {
      name: 'Atorvastatina',
      dose: '20mg',
      frequency: 'Una vez al día',
      duration: '30 días',
      instructions: 'Tomar en la noche',
      quantity: '30 tabletas',
    },
  ],
  'con-002': [
    {
      name: 'Metformina',
      dose: '850mg',
      frequency: 'Dos veces al día',
      duration: '90 días',
      instructions: 'Tomar con las comidas principales',
      quantity: '180 tabletas',
    },
  ],
  'con-004': [
    {
      name: 'Topiramato',
      dose: '75mg',
      frequency: 'Una vez al día',
      duration: '42 días',
      instructions: 'Tomar en la noche. Aumentar gradualmente.',
      quantity: '42 tabletas',
    },
    {
      name: 'Sumatriptán',
      dose: '50mg',
      frequency: 'PRN (según necesidad)',
      duration: '30 días',
      instructions: 'Tomar al inicio del episodio de migraña. Máximo 2 dosis/día.',
      quantity: '12 tabletas',
    },
  ],
  'con-006': [
    {
      name: 'Omeprazol',
      dose: '40mg',
      frequency: 'Una vez al día',
      duration: '30 días',
      instructions: 'Tomar 30 minutos antes del desayuno',
      quantity: '30 cápsulas',
    },
    {
      name: 'Sucralfato',
      dose: '1g',
      frequency: 'Cuatro veces al día',
      duration: '30 días',
      instructions: 'Tomar 1 hora antes de cada comida y al acostarse',
      quantity: '120 sobres',
    },
  ],
  'con-008': [
    {
      name: 'Prednisona',
      dose: '40mg',
      frequency: 'Una vez al día',
      duration: '5 días',
      instructions: 'Tomar en la mañana con alimentos. No suspender abruptamente.',
      quantity: '5 tabletas',
    },
  ],
};

export const mockPrescriptions: Prescription[] = Object.entries(mockMedications).map(
  ([consultationId, medications], i) => {
    const consultation = mockConsultations.find((c) => c.id === consultationId);
    return {
      id: `presc-${String(i + 1).padStart(3, '0')}`,
      consultationId,
      medications,
      diagnosis: consultation?.clinicalData?.soapNotes?.assessment || null,
      instructions: consultation?.soapNotes?.plan || null,
      securityCode: `DOCI-${String(Math.random()).slice(2, 8).toUpperCase()}`,
      pdfUrl: null,
      isValid: true,
      expiresAt: daysFromNow(30),
      createdAt: consultation?.completedAt || consultation?.createdAt || daysAgo(5),
      consultation: consultation
        ? {
            patient: {
              id: consultation.patient.id,
              firstName: consultation.patient.firstName,
              lastName: consultation.patient.lastName,
              birthDate: consultation.patient.dateOfBirth,
            },
            user: {
              id: consultation.user.id,
              firstName: consultation.user.firstName,
              lastName: consultation.user.lastName,
              specialty: consultation.user.specialty,
              licenseNumber: consultation.user.licenseNumber,
            },
          }
        : undefined,
    };
  }
);

/* ========================================================================== */
/*  Templates                                                                  */
/* ========================================================================== */

export interface MockTemplate {
  id: string;
  name: string;
  type: 'SOAP' | 'PRESCRIPTION' | 'REFERRAL' | 'CERTIFICATE' | 'OTHER';
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const mockTemplates: MockTemplate[] = [
  {
    id: 'tmpl-001',
    name: 'Consulta General SOAP',
    type: 'SOAP',
    content: `**S (Subjetivo):**\nMotivo de consulta: [motivo]\nEnfermedad actual: [descripción]\nAntecedentes relevantes: [antecedentes]\n\n**O (Objetivo):**\nSignos vitales: PA: _/_ mmHg | FC: _ lpm | T: _°C | SpO2: _%\nExamen físico: [hallazgos]\n\n**A (Evaluación):**\nDiagnóstico: [diagnóstico CIE-10]\n\n**P (Plan):**\nTratamiento: [medicamentos]\nEstudios: [laboratorios/imágenes]\nSeguimiento: [próxima cita]`,
    isDefault: true,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(30),
  },
  {
    id: 'tmpl-002',
    name: 'Receta Médica Estándar',
    type: 'PRESCRIPTION',
    content: `**RECETA MÉDICA**\n\nPaciente: [nombre]\nCédula: [cédula]\nFecha: [fecha]\n\nRp/\n1. [Medicamento] [dosis] - [frecuencia] - [duración]\n2. [Medicamento] [dosis] - [frecuencia] - [duración]\n\nIndicaciones especiales:\n[indicaciones]\n\n_________________________\nDr. [nombre]\nMPPS: [número]\nEspecialidad: [especialidad]`,
    isDefault: true,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(60),
  },
  {
    id: 'tmpl-003',
    name: 'Referencia a Especialista',
    type: 'REFERRAL',
    content: `**REFERENCIA MÉDICA**\n\nDe: Dr. [nombre remitente] - [especialidad]\nPara: Dr./Dra. [nombre especialista] - [especialidad destino]\n\nPaciente: [nombre paciente]\nEdad: [edad] | Sexo: [sexo]\n\nMotivo de referencia:\n[motivo detallado]\n\nResumen clínico:\n[resumen]\n\nEstudios realizados:\n[estudios]\n\nDiagnóstico presuntivo: [diagnóstico]\n\nSe agradece evaluación y manejo.`,
    isDefault: false,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
  },
  {
    id: 'tmpl-004',
    name: 'Certificado de Reposo',
    type: 'CERTIFICATE',
    content: `**CERTIFICADO MÉDICO DE REPOSO**\n\nQuien suscribe, Dr. [nombre], portador de la cédula V-[cédula], inscrito en el MPPS bajo el N° [mpps], certifica que:\n\nEl/La ciudadano(a) [nombre paciente], portador(a) de la cédula V-[cédula paciente], fue evaluado(a) en consulta médica el día [fecha], presentando:\n\nDiagnóstico: [diagnóstico]\n\nSe indica reposo médico por [días] días, desde el [fecha inicio] hasta el [fecha fin].\n\nConstancia que se expide a solicitud de la parte interesada.`,
    isDefault: false,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(45),
  },
  {
    id: 'tmpl-005',
    name: 'Nota de Evolución Diaria',
    type: 'OTHER',
    content: `**NOTA DE EVOLUCIÓN**\n\nFecha: [fecha] | Hora: [hora]\nPaciente: [nombre]\n\nEvolución:\n[descripción del estado actual del paciente]\n\nSignos vitales:\nPA: _/_ | FC: _ | FR: _ | T: _ | SpO2: _\n\nPlan:\n[ajustes al tratamiento o indicaciones]`,
    isDefault: false,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
  },
];

/* ========================================================================== */
/*  Services & Billing                                                         */
/* ========================================================================== */

export const mockServices: Service[] = [
  {
    id: 'svc-001',
    tenantId: TENANT_ID,
    name: 'Consulta General',
    description: 'Consulta médica de medicina interna',
    code: 'CG-001',
    satCode: null,
    price: 25,
    currency: 'USD',
    duration: 30,
    category: 'Consultas',
    isActive: true,
    createdAt: daysAgo(180),
    updatedAt: daysAgo(30),
  },
  {
    id: 'svc-002',
    tenantId: TENANT_ID,
    name: 'Consulta Especializada',
    description: 'Consulta con evaluación especializada y plan de tratamiento',
    code: 'CE-001',
    satCode: null,
    price: 40,
    currency: 'USD',
    duration: 45,
    category: 'Consultas',
    isActive: true,
    createdAt: daysAgo(180),
    updatedAt: daysAgo(30),
  },
  {
    id: 'svc-003',
    tenantId: TENANT_ID,
    name: 'Electrocardiograma',
    description: 'ECG de 12 derivaciones con interpretación',
    code: 'ECG-001',
    satCode: null,
    price: 15,
    currency: 'USD',
    duration: 15,
    category: 'Procedimientos',
    isActive: true,
    createdAt: daysAgo(180),
    updatedAt: daysAgo(60),
  },
  {
    id: 'svc-004',
    tenantId: TENANT_ID,
    name: 'Espirometría',
    description: 'Prueba de función pulmonar con broncodilatador',
    code: 'ESP-001',
    satCode: null,
    price: 20,
    currency: 'USD',
    duration: 30,
    category: 'Procedimientos',
    isActive: true,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(60),
  },
  {
    id: 'svc-005',
    tenantId: TENANT_ID,
    name: 'Certificado Médico',
    description: 'Certificado de salud o reposo médico',
    code: 'CM-001',
    satCode: null,
    price: 10,
    currency: 'USD',
    duration: 15,
    category: 'Documentos',
    isActive: true,
    createdAt: daysAgo(180),
    updatedAt: daysAgo(90),
  },
  {
    id: 'svc-006',
    tenantId: TENANT_ID,
    name: 'Control Post-Operatorio',
    description: 'Evaluación y seguimiento post-quirúrgico',
    code: 'CPO-001',
    satCode: null,
    price: 30,
    currency: 'USD',
    duration: 30,
    category: 'Consultas',
    isActive: true,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(90),
  },
];

function makeInvoiceItem(
  invoiceId: string,
  service: Service,
  qty: number,
  discount = 0
): InvoiceItem {
  const total = service.price * qty - discount;
  return {
    id: `ii-${invoiceId}-${service.id}`,
    invoiceId,
    serviceId: service.id,
    service,
    description: service.name,
    quantity: qty,
    unitPrice: service.price,
    discount,
    total,
  };
}

function makePayment(
  invoiceId: string,
  amount: number,
  method: Payment['method'],
  daysBack: number
): Payment {
  return {
    id: `pay-${invoiceId}`,
    invoiceId,
    amount,
    method,
    reference:
      method === 'TRANSFER' ? `REF-${Math.random().toString(36).slice(2, 8).toUpperCase()}` : null,
    paidAt: daysAgo(daysBack),
    notes: null,
    createdAt: daysAgo(daysBack),
  };
}

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-001',
    tenantId: TENANT_ID,
    patientId: 'pat-001',
    patient: mockPatients[0],
    invoiceNumber: 'DOCI-2025-001',
    status: 'PAID',
    issueDate: daysAgo(5),
    dueDate: daysAgo(0),
    subtotal: 40,
    tax: 0,
    discount: 0,
    total: 40,
    currency: 'USD',
    notes: null,
    items: [
      makeInvoiceItem('inv-001', mockServices[0], 1),
      makeInvoiceItem('inv-001', mockServices[2], 1),
    ],
    payments: [makePayment('inv-001', 40, 'CARD', 4)],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(4),
  },
  {
    id: 'inv-002',
    tenantId: TENANT_ID,
    patientId: 'pat-002',
    patient: mockPatients[1],
    invoiceNumber: 'DOCI-2025-002',
    status: 'PAID',
    issueDate: daysAgo(3),
    dueDate: daysFromNow(12),
    subtotal: 40,
    tax: 0,
    discount: 0,
    total: 40,
    currency: 'USD',
    notes: 'Control trimestral diabetes',
    items: [makeInvoiceItem('inv-002', mockServices[1], 1)],
    payments: [makePayment('inv-002', 40, 'TRANSFER', 2)],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2),
  },
  {
    id: 'inv-003',
    tenantId: TENANT_ID,
    patientId: 'pat-004',
    patient: mockPatients[3],
    invoiceNumber: 'DOCI-2025-003',
    status: 'PAID',
    issueDate: daysAgo(7),
    dueDate: daysAgo(0),
    subtotal: 55,
    tax: 0,
    discount: 0,
    total: 55,
    currency: 'USD',
    notes: 'Emergencia - dolor torácico',
    items: [
      makeInvoiceItem('inv-003', mockServices[1], 1),
      makeInvoiceItem('inv-003', mockServices[2], 1),
    ],
    payments: [makePayment('inv-003', 55, 'CASH', 7)],
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
  {
    id: 'inv-004',
    tenantId: TENANT_ID,
    patientId: 'pat-006',
    patient: mockPatients[5],
    invoiceNumber: 'DOCI-2025-004',
    status: 'PENDING',
    issueDate: daysAgo(14),
    dueDate: daysFromNow(1),
    subtotal: 25,
    tax: 0,
    discount: 0,
    total: 25,
    currency: 'USD',
    notes: null,
    items: [makeInvoiceItem('inv-004', mockServices[0], 1)],
    payments: [],
    createdAt: daysAgo(14),
    updatedAt: daysAgo(14),
  },
  {
    id: 'inv-005',
    tenantId: TENANT_ID,
    patientId: 'pat-010',
    patient: mockPatients[9],
    invoiceNumber: 'DOCI-2025-005',
    status: 'PENDING',
    issueDate: daysAgo(1),
    dueDate: daysFromNow(14),
    subtotal: 45,
    tax: 0,
    discount: 0,
    total: 45,
    currency: 'USD',
    notes: 'Consulta + espirometría',
    items: [
      makeInvoiceItem('inv-005', mockServices[0], 1),
      makeInvoiceItem('inv-005', mockServices[3], 1),
    ],
    payments: [],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 'inv-006',
    tenantId: TENANT_ID,
    patientId: 'pat-008',
    patient: mockPatients[7],
    invoiceNumber: 'DOCI-2025-006',
    status: 'OVERDUE',
    issueDate: daysAgo(30),
    dueDate: daysAgo(15),
    subtotal: 40,
    tax: 0,
    discount: 0,
    total: 40,
    currency: 'USD',
    notes: null,
    items: [makeInvoiceItem('inv-006', mockServices[1], 1)],
    payments: [],
    createdAt: daysAgo(30),
    updatedAt: daysAgo(15),
  },
];

export function getMockInvoicesResponse(): InvoicesResponse {
  return {
    data: mockInvoices,
    total: mockInvoices.length,
    page: 1,
    limit: 20,
  };
}

export function getMockServicesResponse(): ServicesResponse {
  return {
    data: mockServices,
    total: mockServices.length,
  };
}

export function getMockFinancialSummary(): FinancialSummary {
  const paid = mockInvoices.filter((i) => i.status === 'PAID');
  const pending = mockInvoices.filter((i) => i.status === 'PENDING');
  const overdue = mockInvoices.filter((i) => i.status === 'OVERDUE');
  return {
    totalRevenue: paid.reduce((s, i) => s + i.total, 0),
    totalPending: pending.reduce((s, i) => s + i.total, 0),
    totalOverdue: overdue.reduce((s, i) => s + i.total, 0),
    invoiceCount: mockInvoices.length,
    paidCount: paid.length,
    pendingCount: pending.length,
  };
}

/* ========================================================================== */
/*  Storage / Files                                                            */
/* ========================================================================== */

export interface MockPatientFile {
  id: string;
  patientId: string;
  patient?: { id: string; firstName: string; lastName: string };
  name: string;
  type: 'IMAGE' | 'DOCUMENT' | 'LAB_RESULT' | 'IMAGING' | 'PRESCRIPTION' | 'OTHER';
  sizeMb: number;
  storagePath: string;
  storageUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const mockFiles: MockPatientFile[] = [
  {
    id: 'file-001',
    patientId: 'pat-001',
    patient: { id: 'pat-001', firstName: 'María', lastName: 'González Pérez' },
    name: 'Perfil_Lipidico_2025.pdf',
    type: 'LAB_RESULT',
    sizeMb: 0.8,
    storagePath: '/patients/pat-001/labs/perfil_lipidico_2025.pdf',
    description: 'Perfil lipídico completo - Laboratorio Clínico Ávila',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
  },
  {
    id: 'file-002',
    patientId: 'pat-002',
    patient: { id: 'pat-002', firstName: 'José', lastName: 'Rodríguez Martínez' },
    name: 'HbA1c_Enero_2025.pdf',
    type: 'LAB_RESULT',
    sizeMb: 0.5,
    storagePath: '/patients/pat-002/labs/hba1c_enero_2025.pdf',
    description: 'Hemoglobina glicosilada - resultado 7.2%',
    createdAt: daysAgo(15),
    updatedAt: daysAgo(15),
  },
  {
    id: 'file-003',
    patientId: 'pat-004',
    patient: { id: 'pat-004', firstName: 'Carlos', lastName: 'Mendoza Rivas' },
    name: 'ECG_Emergencia.pdf',
    type: 'IMAGING',
    sizeMb: 1.2,
    storagePath: '/patients/pat-004/imaging/ecg_emergencia.pdf',
    description: 'ECG 12 derivaciones - evaluación dolor torácico',
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
  {
    id: 'file-004',
    patientId: 'pat-004',
    patient: { id: 'pat-004', firstName: 'Carlos', lastName: 'Mendoza Rivas' },
    name: 'Ecocardiograma_2024.pdf',
    type: 'IMAGING',
    sizeMb: 3.5,
    storagePath: '/patients/pat-004/imaging/ecocardiograma_2024.pdf',
    description: 'Ecocardiograma transtorácico - FEVI 55%',
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
  },
  {
    id: 'file-005',
    patientId: 'pat-005',
    patient: { id: 'pat-005', firstName: 'Ana', lastName: 'Ramírez Torres' },
    name: 'Perfil_Tiroideo_2025.pdf',
    type: 'LAB_RESULT',
    sizeMb: 0.6,
    storagePath: '/patients/pat-005/labs/perfil_tiroideo_2025.pdf',
    description: 'TSH: 2.8 mUI/L, T4L: 1.1 ng/dL',
    createdAt: daysAgo(20),
    updatedAt: daysAgo(20),
  },
  {
    id: 'file-006',
    patientId: 'pat-008',
    patient: { id: 'pat-008', firstName: 'Roberto', lastName: 'Castillo Vargas' },
    name: 'Endoscopia_Superior.pdf',
    type: 'IMAGING',
    sizeMb: 2.1,
    storagePath: '/patients/pat-008/imaging/endoscopia_superior.pdf',
    description: 'Endoscopia digestiva superior - gastritis crónica, hernia hiatal',
    createdAt: daysAgo(45),
    updatedAt: daysAgo(45),
  },
  {
    id: 'file-007',
    patientId: 'pat-010',
    patient: { id: 'pat-010', firstName: 'Andrés', lastName: 'Paredes Soto' },
    name: 'Espirometria_Control.pdf',
    type: 'DOCUMENT',
    sizeMb: 0.9,
    storagePath: '/patients/pat-010/docs/espirometria_control.pdf',
    description: 'Espirometría pre y post broncodilatador - FEV1 62%',
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
  },
  {
    id: 'file-008',
    patientId: 'pat-001',
    patient: { id: 'pat-001', firstName: 'María', lastName: 'González Pérez' },
    name: 'Receta_Losartan_100mg.pdf',
    type: 'PRESCRIPTION',
    sizeMb: 0.3,
    storagePath: '/patients/pat-001/prescriptions/receta_losartan.pdf',
    description: 'Receta médica - Losartán 100mg',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: 'file-009',
    patientId: 'pat-003',
    patient: { id: 'pat-003', firstName: 'Valentina', lastName: 'López Hernández' },
    name: 'Radiografia_Torax.jpg',
    type: 'IMAGE',
    sizeMb: 4.2,
    storagePath: '/patients/pat-003/imaging/radiografia_torax.jpg',
    description: 'Rx de tórax PA - campos pulmonares limpios',
    createdAt: daysAgo(25),
    updatedAt: daysAgo(25),
  },
  {
    id: 'file-010',
    patientId: 'pat-009',
    patient: { id: 'pat-009', firstName: 'Gabriela', lastName: 'Herrera Blanco' },
    name: 'Referencia_Psicologia.pdf',
    type: 'DOCUMENT',
    sizeMb: 0.4,
    storagePath: '/patients/pat-009/docs/referencia_psicologia.pdf',
    description: 'Referencia a psicología clínica para TCC',
    createdAt: daysAgo(20),
    updatedAt: daysAgo(20),
  },
];

/* ========================================================================== */
/*  Settings: Profile & Tenant                                                 */
/* ========================================================================== */

export const mockProfile: UserProfile = {
  id: USER_ID,
  clerkId: 'clerk-demo-001',
  email: 'dr.martinez@doci.app',
  firstName: 'Carlos',
  lastName: 'Martínez',
  specialty: 'general',
  licenseNumber: 'MPPS-78542',
  phone: '+58 412-555-0001',
  bio: 'Médico internista con 15 años de experiencia. Egresado de la UCV. Especialista en manejo de enfermedades crónicas y medicina preventiva.',
  signatureUrl: null,
  logoUrl: null,
};

export const mockTenant: TenantSettings = {
  id: TENANT_ID,
  name: 'Centro Médico Doci',
  address: 'Av. Francisco de Miranda, Torre Doci, Piso 3, Consultorio 3-A',
  city: 'Caracas',
  state: 'Distrito Capital',
  postalCode: '1060',
  phone: '+58 212-555-0100',
  email: 'info@centromedicodoci.com',
  website: 'https://centromedicodoci.com',
  schedule: {
    monday: { open: '08:00', close: '18:00', enabled: true },
    tuesday: { open: '08:00', close: '18:00', enabled: true },
    wednesday: { open: '08:00', close: '18:00', enabled: true },
    thursday: { open: '08:00', close: '18:00', enabled: true },
    friday: { open: '08:00', close: '16:00', enabled: true },
    saturday: { open: '08:00', close: '12:00', enabled: true },
    sunday: { open: '00:00', close: '00:00', enabled: false },
  },
  settings: { currency: 'USD', timezone: 'America/Caracas', locale: 'es-VE' },
};

/* ========================================================================== */
/*  Mock API router — resolves an endpoint + method to mock data               */
/* ========================================================================== */

/**
 * Given a request path (e.g. "/patients?page=1") and HTTP method, return the
 * appropriate mock response body, or `null` if no mock is available.
 */
export function resolveMockResponse(path: string, method: string): unknown | null {
  const m = method.toUpperCase();
  const [pathname, queryString] = path.split('?');
  const params = new URLSearchParams(queryString || '');

  // ── Patients ──────────────────────────────────────────────
  if (pathname === '/patients' && m === 'GET') {
    return getMockPatientsResponse({
      page: Number(params.get('page')) || 1,
      limit: Number(params.get('limit')) || 12,
      search: params.get('search') || undefined,
    });
  }

  const patientMatch = pathname.match(/^\/patients\/([^/]+)$/);
  if (patientMatch && m === 'GET') {
    const p = mockPatients.find((pt) => pt.id === patientMatch[1]);
    return p || mockPatients[0]; // fallback to first patient for any ID
  }

  // ── Appointments ──────────────────────────────────────────
  if (pathname === '/appointments' && m === 'GET') {
    return getMockAppointmentsResponse({
      start: params.get('start') || params.get('startDate') || undefined,
      end: params.get('end') || params.get('endDate') || undefined,
      patientId: params.get('patientId') || undefined,
    });
  }

  // ── Consultations ─────────────────────────────────────────
  if (pathname === '/consultations' && m === 'GET') {
    return getMockConsultationsResponse({
      patientId: params.get('patientId') || undefined,
      status: params.get('status') || undefined,
    });
  }

  const consultationMatch = pathname.match(/^\/consultations\/([^/]+)$/);
  if (consultationMatch && m === 'GET') {
    const c = mockConsultations.find((co) => co.id === consultationMatch[1]);
    return c || mockConsultations[0];
  }

  // ── Prescriptions ─────────────────────────────────────────
  if (pathname === '/prescriptions' && m === 'GET') {
    const cId = params.get('consultationId');
    const pId = params.get('patientId');
    let filtered = [...mockPrescriptions];
    if (cId) filtered = filtered.filter((p) => p.consultationId === cId);
    if (pId) {
      const patientConsultationIds = mockConsultations
        .filter((c) => c.patientId === pId)
        .map((c) => c.id);
      filtered = filtered.filter((p) => patientConsultationIds.includes(p.consultationId));
    }
    return filtered;
  }

  // ── Templates ─────────────────────────────────────────────
  if (pathname === '/templates' && m === 'GET') {
    return mockTemplates;
  }

  // ── Storage ───────────────────────────────────────────────
  if (pathname === '/storage' && m === 'GET') {
    return { files: mockFiles };
  }

  const storagePatientMatch = pathname.match(/^\/storage\/patient\/([^/]+)$/);
  if (storagePatientMatch && m === 'GET') {
    return mockFiles.filter((f) => f.patientId === storagePatientMatch[1]);
  }

  // ── Billing ───────────────────────────────────────────────
  if (pathname === '/billing/invoices' && m === 'GET') {
    return getMockInvoicesResponse();
  }

  if (pathname === '/billing/services' && m === 'GET') {
    return getMockServicesResponse();
  }

  if (pathname === '/billing/reports/summary' && m === 'GET') {
    return getMockFinancialSummary();
  }

  // ── Settings ──────────────────────────────────────────────
  if (pathname === '/auth/me' && m === 'GET') {
    return mockProfile;
  }

  if (pathname === '/auth/me' && m === 'PUT') {
    return mockProfile; // echo back
  }

  if (pathname === '/auth/tenant' && m === 'GET') {
    return mockTenant;
  }

  if (pathname === '/auth/tenant' && m === 'PUT') {
    return mockTenant; // echo back
  }

  // ── AI / Notifications (stubs) ────────────────────────────
  if (pathname === '/ai/process-consultation' && m === 'POST') {
    return {
      soapNotes: {
        subjective: 'Paciente refiere síntomas generales...',
        objective: 'Examen físico dentro de límites normales.',
        assessment: 'Evaluación pendiente de estudios complementarios.',
        plan: 'Solicitar laboratorios básicos. Control en 2 semanas.',
      },
    };
  }

  if (pathname === '/notifications/send' && m === 'POST') {
    return { success: true, message: 'Notificación enviada (demo)' };
  }

  return null;
}

/* ========================================================================== */
/*  mockFetch — drop-in replacement for raw fetch() with mock fallback         */
/* ========================================================================== */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Wraps the native `fetch()` so that when the backend is unreachable the call
 * returns a synthetic `Response` built from mock data.  Pages that use raw
 * `fetch()` instead of `apiFetch()` can swap in this helper to get automatic
 * demo-mode support.
 *
 * Usage:  `const res = await mockFetch(\`\${apiUrl}/consultations\`, { ... });`
 */
export async function mockFetch(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  try {
    const res = await fetch(input, init);
    return res;
  } catch {
    // Network error — resolve from mock data
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const endpoint = url.replace(API_BASE, '');
    const method = init?.method || 'GET';
    const mock = resolveMockResponse(endpoint, method);

    if (mock !== null) {
      return new Response(JSON.stringify(mock), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // No mock available — return a 503
    return new Response(JSON.stringify({ message: 'API no disponible' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
