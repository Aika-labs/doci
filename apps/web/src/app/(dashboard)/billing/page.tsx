'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
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
      const token = await getToken();
      if (!token) return;

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

  const handleAddPayment = async (invoiceId: string, amount: number, method: 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER') => {
    try {
      const token = await getToken();
      if (!token) return;

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
      const token = await getToken();
      if (!token) return;

      await billingApi.cancelInvoice(token, invoiceId);
      success('Factura cancelada', 'La factura ha sido cancelada');
      fetchData();
    } catch {
      showError('Error', 'No se pudo cancelar la factura');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', icon: <FileText className="h-3 w-3" />, label: 'Borrador' },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Clock className="h-3 w-3" />, label: 'Pendiente' },
      PAID: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle className="h-3 w-3" />, label: 'Pagada' },
      PARTIAL: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <DollarSign className="h-3 w-3" />, label: 'Parcial' },
      OVERDUE: { bg: 'bg-red-100', text: 'text-red-700', icon: <AlertTriangle className="h-3 w-3" />, label: 'Vencida' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-500', icon: <XCircle className="h-3 w-3" />, label: 'Cancelada' },
    };
    const c = config[status] || config.PENDING;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
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
    const patientName = inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName}`.toLowerCase() : '';
    return patientName.includes(search) || inv.invoiceNumber.toLowerCase().includes(search);
  });

  // Filter services by search
  const filteredServices = services.filter((svc) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return svc.name.toLowerCase().includes(search) || (svc.code?.toLowerCase().includes(search) ?? false);
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="text-gray-600">Gestiona facturas, servicios y pagos</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'invoices' ? (
            <Link
              href="/billing/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nueva Factura
            </Link>
          ) : (
            <button
              onClick={() => setShowServiceModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nuevo Servicio
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ingresos</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.totalRevenue)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pendiente</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(summary.totalPending)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Vencido</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(summary.totalOverdue)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Facturas</p>
                <p className="text-xl font-bold text-gray-900">{summary.invoiceCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'invoices' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          Facturas
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'services' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Banknote className="h-4 w-4 inline mr-2" />
          Servicios
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'invoices' ? 'Buscar por paciente o número...' : 'Buscar servicio...'}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {activeTab === 'invoices' && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters || statusFilter !== 'ALL'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {statusFilter !== 'ALL' && <span className="w-2 h-2 bg-blue-600 rounded-full" />}
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && activeTab === 'invoices' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
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
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'ALL' ? 'No se encontraron facturas' : 'No hay facturas'}
            </p>
            {!searchTerm && statusFilter === 'ALL' && (
              <Link
                href="/billing/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Crear primera factura
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Factura</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      {invoice.patient ? (
                        <Link href={`/patients/${invoice.patient.id}`} className="text-blue-600 hover:text-blue-700">
                          {invoice.patient.firstName} {invoice.patient.lastName}
                        </Link>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-gray-500">
                        {format(new Date(invoice.issueDate), 'd MMM yyyy', { locale: es })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{formatCurrency(invoice.total, invoice.currency)}</p>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(invoice.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(invoice.status === 'PENDING' || invoice.status === 'PARTIAL' || invoice.status === 'OVERDUE') && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowPaymentModal(true);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Registrar pago"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                        )}
                        {invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
                          <button
                            onClick={() => handleCancelInvoice(invoice.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Cancelar factura"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <Link
                          href={`/billing/${invoice.id}`}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
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
      ) : (
        /* Services List */
        filteredServices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Banknote className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No se encontraron servicios' : 'No hay servicios'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowServiceModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Crear primer servicio
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{service.name}</h3>
                    {service.code && <p className="text-xs text-gray-500">Código: {service.code}</p>}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    service.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {service.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {service.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{service.description}</p>
                )}
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(service.price, service.currency)}
                  </p>
                  {service.duration && (
                    <p className="text-sm text-gray-500">{service.duration} min</p>
                  )}
                </div>
                {service.category && (
                  <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {service.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        )
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
  onSubmit: (invoiceId: string, amount: number, method: 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER') => void;
}) {
  const [amount, setAmount] = useState(invoice.total - (invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0));
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Registrar Pago</h2>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-500">Factura: {invoice.invoiceNumber}</p>
          <p className="text-lg font-bold text-gray-900">
            Pendiente: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: invoice.currency }).format(pendingAmount)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={pendingAmount}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as typeof method)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Service Modal Component
function ServiceModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
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
      const token = await getToken();
      if (!token) return;

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Nuevo Servicio</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duración (min)</label>
              <input
                type="number"
                min="0"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
