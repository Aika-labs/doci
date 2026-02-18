'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthCompat as useAuth, useUserCompat as useUser } from '@/hooks/useAuthCompat';
import {
  Building2,
  User,
  Bell,
  Shield,
  Palette,
  Save,
  Loader2,
  PenTool,
  Upload,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/components/ui';
import { useTheme } from '@/components/ThemeProvider';
import { settingsApi, UserProfile, TenantSettings } from '@/lib/api';

type SettingsTab = 'profile' | 'clinic' | 'signature' | 'notifications' | 'security' | 'appearance';

export default function SettingsPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<TenantSettings | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = (await getToken()) || 'demo-token';

      const [profileRes, tenantRes] = await Promise.allSettled([
        settingsApi.getProfile(token),
        settingsApi.getTenant(token),
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value);
      }
      if (tenantRes.status === 'fulfilled') {
        setTenant(tenantRes.value);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = [
    { id: 'profile' as const, label: 'Perfil', icon: User },
    { id: 'clinic' as const, label: 'Clínica', icon: Building2 },
    { id: 'signature' as const, label: 'Firma y Sello', icon: PenTool },
    { id: 'notifications' as const, label: 'Notificaciones', icon: Bell },
    { id: 'security' as const, label: 'Seguridad', icon: Shield },
    { id: 'appearance' as const, label: 'Apariencia', icon: Palette },
  ];

  const handleSaveProfile = async (data: Partial<UserProfile>) => {
    setIsSaving(true);
    try {
      const token = (await getToken()) || 'demo-token';

      const updated = await settingsApi.updateProfile(token, data);
      setProfile(updated);
      success('Perfil actualizado', 'Los cambios han sido guardados correctamente');
    } catch {
      showError('Error', 'No se pudo guardar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTenant = async (data: Partial<TenantSettings>) => {
    setIsSaving(true);
    try {
      const token = (await getToken()) || 'demo-token';

      const updated = await settingsApi.updateTenant(token, data);
      setTenant(updated);
      success('Clínica actualizada', 'Los cambios han sido guardados correctamente');
    } catch {
      showError('Error', 'No se pudo guardar la configuración de la clínica');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLocal = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    success('Configuración guardada', 'Los cambios han sido aplicados correctamente');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#a8d944]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-white/50">Administra tu perfil y preferencias</p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Tabs sidebar */}
        <div className="flex-shrink-0 md:w-48">
          <nav className="flex gap-1 md:flex-col">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#a8d944]/15 text-[#a8d944]'
                    : 'text-white/50 hover:bg-white/[0.06]'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-6">
          {activeTab === 'profile' && (
            <ProfileSettings
              user={user}
              profile={profile}
              onSave={handleSaveProfile}
              isSaving={isSaving}
            />
          )}
          {activeTab === 'clinic' && (
            <ClinicSettings tenant={tenant} onSave={handleSaveTenant} isSaving={isSaving} />
          )}
          {activeTab === 'signature' && (
            <SignatureStampSettings
              profile={profile}
              onSave={handleSaveProfile}
              isSaving={isSaving}
            />
          )}
          {activeTab === 'notifications' && (
            <NotificationSettings onSave={handleSaveLocal} isSaving={isSaving} />
          )}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'appearance' && (
            <AppearanceSettings onSave={handleSaveLocal} isSaving={isSaving} />
          )}
        </div>
      </div>
    </div>
  );
}

interface ProfileSettingsProps {
  user: ReturnType<typeof useUser>['user'];
  profile: UserProfile | null;
  onSave: (data: Partial<UserProfile>) => Promise<void>;
  isSaving: boolean;
}

function ProfileSettings({ user, profile, onSave, isSaving }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || user?.firstName || '',
    lastName: profile?.lastName || user?.lastName || '',
    specialty: profile?.specialty || '',
    licenseNumber: profile?.licenseNumber || '',
    phone: profile?.phone || '',
    bio: profile?.bio || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="mb-4 text-lg font-semibold text-white">Información del perfil</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Nombre</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Apellido</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Especialidad</label>
            <select
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
            >
              <option value="">Seleccionar...</option>
              <option value="general">Medicina General</option>
              <option value="pediatria">Pediatría</option>
              <option value="ginecologia">Ginecología</option>
              <option value="cardiologia">Cardiología</option>
              <option value="dermatologia">Dermatología</option>
              <option value="neurologia">Neurología</option>
              <option value="psiquiatria">Psiquiatría</option>
              <option value="traumatologia">Traumatología</option>
              <option value="oftalmologia">Oftalmología</option>
              <option value="otorrinolaringologia">Otorrinolaringología</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">
              Cédula Profesional
            </label>
            <input
              type="text"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              placeholder="Ej: 12345678"
              className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-white/70">Teléfono</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+52 55 1234 5678"
            className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-white/70">Biografía</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            placeholder="Breve descripción profesional..."
            className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-2xl bg-[#a8d944] px-4 py-2 font-medium text-[#0F1E29] hover:bg-[#a8d944]/90 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </form>
  );
}

interface ClinicSettingsProps {
  tenant: TenantSettings | null;
  onSave: (data: Partial<TenantSettings>) => Promise<void>;
  isSaving: boolean;
}

function ClinicSettings({ tenant, onSave, isSaving }: ClinicSettingsProps) {
  const defaultSchedule = {
    monday: { open: '09:00', close: '18:00', enabled: true },
    tuesday: { open: '09:00', close: '18:00', enabled: true },
    wednesday: { open: '09:00', close: '18:00', enabled: true },
    thursday: { open: '09:00', close: '18:00', enabled: true },
    friday: { open: '09:00', close: '18:00', enabled: true },
    saturday: { open: '09:00', close: '14:00', enabled: false },
    sunday: { open: '09:00', close: '14:00', enabled: false },
  };

  const [formData, setFormData] = useState({
    name: tenant?.name || '',
    address: tenant?.address || '',
    city: tenant?.city || '',
    state: tenant?.state || '',
    postalCode: tenant?.postalCode || '',
    phone: tenant?.phone || '',
    email: tenant?.email || '',
    website: tenant?.website || '',
    schedule: (tenant?.schedule as typeof defaultSchedule) || defaultSchedule,
  });

  const days = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ] as const;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="mb-4 text-lg font-semibold text-white">Información de la clínica</h2>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-white/70">
            Nombre de la clínica
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Clínica San Rafael"
            className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-white/70">Dirección</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Calle y número"
            className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Ciudad</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Estado</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">C.P.</label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Teléfono</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="mb-3 text-sm font-medium text-white">Horario de atención</h3>
          <div className="space-y-2">
            {days.map((day) => (
              <div key={day.key} className="flex items-center gap-4">
                <label className="flex w-28 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.schedule[day.key].enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        schedule: {
                          ...formData.schedule,
                          [day.key]: { ...formData.schedule[day.key], enabled: e.target.checked },
                        },
                      })
                    }
                    className="rounded border-white/10 text-[#a8d944] focus:ring-[#a8d944]/20"
                  />
                  <span className="text-sm text-white/70">{day.label}</span>
                </label>
                {formData.schedule[day.key].enabled && (
                  <>
                    <input
                      type="time"
                      value={formData.schedule[day.key].open}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          schedule: {
                            ...formData.schedule,
                            [day.key]: { ...formData.schedule[day.key], open: e.target.value },
                          },
                        })
                      }
                      className="rounded border border-white/10 bg-[#0F1E29] px-2 py-1 text-sm text-white"
                    />
                    <span className="text-white/40">a</span>
                    <input
                      type="time"
                      value={formData.schedule[day.key].close}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          schedule: {
                            ...formData.schedule,
                            [day.key]: { ...formData.schedule[day.key], close: e.target.value },
                          },
                        })
                      }
                      className="rounded border border-white/10 bg-[#0F1E29] px-2 py-1 text-sm text-white"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-2xl bg-[#a8d944] px-4 py-2 font-medium text-[#0F1E29] hover:bg-[#a8d944]/90 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </form>
  );
}

