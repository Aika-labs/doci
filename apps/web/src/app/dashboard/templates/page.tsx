'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthCompat as useAuth } from '@/hooks/useAuthCompat';
import { mockFetch } from '@/lib/mock-data';
import {
  FileStack,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Loader2,
  X,
  FileText,
  Stethoscope,
  Pill,
  ClipboardList,
  Eye,
  Download,
  Upload,
} from 'lucide-react';
import { useToast, ConfirmDialog } from '@/components/ui';

type TemplateType = 'SOAP' | 'PRESCRIPTION' | 'REFERRAL' | 'CERTIFICATE' | 'OTHER';

interface Template {
  id: string;
  name: string;
  type: TemplateType;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const templateTypeLabels: Record<TemplateType, string> = {
  SOAP: 'Notas SOAP',
  PRESCRIPTION: 'Receta',
  REFERRAL: 'Referencia',
  CERTIFICATE: 'Certificado',
  OTHER: 'Otro',
};

const templateTypeIcons: Record<TemplateType, React.ReactNode> = {
  SOAP: <Stethoscope className="h-4 w-4" />,
  PRESCRIPTION: <Pill className="h-4 w-4" />,
  REFERRAL: <FileText className="h-4 w-4" />,
  CERTIFICATE: <ClipboardList className="h-4 w-4" />,
  OTHER: <FileStack className="h-4 w-4" />,
};

export default function TemplatesPage() {
  const { getToken } = useAuth();
  const { success, error: showError } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TemplateType | 'ALL'>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    template: Template | null;
    isDeleting: boolean;
  }>({
    open: false,
    template: null,
    isDeleting: false,
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'SOAP' as TemplateType,
    content: '',
    isDefault: false,
  });

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = (await getToken()) || 'demo-token';

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await mockFetch(`${apiUrl}/templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setTemplates(data || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      const token = await getToken();
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const url = editingTemplate
        ? `${apiUrl}/templates/${editingTemplate.id}`
        : `${apiUrl}/templates`;

      const res = await mockFetch(url, {
        method: editingTemplate ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchTemplates();
        resetForm();
        success(
          editingTemplate ? 'Plantilla actualizada' : 'Plantilla creada',
          editingTemplate ? 'Los cambios han sido guardados' : 'La plantilla está lista para usar'
        );
      } else {
        showError('Error', 'No se pudo guardar la plantilla');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      showError('Error', 'No se pudo guardar la plantilla');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.template) return;

    try {
      setDeleteConfirm((prev) => ({ ...prev, isDeleting: true }));
      const token = await getToken();
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await mockFetch(`${apiUrl}/templates/${deleteConfirm.template.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setTemplates(templates.filter((t) => t.id !== deleteConfirm.template?.id));
        success('Plantilla eliminada', 'La plantilla ha sido eliminada correctamente');
      } else {
        showError('Error', 'No se pudo eliminar la plantilla');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      showError('Error', 'No se pudo eliminar la plantilla');
    } finally {
      setDeleteConfirm({ open: false, template: null, isDeleting: false });
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      const token = await getToken();
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await mockFetch(`${apiUrl}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `${template.name} (copia)`,
          type: template.type,
          content: template.content,
          isDefault: false,
        }),
      });

      if (res.ok) {
        await fetchTemplates();
        success('Plantilla duplicada', `Se creó "${template.name} (copia)"`);
      } else {
        showError('Error', 'No se pudo duplicar la plantilla');
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      showError('Error', 'No se pudo duplicar la plantilla');
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      content: template.content,
      isDefault: template.isDefault,
    });
    setShowForm(true);
  };

  const handleExport = () => {
    const dataToExport = filteredTemplates.map((t) => ({
      name: t.name,
      type: t.type,
      content: t.content,
      isDefault: t.isDefault,
    }));
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantillas-doci-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('Plantillas exportadas', `Se exportaron ${filteredTemplates.length} plantillas`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text) as Array<{
        name: string;
        type: TemplateType;
        content: string;
        isDefault?: boolean;
      }>;

      if (!Array.isArray(imported)) {
        showError('Error', 'El archivo no tiene el formato correcto');
        return;
      }

      const token = await getToken();
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      let importedCount = 0;

      for (const template of imported) {
        if (template.name && template.type && template.content) {
          const res = await mockFetch(`${apiUrl}/templates`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: template.name,
              type: template.type,
              content: template.content,
              isDefault: template.isDefault || false,
            }),
          });
          if (res.ok) importedCount++;
        }
      }

      await fetchTemplates();
      success('Plantillas importadas', `Se importaron ${importedCount} plantillas correctamente`);
    } catch (error) {
      console.error('Error importing templates:', error);
      showError('Error', 'No se pudieron importar las plantillas');
    }

    // Reset input
    e.target.value = '';
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setFormData({
      name: '',
      type: 'SOAP',
      content: '',
      isDefault: false,
    });
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || template.type === filterType;
    return matchesSearch && matchesType;
  });

  const getDefaultContent = (type: TemplateType): string => {
    switch (type) {
      case 'SOAP':
        return `**SUBJETIVO:**
[Motivo de consulta, síntomas referidos por el paciente]

**OBJETIVO:**
[Hallazgos del examen físico, signos vitales]

**EVALUACIÓN:**
[Diagnóstico, análisis clínico]

**PLAN:**
[Tratamiento, indicaciones, seguimiento]`;
      case 'PRESCRIPTION':
        return `**DIAGNÓSTICO:**
[Diagnóstico principal]

**MEDICAMENTOS:**
1. [Medicamento] - [Dosis] - [Frecuencia] - [Duración]

**INDICACIONES:**
[Instrucciones especiales]`;
      case 'REFERRAL':
        return `**REFERENCIA MÉDICA**

Paciente: [Nombre del paciente]
Edad: [Edad]

**MOTIVO DE REFERENCIA:**
[Descripción del motivo]

**DIAGNÓSTICO PRESUNTIVO:**
[Diagnóstico]

**ESTUDIOS REALIZADOS:**
[Lista de estudios]

**TRATAMIENTO ACTUAL:**
[Medicamentos actuales]`;
      case 'CERTIFICATE':
        return `**CERTIFICADO MÉDICO**

Por medio del presente certifico que el/la paciente [NOMBRE] fue atendido/a en esta consulta el día [FECHA].

**DIAGNÓSTICO:**
[Diagnóstico]

**RECOMENDACIONES:**
[Días de reposo, restricciones, etc.]

Este certificado se expide a solicitud del interesado para los fines que estime convenientes.`;
      default:
        return '';
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Plantillas</h1>
          <p className="text-white/50">Gestiona tus plantillas médicas reutilizables</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/[0.08] px-4 py-2 text-white/70 hover:bg-white/[0.02]">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importar</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={handleExport}
            disabled={filteredTemplates.length === 0}
            className="flex items-center gap-2 rounded-2xl border border-white/[0.08] px-4 py-2 text-white/70 hover:bg-white/[0.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white hover:from-blue-600 hover:to-cyan-600"
          >
            <Plus className="h-4 w-4" />
            Nueva Plantilla
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar plantillas..."
            className="w-full rounded-2xl border border-white/[0.08] py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as TemplateType | 'ALL')}
          className="rounded-2xl border border-white/[0.08] px-4 py-2 focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="ALL">Todos los tipos</option>
          {Object.entries(templateTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="m-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-[#162633] shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h2 className="text-lg font-semibold text-white">
                {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h2>
              <button onClick={resetForm} className="p-1 text-white/30 hover:text-white/50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-white/70">
                  Nombre de la plantilla
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white placeholder:text-white/30 focus:ring-2 focus:ring-[#a8d944]/20"
                  placeholder="Ej: Consulta general"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white/70">
                  Tipo de plantilla
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value as TemplateType;
                    setFormData({
                      ...formData,
                      type: newType,
                      content: formData.content || getDefaultContent(newType),
                    });
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 text-white focus:ring-2 focus:ring-[#a8d944]/20"
                >
                  {Object.entries(templateTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-white/70">Contenido</label>
                  {!formData.content && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, content: getDefaultContent(formData.type) })
                      }
                      className="text-xs text-[#a8d944] hover:text-[#a8d944]/80"
                    >
                      Usar plantilla predeterminada
                    </button>
                  )}
                </div>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={12}
                  className="w-full rounded-2xl border border-white/10 bg-[#0F1E29] px-3 py-2 font-mono text-sm text-white placeholder:text-white/30 focus:ring-2 focus:ring-[#a8d944]/20"
                  placeholder="Escribe el contenido de la plantilla..."
                />
                <p className="mt-1 text-xs text-white/40">
                  Usa [VARIABLE] para campos que se llenarán automáticamente
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded border-white/10 text-[#a8d944] focus:ring-[#a8d944]/20"
                />
                <label htmlFor="isDefault" className="text-sm text-white/70">
                  Usar como plantilla predeterminada para este tipo
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-white/10 px-4 py-2 text-white/70 hover:bg-white/[0.06]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-2xl bg-[#a8d944] px-4 py-2 font-medium text-[#0F1E29] hover:bg-[#a8d944]/90 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Templates List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] py-12 text-center">
          <FileStack className="mx-auto mb-3 h-12 w-12 text-white/20" />
          <p className="mb-4 text-white/40">
            {searchTerm || filterType !== 'ALL'
              ? 'No se encontraron plantillas con esos filtros'
              : 'No hay plantillas creadas'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white hover:from-blue-600 hover:to-cyan-600"
          >
            <Plus className="h-4 w-4" />
            Crear primera plantilla
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
                    {templateTypeIcons[template.type]}
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{template.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">
                        {templateTypeLabels[template.type]}
                      </span>
                      {template.isDefault && (
                        <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                          Predeterminada
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="rounded p-2 text-white/30 hover:bg-white/[0.06] hover:text-white/50"
                    title="Vista previa"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="rounded p-2 text-white/30 hover:bg-white/[0.06] hover:text-white/50"
                    title="Duplicar"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="rounded p-2 text-white/30 hover:bg-blue-50 hover:text-blue-400"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ open: true, template, isDeleting: false })}
                    className="rounded p-2 text-white/30 hover:bg-red-50 hover:text-red-400"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="line-clamp-3 text-sm whitespace-pre-wrap text-white/50">
                {template.content.substring(0, 150)}
                {template.content.length > 150 && '...'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="m-4 max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-[#162633] shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#a8d944]/15 text-[#a8d944]">
                  {templateTypeIcons[previewTemplate.type]}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{previewTemplate.name}</h2>
                  <span className="text-sm text-white/40">
                    {templateTypeLabels[previewTemplate.type]}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1 text-white/30 hover:text-white/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
              <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap text-white/70">
                {previewTemplate.content}
              </pre>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/10 bg-[#0F1E29]/60 p-4">
              <button
                onClick={() => {
                  handleEdit(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="flex items-center gap-2 rounded-2xl border border-[#a8d944]/30 px-4 py-2 text-[#a8d944] hover:bg-[#a8d944]/10"
              >
                <Edit2 className="h-4 w-4" />
                Editar
              </button>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="rounded-2xl border border-white/10 px-4 py-2 text-white/70 hover:bg-white/[0.06]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onCancel={() => setDeleteConfirm({ open: false, template: null, isDeleting: false })}
        onConfirm={handleDelete}
        title="Eliminar plantilla"
        message={`¿Estás seguro de eliminar la plantilla "${deleteConfirm.template?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        isLoading={deleteConfirm.isDeleting}
      />
    </div>
  );
}
