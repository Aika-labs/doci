'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Building2, User, Bell, Shield, Palette, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui';

type SettingsTab = 'profile' | 'clinic' | 'notifications' | 'security' | 'appearance';

export default function SettingsPage() {
  const { user } = useUser();
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { id: 'profile' as const, label: 'Perfil', icon: User },
    { id: 'clinic' as const, label: 'Clínica', icon: Building2 },
    { id: 'notifications' as const, label: 'Notificaciones', icon: Bell },
    { id: 'security' as const, label: 'Seguridad', icon: Shield },
    { id: 'appearance' as const, label: 'Apariencia', icon: Palette },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    success('Configuración guardada', 'Los cambios han sido aplicados correctamente');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600">Administra tu perfil y preferencias</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tabs sidebar */}
        <div className="md:w-48 flex-shrink-0">
          <nav className="flex md:flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6">
          {activeTab === 'profile' && (
            <ProfileSettings user={user} onSave={handleSave} isSaving={isSaving} />
          )}
          {activeTab === 'clinic' && (
            <ClinicSettings onSave={handleSave} isSaving={isSaving} />
          )}
          {activeTab === 'notifications' && (
            <NotificationSettings onSave={handleSave} isSaving={isSaving} />
          )}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'appearance' && (
            <AppearanceSettings onSave={handleSave} isSaving={isSaving} />
          )}
        </div>
      </div>
    </div>
  );
}

interface SettingsProps {
  onSave: () => Promise<void>;
  isSaving: boolean;
}

function ProfileSettings({ user, onSave, isSaving }: SettingsProps & { user: ReturnType<typeof useUser>['user'] }) {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    specialty: '',
    licenseNumber: '',
    phone: '',
    bio: '',
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del perfil</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
            <select
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Cédula Profesional</label>
            <input
              type="text"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              placeholder="Ej: 12345678"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+52 55 1234 5678"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Biografía</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            placeholder="Breve descripción profesional..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="pt-4">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

function ClinicSettings({ onSave, isSaving }: SettingsProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    website: '',
    schedule: {
      monday: { open: '09:00', close: '18:00', enabled: true },
      tuesday: { open: '09:00', close: '18:00', enabled: true },
      wednesday: { open: '09:00', close: '18:00', enabled: true },
      thursday: { open: '09:00', close: '18:00', enabled: true },
      friday: { open: '09:00', close: '18:00', enabled: true },
      saturday: { open: '09:00', close: '14:00', enabled: false },
      sunday: { open: '09:00', close: '14:00', enabled: false },
    },
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

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de la clínica</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la clínica</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Clínica San Rafael"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Calle y número"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">C.P.</label>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Horario de atención</h3>
          <div className="space-y-2">
            {days.map((day) => (
              <div key={day.key} className="flex items-center gap-4">
                <label className="flex items-center gap-2 w-28">
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
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{day.label}</span>
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
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-gray-500">a</span>
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
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationSettings({ onSave, isSaving }: SettingsProps) {
  const [settings, setSettings] = useState({
    emailAppointmentReminder: true,
    emailNewPatient: true,
    emailWeeklySummary: false,
    pushAppointmentReminder: true,
    pushNewMessage: true,
    smsAppointmentReminder: false,
    reminderTime: '24',
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferencias de notificaciones</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Notificaciones por email</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.emailAppointmentReminder}
                onChange={(e) => setSettings({ ...settings, emailAppointmentReminder: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Recordatorios de citas</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.emailNewPatient}
                onChange={(e) => setSettings({ ...settings, emailNewPatient: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Nuevos pacientes registrados</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.emailWeeklySummary}
                onChange={(e) => setSettings({ ...settings, emailWeeklySummary: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Resumen semanal de actividad</span>
            </label>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Notificaciones push</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.pushAppointmentReminder}
                onChange={(e) => setSettings({ ...settings, pushAppointmentReminder: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Recordatorios de citas próximas</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.pushNewMessage}
                onChange={(e) => setSettings({ ...settings, pushNewMessage: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Nuevos mensajes</span>
            </label>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Tiempo de recordatorio</h3>
          <select
            value={settings.reminderTime}
            onChange={(e) => setSettings({ ...settings, reminderTime: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1">1 hora antes</option>
            <option value="2">2 horas antes</option>
            <option value="24">1 día antes</option>
            <option value="48">2 días antes</option>
          </select>
        </div>

        <div className="pt-4">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Seguridad</h2>
      
      <div className="space-y-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Cambiar contraseña</h3>
          <p className="text-sm text-gray-600 mb-3">
            La gestión de contraseña se realiza a través de tu cuenta de Clerk.
          </p>
          <a
            href="https://accounts.clerk.dev/user"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Gestionar cuenta
          </a>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Autenticación de dos factores</h3>
          <p className="text-sm text-gray-600 mb-3">
            Añade una capa extra de seguridad a tu cuenta.
          </p>
          <a
            href="https://accounts.clerk.dev/user/security"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Configurar 2FA
          </a>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Sesiones activas</h3>
          <p className="text-sm text-gray-600 mb-3">
            Revisa y gestiona los dispositivos donde has iniciado sesión.
          </p>
          <a
            href="https://accounts.clerk.dev/user/security"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Ver sesiones
          </a>
        </div>
      </div>
    </div>
  );
}

function AppearanceSettings({ onSave, isSaving }: SettingsProps) {
  const [settings, setSettings] = useState({
    theme: 'light',
    compactMode: false,
    language: 'es',
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Apariencia</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Tema</h3>
          <div className="flex gap-3">
            {[
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Oscuro' },
              { value: 'system', label: 'Sistema' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSettings({ ...settings, theme: option.value })}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  settings.theme === option.value
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Idioma</h3>
          <select
            value={settings.language}
            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Modo compacto</span>
              <p className="text-xs text-gray-500">Reduce el espaciado para mostrar más información</p>
            </div>
          </label>
        </div>

        <div className="pt-4">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