interface LocalSettingsProps {
  onSave: () => Promise<void>;
  isSaving: boolean;
}

function NotificationSettings({ onSave, isSaving }: LocalSettingsProps) {
  const [settings, setSettings] = useState({
    emailAppointmentReminder: true,
    emailNewPatient: true,
    emailWeeklySummary: false,
    pushAppointmentReminder: true,
    pushNewMessage: true,
    smsAppointmentReminder: false,
    reminderTime: '24',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save to backend when endpoint is available
    onSave();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="mb-4 text-lg font-semibold text-white">Preferencias de notificaciones</h2>

      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-medium text-white">Notificaciones por email</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.emailAppointmentReminder}
                onChange={(e) =>
                  setSettings({ ...settings, emailAppointmentReminder: e.target.checked })
                }
                className="rounded border-white/10 text-[#a8d944] focus:ring-[#a8d944]/20"
              />
              <span className="text-sm text-white/70">Recordatorios de citas</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.emailNewPatient}
                onChange={(e) => setSettings({ ...settings, emailNewPatient: e.target.checked })}
                className="rounded border-white/10 text-[#a8d944] focus:ring-[#a8d944]/20"
              />
              <span className="text-sm text-white/70">Nuevos pacientes registrados</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.emailWeeklySummary}
                onChange={(e) => setSettings({ ...settings, emailWeeklySummary: e.target.checked })}
                className="rounded border-white/10 text-[#a8d944] focus:ring-[#a8d944]/20"
              />
              <span className="text-sm text-white/70">Resumen semanal de actividad</span>
            </label>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="mb-3 text-sm font-medium text-white">Notificaciones push</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.pushAppointmentReminder}
                onChange={(e) =>
                  setSettings({ ...settings, pushAppointmentReminder: e.target.checked })
                }
                className="rounded border-white/10 text-[#a8d944] focus:ring-[#a8d944]/20"
              />
              <span className="text-sm text-white/70">Recordatorios de citas próximas</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.pushNewMessage}
                onChange={(e) => setSettings({ ...settings, pushNewMessage: e.target.checked })}
                className="rounded border-white/10 text-[#a8d944] focus:ring-[#a8d944]/20"
              />
              <span className="text-sm text-white/70">Nuevos mensajes</span>
            </label>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="mb-3 text-sm font-medium text-white">Tiempo de recordatorio</h3>
          <select
            value={settings.reminderTime}
            onChange={(e) => setSettings({ ...settings, reminderTime: e.target.value })}
            className="rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
          >
            <option value="1">1 hora antes</option>
            <option value="2">2 horas antes</option>
            <option value="24">1 día antes</option>
            <option value="48">2 días antes</option>
          </select>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-2xl bg-[#a8d944] px-4 py-2 font-medium text-[#0F1E29] hover:bg-[#a8d944]/90 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </form>
  );
}

