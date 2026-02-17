const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
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

  getById: (token: string, id: string) => apiFetch<Patient>(`/patients/${id}`, { token }),

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

  getById: (token: string, id: string) => apiFetch<Appointment>(`/appointments/${id}`, { token }),

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

// Prescription types
export interface MedicationItem {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: string;
}

export interface Prescription {
  id: string;
  consultationId: string;
  medications: MedicationItem[];
  diagnosis: string | null;
  instructions: string | null;
  securityCode: string;
  pdfUrl: string | null;
  isValid: boolean;
  expiresAt: string | null;
  createdAt: string;
  consultation?: {
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      birthDate?: string;
    };
    user: {
      id: string;
      firstName: string;
      lastName: string;
      specialty?: string;
      licenseNumber?: string;
    };
  };
}

export interface PrescriptionVerification {
  valid: boolean;
  message?: string;
  prescription?: {
    id: string;
    createdAt: string;
    patient: string;
    doctor: string;
    licenseNumber: string | null;
  };
}

// Prescription API functions
export const prescriptionsApi = {
  getAll: (token: string, params?: { consultationId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.consultationId) searchParams.set('consultationId', params.consultationId);

    const query = searchParams.toString();
    return apiFetch<Prescription[]>(`/prescriptions${query ? `?${query}` : ''}`, { token });
  },

  getById: (token: string, id: string) => apiFetch<Prescription>(`/prescriptions/${id}`, { token }),

  create: (
    token: string,
    data: {
      consultationId: string;
      medications: MedicationItem[];
      diagnosis?: string;
      instructions?: string;
      expiresAt?: string;
    }
  ) =>
    apiFetch<Prescription>('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  getPdfUrl: (id: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return `${API_URL}/prescriptions/${id}/pdf`;
  },

  invalidate: (token: string, id: string) =>
    apiFetch<Prescription>(`/prescriptions/${id}/invalidate`, {
      method: 'PATCH',
      token,
    }),

  verify: (code: string) => apiFetch<PrescriptionVerification>(`/prescriptions/verify/${code}`),
};

// Billing types
export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  code: string | null;
  satCode: string | null;
  price: number;
  currency: string;
  duration: number | null;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  serviceId: string | null;
  service?: Service;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  patientId: string;
  patient?: Patient;
  invoiceNumber: string;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'PARTIAL' | 'CANCELLED' | 'OVERDUE';
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  notes: string | null;
  items: InvoiceItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER';
  reference: string | null;
  paidAt: string;
  notes: string | null;
  createdAt: string;
}

export interface InvoicesResponse {
  data: Invoice[];
  total: number;
  page: number;
  limit: number;
}

export interface ServicesResponse {
  data: Service[];
  total: number;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalPending: number;
  totalOverdue: number;
  invoiceCount: number;
  paidCount: number;
  pendingCount: number;
}

// Billing API functions
export const billingApi = {
  // Services
  getServices: (token: string, params?: { category?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return apiFetch<ServicesResponse>(`/billing/services${query ? `?${query}` : ''}`, { token });
  },

  getService: (token: string, id: string) =>
    apiFetch<Service>(`/billing/services/${id}`, { token }),

  createService: (token: string, data: Partial<Service>) =>
    apiFetch<Service>('/billing/services', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  updateService: (token: string, id: string, data: Partial<Service>) =>
    apiFetch<Service>(`/billing/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  deleteService: (token: string, id: string) =>
    apiFetch<void>(`/billing/services/${id}`, {
      method: 'DELETE',
      token,
    }),

  // Invoices
  getInvoices: (
    token: string,
    params?: {
      status?: string;
      patientId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.patientId) searchParams.set('patientId', params.patientId);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return apiFetch<InvoicesResponse>(`/billing/invoices${query ? `?${query}` : ''}`, { token });
  },

  getInvoice: (token: string, id: string) =>
    apiFetch<Invoice>(`/billing/invoices/${id}`, { token }),

  createInvoice: (
    token: string,
    data: {
      patientId: string;
      dueDate?: string;
      notes?: string;
      items: Array<{
        serviceId?: string;
        description: string;
        quantity: number;
        unitPrice: number;
        discount?: number;
      }>;
    }
  ) =>
    apiFetch<Invoice>('/billing/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  updateInvoice: (token: string, id: string, data: Partial<Invoice>) =>
    apiFetch<Invoice>(`/billing/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  cancelInvoice: (token: string, id: string) =>
    apiFetch<Invoice>(`/billing/invoices/${id}/cancel`, {
      method: 'POST',
      token,
    }),

  // Payments
  addPayment: (
    token: string,
    invoiceId: string,
    data: {
      amount: number;
      method: 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER';
      reference?: string;
      notes?: string;
    }
  ) =>
    apiFetch<Payment>(`/billing/invoices/${invoiceId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  // Reports
  getFinancialSummary: (token: string, params?: { startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    const query = searchParams.toString();
    return apiFetch<FinancialSummary>(`/billing/reports/summary${query ? `?${query}` : ''}`, {
      token,
    });
  },
};

// Settings types
export interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  specialty: string | null;
  licenseNumber: string | null;
  phone: string | null;
  bio: string | null;
}

export interface TenantSettings {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  schedule: Record<string, { open: string; close: string; enabled: boolean }> | null;
  settings: Record<string, unknown> | null;
}

// Settings API functions
export const settingsApi = {
  // User profile
  getProfile: (token: string) => apiFetch<UserProfile>('/auth/me', { token }),

  updateProfile: (token: string, data: Partial<UserProfile>) =>
    apiFetch<UserProfile>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  // Tenant settings
  getTenant: (token: string) => apiFetch<TenantSettings>('/auth/tenant', { token }),

  updateTenant: (token: string, data: Partial<TenantSettings>) =>
    apiFetch<TenantSettings>('/auth/tenant', {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),
};
