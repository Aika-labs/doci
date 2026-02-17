'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthCompat as useAuth } from '@/hooks/useAuthCompat';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import {
  HardDrive,
  Search,
  Filter,
  Upload,
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  File,
  Loader2,
  User,
  Calendar,
  Eye,
  X,
  Image as ImageIcon,
} from 'lucide-react';

type FileType = 'IMAGE' | 'DOCUMENT' | 'LAB_RESULT' | 'IMAGING' | 'PRESCRIPTION' | 'OTHER';

interface PatientFile {
  id: string;
  patientId: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  name: string;
  type: FileType;
  sizeMb: number;
  storagePath: string;
  storageUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface StorageStats {
  totalFiles: number;
  totalSizeMb: number;
  byType: Record<FileType, number>;
}

const fileTypeLabels: Record<FileType, string> = {
  IMAGE: 'Imagen',
  DOCUMENT: 'Documento',
  LAB_RESULT: 'Resultado de laboratorio',
  IMAGING: 'Imagen médica',
  PRESCRIPTION: 'Receta',
  OTHER: 'Otro',
};

const getFileTypeIcon = (type: FileType) => {
  switch (type) {
    case 'IMAGE':
    case 'IMAGING':
      return <File className="h-5 w-5" />;
    case 'LAB_RESULT':
      return <FileSpreadsheet className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
};

const fileTypeColors: Record<FileType, string> = {
  IMAGE: 'bg-violet-500/15 text-violet-400',
  DOCUMENT: 'bg-blue-500/15 text-blue-400',
  LAB_RESULT: 'bg-emerald-500/15 text-emerald-400',
  IMAGING: 'bg-orange-500/15 text-orange-600',
  PRESCRIPTION: 'bg-red-500/15 text-red-400',
  OTHER: 'bg-white/[0.06] text-white/50',
};

export default function StoragePage() {
  const { getToken } = useAuth();
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FileType | 'ALL'>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFile, setSelectedFile] = useState<PatientFile | null>(null);
  const [stats, setStats] = useState<StorageStats>({
    totalFiles: 0,
    totalSizeMb: 0,
    byType: {} as Record<FileType, number>,
  });

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/storage`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const fileList = data.files || data || [];
        setFiles(fileList);

        // Calculate stats
        const totalSizeMb = fileList.reduce((acc: number, f: PatientFile) => acc + f.sizeMb, 0);
        const byType = fileList.reduce(
          (acc: Record<FileType, number>, f: PatientFile) => {
            acc[f.type] = (acc[f.type] || 0) + 1;
            return acc;
          },
          {} as Record<FileType, number>
        );

        setStats({
          totalFiles: fileList.length,
          totalSizeMb,
          byType,
        });
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDelete = async (fileId: string) => {
    if (!confirm('¿Estás seguro de eliminar este archivo?')) return;

    try {
      const token = await getToken();
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/storage/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setFiles(files.filter((f) => f.id !== fileId));
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.patient?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.patient?.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || file.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatFileSize = (sizeMb: number) => {
    if (sizeMb < 1) return `${(sizeMb * 1024).toFixed(0)} KB`;
    return `${sizeMb.toFixed(2)} MB`;
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Almacenamiento</h1>
          <p className="text-white/50">Gestiona los archivos de tus pacientes</p>
        </div>
        <Link
          href="/dashboard/patients"
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white hover:from-blue-600 hover:to-cyan-600"
        >
          <Upload className="h-4 w-4" />
          Subir desde paciente
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/15">
              <HardDrive className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-white/40">Total archivos</p>
              <p className="text-xl font-bold text-white">{stats.totalFiles}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15">
              <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-white/40">Espacio usado</p>
              <p className="text-xl font-bold text-white">{formatFileSize(stats.totalSizeMb)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/15">
              <ImageIcon className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-white/40">Imágenes</p>
              <p className="text-xl font-bold text-white">
                {(stats.byType.IMAGE || 0) + (stats.byType.IMAGING || 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/15">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-white/40">Documentos</p>
              <p className="text-xl font-bold text-white">
                {(stats.byType.DOCUMENT || 0) + (stats.byType.LAB_RESULT || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de archivo o paciente..."
            className="w-full rounded-2xl border border-white/[0.08] py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2 transition-colors ${
            showFilters || filterType !== 'ALL'
              ? 'border-blue-500 bg-blue-50 text-blue-300'
              : 'border-white/[0.08] text-white/70 hover:bg-white/[0.02]'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {filterType !== 'ALL' && <span className="h-2 w-2 rounded-full bg-blue-600" />}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <label className="mb-2 block text-sm font-medium text-white/70">Tipo de archivo</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('ALL')}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                filterType === 'ALL'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  : 'bg-white/[0.06] text-white/70 hover:bg-white/10'
              }`}
            >
              Todos
            </button>
            {Object.entries(fileTypeLabels).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilterType(value as FileType)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  filterType === value
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    : 'bg-white/[0.06] text-white/70 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Files Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] py-12 text-center">
          <HardDrive className="mx-auto mb-3 h-12 w-12 text-white/20" />
          <p className="mb-4 text-white/40">
            {searchTerm || filterType !== 'ALL'
              ? 'No se encontraron archivos con esos filtros'
              : 'No hay archivos subidos'}
          </p>
          <p className="text-sm text-white/30">
            Los archivos se suben desde el expediente de cada paciente
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="cursor-pointer rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-shadow hover:shadow-md"
              onClick={() => setSelectedFile(file)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${fileTypeColors[file.type]}`}
                >
                  {getFileTypeIcon(file.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium text-white">{file.name}</h3>
                  <p className="text-sm text-white/40">{fileTypeLabels[file.type]}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/30">
                    <span>{formatFileSize(file.sizeMb)}</span>
                    <span>•</span>
                    <span>{format(new Date(file.createdAt), 'd MMM yyyy', { locale: es })}</span>
                  </div>
                </div>
              </div>
              {file.patient && (
                <div className="mt-3 flex items-center gap-2 border-t pt-3">
                  <User className="h-4 w-4 text-white/30" />
                  <Link
                    href={`/patients/${file.patient.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    {file.patient.firstName} {file.patient.lastName}
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* File Detail Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="m-4 w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-semibold text-white">Detalles del archivo</h2>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1 text-white/30 hover:text-white/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4 flex items-start gap-4">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-lg ${fileTypeColors[selectedFile.type]}`}
                >
                  {getFileTypeIcon(selectedFile.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{selectedFile.name}</h3>
                  <p className="text-sm text-white/40">{fileTypeLabels[selectedFile.type]}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <HardDrive className="h-4 w-4 text-white/30" />
                  <span className="text-white/40">Tamaño:</span>
                  <span className="text-white">{formatFileSize(selectedFile.sizeMb)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-white/30" />
                  <span className="text-white/40">Subido:</span>
                  <span className="text-white">
                    {format(new Date(selectedFile.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", {
                      locale: es,
                    })}
                  </span>
                </div>
                {selectedFile.patient && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-white/30" />
                    <span className="text-white/40">Paciente:</span>
                    <Link
                      href={`/patients/${selectedFile.patient.id}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {selectedFile.patient.firstName} {selectedFile.patient.lastName}
                    </Link>
                  </div>
                )}
                {selectedFile.description && (
                  <div className="pt-2">
                    <p className="mb-1 text-sm text-white/40">Descripción:</p>
                    <p className="text-sm text-white">{selectedFile.description}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3 border-t pt-4">
                {selectedFile.storageUrl && (
                  <>
                    <a
                      href={selectedFile.storageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white hover:from-blue-600 hover:to-cyan-600"
                    >
                      <Eye className="h-4 w-4" />
                      Ver archivo
                    </a>
                    <a
                      href={selectedFile.storageUrl}
                      download={selectedFile.name}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] px-4 py-2 hover:bg-white/[0.02]"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </>
                )}
                <button
                  onClick={() => handleDelete(selectedFile.id)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-red-300 px-4 py-2 text-red-400 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