function SecuritySettings() {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-white">Seguridad</h2>

      <div className="space-y-6">
        <div className="rounded-2xl bg-white/[0.02] p-4">
          <h3 className="mb-2 text-sm font-medium text-white">Cambiar contraseña</h3>
          <p className="mb-3 text-sm text-white/50">
            La gestión de contraseña se realiza a través de tu cuenta de Clerk.
          </p>
          <a
            href="https://accounts.clerk.dev/user"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/[0.06]"
          >
            Gestionar cuenta
          </a>
        </div>

        <div className="rounded-2xl bg-white/[0.02] p-4">
          <h3 className="mb-2 text-sm font-medium text-white">Autenticación de dos factores</h3>
          <p className="mb-3 text-sm text-white/50">
            Añade una capa extra de seguridad a tu cuenta.
          </p>
          <a
            href="https://accounts.clerk.dev/user/security"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/[0.06]"
          >
            Configurar 2FA
          </a>
        </div>

        <div className="rounded-2xl bg-white/[0.02] p-4">
          <h3 className="mb-2 text-sm font-medium text-white">Sesiones activas</h3>
          <p className="mb-3 text-sm text-white/50">
            Revisa y gestiona los dispositivos donde has iniciado sesión.
          </p>
          <a
            href="https://accounts.clerk.dev/user/security"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/[0.06]"
          >
            Ver sesiones
          </a>
        </div>
      </div>
    </div>
  );
}

interface SignatureStampSettingsProps {
  profile: UserProfile | null;
  onSave: (data: Partial<UserProfile>) => Promise<void>;
  isSaving: boolean;
}

