'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
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
} from 'lucide-react';

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
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TemplateType | 'ALL'>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
      const token = await getToken();
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/templates`, {
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

      const res = await fetch(url, {
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
      }
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;

    try {
      const token = await getToken();
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setTemplates(templates.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      const token = await getToken();
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/templates`, {
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
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
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
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas</h1>
          <p className="text-gray-600">Gestiona tus plantillas médicas reutilizables</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Plantilla
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar plantillas..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as TemplateType | 'ALL')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h2>
              <button onClick={resetForm} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la plantilla
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Consulta general"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(templateTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Contenido</label>
                  {!formData.content && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, content: getDefaultContent(formData.type) })
                      }
                      className="text-xs text-blue-600 hover:text-blue-700"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Escribe el contenido de la plantilla..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Usa [VARIABLE] para campos que se llenarán automáticamente
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700">
                  Usar como plantilla predeterminada para este tipo
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileStack className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">
            {searchTerm || filterType !== 'ALL'
              ? 'No se encontraron plantillas con esos filtros'
              : 'No hay plantillas creadas'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Crear primera plantilla
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    {templateTypeIcons[template.type]}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {templateTypeLabels[template.type]}
                      </span>
                      {template.isDefault && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                          Predeterminada
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="Duplicar"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
                {template.content.substring(0, 150)}
                {template.content.length > 150 && '...'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
