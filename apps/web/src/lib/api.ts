const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return response.json();
}

// Patient types
export interface Patient {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodType: string | null;
  allergies: string[];
  medicalHistory: Record<string, unknown> | null;
  currentMedications: string[];
  emergencyContact: Record<string, unknown> | null;
  insuranceInfo: Record<string, unknown> | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientsResponse {
  data: Patient[];
  total: number;
  page: number;
  limit: number;
}

// Appointment types
export interface Appointment {
  id: string;
  tenantId: string;
  patientId: string;
  userId: string;
  patient?: Patient;
  scheduledAt: string;
  duration: number;
  type: 'FIRST_VISIT' | 'FOLLOW_UP' | 'EMERGENCY' | 'ROUTINE' | 'PROCEDURE';
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reason: string | null;
  notes: string | null;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentsResponse {
  data: Appointment[];
  total: number;
}

// Patient API functions
export const patientsApi = {
  getAll: (token: string, params?: { page?: number; limit?: number; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    
    const query = searchParams.toString();
    return apiFetch<PatientsResponse>(`/patients${query ? `?${query}` : ''}`, { token });
  },

  getById: (token: string, id: string) =>
    apiFetch<Patient>(`/patients/${id}`, { token }),

  create: (token: string, data: Partial<Patient>) =>
    apiFetch<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  update: (token: string, id: string, data: Partial<Patient>) =>
    apiFetch<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  delete: (token: string, id: string) =>
    apiFetch<void>(`/patients/${id}`, {
      method: 'DELETE',
      token,
    }),
};

// Appointment API functions
export const appointmentsApi = {
  getAll: (token: string, params?: { start?: string; end?: string; patientId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.start) searchParams.set('start', params.start);
    if (params?.end) searchParams.set('end', params.end);
    if (params?.patientId) searchParams.set('patientId', params.patientId);
    
    const query = searchParams.toString();
    return apiFetch<AppointmentsResponse>(`/appointments${query ? `?${query}` : ''}`, { token });
  },

  getById: (token: string, id: string) =>
    apiFetch<Appointment>(`/appointments/${id}`, { token }),

  create: (token: string, data: Partial<Appointment>) =>
    apiFetch<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  update: (token: string, id: string, data: Partial<Appointment>) =>
    apiFetch<Appointment>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  delete: (token: string, id: string) =>
    apiFetch<void>(`/appointments/${id}`, {
      method: 'DELETE',
      token,
    }),
};