function SignatureStampSettings({ profile, onSave, isSaving }: SignatureStampSettingsProps) {
  const [signaturePreview, setSignaturePreview] = useState<string | null>(
    profile?.signatureUrl || null
  );
  const [stampPreview, setStampPreview] = useState<string | null>(profile?.logoUrl || null);
  const [isProcessing, setIsProcessing] = useState(false);

  const convertToBlackAndWhite = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = () => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas not supported'));

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Convert to grayscale with threshold for B&W
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            const bw = gray > 128 ? 255 : 0;
            data[i] = bw;
            data[i + 1] = bw;
            data[i + 2] = bw;
            // Keep alpha channel
          }

          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'signature' | 'stamp'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const bwDataUrl = await convertToBlackAndWhite(file);
      if (type === 'signature') {
        setSignaturePreview(bwDataUrl);
      } else {
        setStampPreview(bwDataUrl);
      }
    } catch {
      console.error('Error processing image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    const data: Partial<UserProfile> = {};
    if (signaturePreview) data.signatureUrl = signaturePreview;
    if (stampPreview) data.logoUrl = stampPreview;
    onSave(data);
  };

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-white">Firma y Sello Digital</h2>
      <p className="mb-6 text-sm text-white/40">
        Sube tu firma y sello para incluirlos en recetas y documentos. Las imágenes se convierten
        automáticamente a blanco y negro.
      </p>

      <div className="space-y-6">
        {/* Signature */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
            <PenTool className="h-4 w-4 text-[#a8d944]" />
            Firma del Doctor
          </h3>

          {signaturePreview ? (
            <div className="mb-3">
              <div className="inline-block rounded-xl border border-white/10 bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signaturePreview}
                  alt="Firma"
                  className="max-h-24 max-w-[200px] object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => setSignaturePreview(null)}
                className="ml-3 inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </button>
            </div>
          ) : (
            <div className="mb-3 rounded-xl border-2 border-dashed border-white/10 p-8 text-center">
              <PenTool className="mx-auto mb-2 h-8 w-8 text-white/20" />
              <p className="text-sm text-white/30">No hay firma cargada</p>
            </div>
          )}

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/[0.06]">
            <Upload className="h-4 w-4" />
            {signaturePreview ? 'Cambiar firma' : 'Subir firma'}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'signature')}
              className="hidden"
            />
          </label>
        </div>

        {/* Stamp */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
            <Shield className="h-4 w-4 text-[#a8d944]" />
            Sello Profesional
          </h3>

          {stampPreview ? (
            <div className="mb-3">
              <div className="inline-block rounded-xl border border-white/10 bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={stampPreview}
                  alt="Sello"
                  className="max-h-32 max-w-[200px] object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => setStampPreview(null)}
                className="ml-3 inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </button>
            </div>
          ) : (
            <div className="mb-3 rounded-xl border-2 border-dashed border-white/10 p-8 text-center">
              <Shield className="mx-auto mb-2 h-8 w-8 text-white/20" />
              <p className="text-sm text-white/30">No hay sello cargado</p>
            </div>
          )}

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/[0.06]">
            <Upload className="h-4 w-4" />
            {stampPreview ? 'Cambiar sello' : 'Subir sello'}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'stamp')}
              className="hidden"
            />
          </label>
        </div>

        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            Procesando imagen...
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || (!signaturePreview && !stampPreview)}
            className="flex items-center gap-2 rounded-2xl bg-[#a8d944] px-4 py-2 font-medium text-[#0F1E29] hover:bg-[#a8d944]/90 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar firma y sello
          </button>
        </div>
      </div>
    </div>
  );
}

function AppearanceSettings({ onSave, isSaving }: LocalSettingsProps) {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({
    compactMode: false,
    language: 'es',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="mb-4 text-lg font-semibold text-white">Apariencia</h2>

      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-medium text-white">Tema</h3>
          <div className="flex gap-3">
            {[
              { value: 'light' as const, label: 'Claro' },
              { value: 'dark' as const, label: 'Oscuro' },
              { value: 'system' as const, label: 'Sistema' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
                  theme === option.value
                    ? 'border-[#a8d944]/30 bg-[#a8d944]/15 text-[#a8d944]'
                    : 'border-white/10 text-white/70 hover:bg-white/[0.06]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="mb-3 text-sm font-medium text-white">Idioma</h3>
          <select
            value={settings.language}
            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            className="rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:border-[#a8d944]/40 focus:ring-2 focus:ring-[#a8d944]/20"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
          </select>
        </div>

        <div className="border-t pt-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.compactMode}
              onChange={(e) => setSettings({ ...settings, compactMode: e.target.checked })}
              className="rounded border-white/10 text-[#a8d944] focus:ring-[#a8d944]/20"
            />
            <div>
              <span className="text-sm font-medium text-white">Modo compacto</span>
              <p className="text-xs text-white/40">
                Reduce el espaciado para mostrar más información
              </p>
            </div>
          </label>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-2xl bg-[#a8d944] px-4 py-2 font-medium text-[#0F1E29] hover:bg-[#a8d944]/90 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </form>
  );
}
