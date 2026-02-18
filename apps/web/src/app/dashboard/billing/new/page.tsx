'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthCompat as useAuth } from '@/hooks/useAuthCompat';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { ArrowLeft, Plus, Trash2, Search, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { billingApi, patientsApi, Patient, Service } from '@/lib/api';
import { useToast } from '@/components/ui';

interface InvoiceItem {
  id: string;
  serviceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export default function NewInvoicePage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, discount: 0 },
  ]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      const [patientsRes, servicesRes] = await Promise.all([
        patientsApi.getAll(token, { limit: 100 }),
        billingApi.getServices(token),
      ]);

      setPatients(patientsRes.data || []);
      setServices(servicesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPatients = patients.filter((p) => {
    if (!patientSearch) return true;
    const search = patientSearch.toLowerCase();
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    return fullName.includes(search) || p.email?.toLowerCase().includes(search);
  });

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.firstName} ${patient.lastName}`);
    setShowPatientDropdown(false);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, discount: 0 },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleSelectService = (itemId: string, serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      setItems(
        items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                serviceId: service.id,
                description: service.name,
                unitPrice: service.price,
              }
            : item
        )
      );
    }
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unitPrice;
    return subtotal - (subtotal * item.discount) / 100;
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalDiscount = items.reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice * item.discount) / 100,
    0
  );
  const total = subtotal - totalDiscount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      showError('Error', 'Selecciona un paciente');
      return;
    }

    if (items.some((item) => !item.description || item.unitPrice <= 0)) {
      showError('Error', 'Completa todos los items de la factura');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) return;

      await billingApi.createInvoice(token, {
        patientId: selectedPatient.id,
        dueDate: new Date(dueDate).toISOString(),
        notes: notes || undefined,
        items: items.map((item) => ({
          serviceId: item.serviceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
      });

      success('Factura creada', 'La factura ha sido creada correctamente');
      router.push('/billing');
    } catch {
      showError('Error', 'No se pudo crear la factura');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/dashboard/billing"
          className="rounded-2xl p-2 transition-colors hover:bg-white/[0.06]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Nueva Factura</h1>
          <p className="text-white/50">Crea una nueva factura para un paciente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Paciente</h2>

          <div className="relative">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setShowPatientDropdown(true);
                  if (!e.target.value) setSelectedPatient(null);
                }}
                onFocus={() => setShowPatientDropdown(true)}
                placeholder="Buscar paciente..."
                className="w-full rounded-2xl border border-white/[0.08] py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {showPatientDropdown && filteredPatients.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-white/10 bg-[#0F1E29] shadow-lg">
                {filteredPatients.slice(0, 10).map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handleSelectPatient(patient)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.06]"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/15">
                      <span className="text-sm font-semibold text-blue-400">
                        {patient.firstName[0]}
                        {patient.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-sm text-white/40">{patient.email || patient.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedPatient && (
            <div className="mt-4 flex items-center gap-4 rounded-2xl bg-blue-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15">
                <User className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
                <p className="text-sm text-white/50">
                  {selectedPatient.email} • {selectedPatient.phone}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Invoice Details */}
        <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Detalles</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-white/70">
                Fecha de vencimiento
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-white/70">Notas</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales..."
                className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Conceptos</h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-blue-400 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/[0.06] p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Service selector */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-white/40">
                        Servicio (opcional)
                      </label>
                      <select
                        value={item.serviceId || ''}
                        onChange={(e) => handleSelectService(item.id, e.target.value)}
                        className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">Seleccionar servicio...</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name} - {formatCurrency(service.price)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-white/40">
                        Descripción *
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        placeholder="Descripción del concepto"
                        className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20"
                        required
                      />
                    </div>

                    {/* Quantity, Price, Discount */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-white/40">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)
                          }
                          className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-white/40">
                          Precio unitario
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                          className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-white/40">
                          Descuento %
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) =>
                            handleItemChange(item.id, 'discount', parseFloat(e.target.value) || 0)
                          }
                          className="w-full rounded-2xl border border-white/[0.08] px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(calculateItemTotal(item))}
                    </p>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="rounded-2xl p-2 text-red-400 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 space-y-2 border-t pt-6">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Subtotal</span>
              <span className="text-white">{formatCurrency(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Descuento</span>
                <span className="text-red-400">-{formatCurrency(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span className="text-white">Total</span>
              <span className="text-white">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href="/dashboard/billing"
            className="flex-1 rounded-2xl border border-white/[0.08] px-4 py-3 text-center text-white/70 hover:bg-white/[0.02]"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !selectedPatient}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 text-white hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Crear Factura'}
          </button>
        </div>
      </form>
    </div>
  );
}
