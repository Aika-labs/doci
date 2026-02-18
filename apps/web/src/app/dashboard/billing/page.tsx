'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthCompat as useAuth } from '@/hooks/useAuthCompat';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Plus,
  Search,
  Filter,
  FileText,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Loader2,
  CreditCard,
  Banknote,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import { billingApi, Invoice, Service, FinancialSummary } from '@/lib/api';
import { useToast } from '@/components/ui';
import { BillingSkeleton } from '@/components/Skeleton';

type TabType = 'invoices' | 'services';
type StatusFilter = 'ALL' | 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';

export default function BillingPage() {
  const { getToken } = useAuth();
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = (await getToken()) || 'demo-token';

      const [invoicesRes, servicesRes, summaryRes] = await Promise.all([
        billingApi.getInvoices(token, {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        }),
        billingApi.getServices(token),
        billingApi.getFinancialSummary(token),
      ]);

      setInvoices(invoicesRes.data || []);
      setServices(servicesRes.data || []);
      setSummary(summaryRes);
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddPayment = async (
    invoiceId: string,
    amount: number,
    method: 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER'
  ) => {
    try {
      const token = (await getToken()) || 'demo-token';

      await billingApi.addPayment(token, invoiceId, { amount, method });
      success('Pago registrado', 'El pago ha sido registrado correctamente');
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      fetchData();
    } catch {
      showError('Error', 'No se pudo registrar el pago');
    }
  };

  const handleCancelInvoice = async (invoiceId: string) => {
    try {
      const token = (await getToken()) || 'demo-token';

      await billingApi.cancelInvoice(token, invoiceId);
      success('Factura cancelada', 'La factura ha sido cancelada');
      fetchData();
    } catch {
      showError('Error', 'No se pudo cancelar la factura');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { bg: string; text: string; icon: React.ReactNode; label: string }
    > = {
      DRAFT: {
        bg: 'bg-white/[0.06]',
        text: 'text-white/70',
        icon: <FileText className="h-3 w-3" />,
        label: 'Borrador',
      },
      PENDING: {
        bg: 'bg-amber-500/15',
        text: 'text-amber-300',
        icon: <Clock className="h-3 w-3" />,
        label: 'Pendiente',
      },
      PAID: {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-300',
        icon: <CheckCircle className="h-3 w-3" />,
        label: 'Pagada',
      },
      PARTIAL: {
        bg: 'bg-blue-500/15',
        text: 'text-blue-300',
        icon: <DollarSign className="h-3 w-3" />,
        label: 'Parcial',
      },
      OVERDUE: {
        bg: 'bg-red-500/15',
        text: 'text-red-300',
        icon: <AlertTriangle className="h-3 w-3" />,
        label: 'Vencida',
      },
      CANCELLED: {
        bg: 'bg-white/[0.06]',
        text: 'text-white/40',
        icon: <XCircle className="h-3 w-3" />,
        label: 'Cancelada',
      },
    };
    const c = config[status] || config.PENDING;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${c.bg} ${c.text}`}
      >
        {c.icon}
        {c.label}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Filter invoices by search
  const filteredInvoices = invoices.filter((inv) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const patientName = inv.patient
      ? `${inv.patient.firstName} ${inv.patient.lastName}`.toLowerCase()
      : '';
    return patientName.includes(search) || inv.invoiceNumber.toLowerCase().includes(search);
  });

  // Filter services by search
  const filteredServices = services.filter((svc) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      svc.name.toLowerCase().includes(search) || (svc.code?.toLowerCase().includes(search) ?? false)
    );
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Facturación</h1>
          <p className="text-white/50">Gestiona facturas, servicios y pagos</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'invoices' ? (
            <Link
              href="/dashboard/billing/new"
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white transition-colors hover:from-blue-600 hover:to-cyan-600"
            >
              <Plus className="h-4 w-4" />
              Nueva Factura
            </Link>
          ) : (
            <button
              onClick={() => setShowServiceModal(true)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white transition-colors hover:from-blue-600 hover:to-cyan-600"
            >
              <Plus className="h-4 w-4" />
              Nuevo Servicio
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-white/40">Ingresos</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(summary.totalRevenue)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-white/40">Pendiente</p>
                <p className="text-xl font-bold text-amber-400">
                  {formatCurrency(summary.totalPending)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/15">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-white/40">Vencido</p>
                <p className="text-xl font-bold text-red-400">
                  {formatCurrency(summary.totalOverdue)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/15">
                <Receipt className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-white/40">Facturas</p>
                <p className="text-xl font-bold text-white">{summary.invoiceCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex w-fit items-center gap-1 rounded-2xl bg-white/[0.06] p-1">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'invoices'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <FileText className="mr-2 inline h-4 w-4" />
          Facturas
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'services'
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <Banknote className="mr-2 inline h-4 w-4" />
          Servicios
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'invoices' ? 'Buscar por paciente o número...' : 'Buscar servicio...'
            }
            className="w-full rounded-2xl border border-white/[0.08] py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        {activeTab === 'invoices' && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-2xl border px-4 py-2 transition-colors ${
              showFilters || statusFilter !== 'ALL'
                ? 'border-blue-500 bg-blue-50 text-blue-300'
                : 'border-white/[0.08] text-white/70 hover:bg-white/[0.02]'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {statusFilter !== 'ALL' && <span className="h-2 w-2 rounded-full bg-blue-600" />}
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && activeTab === 'invoices' && (
        <div className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <label className="mb-2 block text-sm font-medium text-white/70">Estado</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'ALL', label: 'Todos' },
              { value: 'PENDING', label: 'Pendientes' },
              { value: 'PAID', label: 'Pagadas' },
              { value: 'PARTIAL', label: 'Parciales' },
              { value: 'OVERDUE', label: 'Vencidas' },
              { value: 'CANCELLED', label: 'Canceladas' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value as StatusFilter)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  statusFilter === option.value
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    : 'bg-white/[0.06] text-white/70 hover:bg-white/10'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <BillingSkeleton />
      ) : activeTab === 'invoices' ? (
        /* Invoices List */
        filteredInvoices.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] py-12 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-white/20" />
            <p className="mb-4 text-white/40">
              {searchTerm || statusFilter !== 'ALL'
                ? 'No se encontraron facturas'
                : 'No hay facturas'}
            </p>
            {!searchTerm && statusFilter === 'ALL' && (
              <Link
                href="/dashboard/billing/new"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white hover:from-blue-600 hover:to-cyan-600"
              >
                <Plus className="h-4 w-4" />
                Crear primera factura
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03]">
            <table className="w-full">
              <thead className="bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">
                    Factura
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">
                    Paciente
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium text-white/40 uppercase md:table-cell">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{invoice.invoiceNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      {invoice.patient ? (
                        <Link
                          href={`/patients/${invoice.patient.id}`}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {invoice.patient.firstName} {invoice.patient.lastName}
                        </Link>
                      ) : (
                        <span className="text-white/40">-</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <p className="text-sm text-white/40">
                        {format(new Date(invoice.issueDate), 'd MMM yyyy', { locale: es })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </p>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(invoice.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(invoice.status === 'PENDING' ||
                          invoice.status === 'PARTIAL' ||
                          invoice.status === 'OVERDUE') && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowPaymentModal(true);
                            }}
                            className="rounded-2xl p-2 text-emerald-400 hover:bg-green-50"
                            title="Registrar pago"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                        )}
                        {invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
                          <button
                            onClick={() => handleCancelInvoice(invoice.id)}
                            className="rounded-2xl p-2 text-red-400 hover:bg-red-50"
                            title="Cancelar factura"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <Link
                          href={`/billing/${invoice.id}`}
                          className="rounded-2xl p-2 text-white/50 hover:bg-white/[0.06]"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : /* Services List */
      filteredServices.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] py-12 text-center">
          <Banknote className="mx-auto mb-3 h-12 w-12 text-white/20" />
          <p className="mb-4 text-white/40">
            {searchTerm ? 'No se encontraron servicios' : 'No hay servicios'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowServiceModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white hover:from-blue-600 hover:to-cyan-600"
            >
              <Plus className="h-4 w-4" />
              Crear primer servicio
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-white">{service.name}</h3>
                  {service.code && <p className="text-xs text-white/40">Código: {service.code}</p>}
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    service.isActive
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-white/[0.06] text-white/40'
                  }`}
                >
                  {service.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {service.description && (
                <p className="mt-2 line-clamp-2 text-sm text-white/50">{service.description}</p>
              )}
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <p className="text-lg font-bold text-white">
                  {formatCurrency(service.price, service.currency)}
                </p>
                {service.duration && (
                  <p className="text-sm text-white/40">{service.duration} min</p>
                )}
              </div>
              {service.category && (
                <span className="mt-2 inline-block rounded bg-white/[0.06] px-2 py-1 text-xs text-white/50">
                  {service.category}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInvoice(null);
          }}
          onSubmit={handleAddPayment}
        />
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <ServiceModal
          onClose={() => setShowServiceModal(false)}
          onSuccess={() => {
            setShowServiceModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// Payment Modal Component
function PaymentModal({
  invoice,
  onClose,
  onSubmit,
}: {
  invoice: Invoice;
  onClose: () => void;
  onSubmit: (
    invoiceId: string,
    amount: number,
    method: 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER'
  ) => void;
}) {
  const [amount, setAmount] = useState(
    invoice.total - (invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0)
  );
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER'>('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(invoice.id, amount, method);
    setIsSubmitting(false);
  };

  const paidAmount = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const pendingAmount = invoice.total - paidAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#162633] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Registrar Pago</h2>

        <div className="mb-4 rounded-2xl bg-white/[0.02] p-4">
          <p className="text-sm text-white/40">Factura: {invoice.invoiceNumber}</p>
          <p className="text-lg font-bold text-white">
            Pendiente:{' '}
            {new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: invoice.currency,
            }).format(pendingAmount)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Monto</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={pendingAmount}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:ring-2 focus:ring-[#a8d944]/20"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Método de pago</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as typeof method)}
              className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:ring-2 focus:ring-[#a8d944]/20"
            >
              <option value="CASH">Efectivo</option>
              <option value="CARD">Tarjeta</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="CHECK">Cheque</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-white/10 px-4 py-2 text-white/70 hover:bg-white/[0.06]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-2xl bg-[#a8d944] px-4 py-2 font-medium text-[#0F1E29] hover:bg-[#a8d944]/90 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Service Modal Component
function ServiceModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { getToken } = useAuth();
  const { success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    price: '',
    duration: '',
    category: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = (await getToken()) || 'demo-token';

      await billingApi.createService(token, {
        name: formData.name,
        description: formData.description || null,
        code: formData.code || null,
        price: parseFloat(formData.price),
        duration: formData.duration ? parseInt(formData.duration) : null,
        category: formData.category || null,
      });

      success('Servicio creado', 'El servicio ha sido creado correctamente');
      onSuccess();
    } catch {
      showError('Error', 'No se pudo crear el servicio');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#162633] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Nuevo Servicio</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Nombre *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:ring-2 focus:ring-[#a8d944]/20"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:ring-2 focus:ring-[#a8d944]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-white/70">Código</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:ring-2 focus:ring-[#a8d944]/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-white/70">Precio *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:ring-2 focus:ring-[#a8d944]/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-white/70">Duración (min)</label>
              <input
                type="number"
                min="0"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:ring-2 focus:ring-[#a8d944]/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-white/70">Categoría</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:ring-2 focus:ring-[#a8d944]/20"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-white/10 px-4 py-2 text-white/70 hover:bg-white/[0.06]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-2xl bg-[#a8d944] px-4 py-2 font-medium text-[#0F1E29] hover:bg-[#a8d944]/90 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
