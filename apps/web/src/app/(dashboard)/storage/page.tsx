'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
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
  IMAGE: 'bg-purple-100 text-purple-600',
  DOCUMENT: 'bg-blue-100 text-blue-600',
  LAB_RESULT: 'bg-green-100 text-green-600',
  IMAGING: 'bg-orange-100 text-orange-600',
  PRESCRIPTION: 'bg-red-100 text-red-600',
  OTHER: 'bg-gray-100 text-gray-600',
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
        const byType = fileList.reduce((acc: Record<FileType, number>, f: PatientFile) => {
          acc[f.type] = (acc[f.type] || 0) + 1;
          return acc;
        }, {} as Record<FileType, number>);

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
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Almacenamiento</h1>
          <p className="text-gray-600">Gestiona los archivos de tus pacientes</p>
        </div>
        <Link
          href="/patients"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Upload className="h-4 w-4" />
          Subir desde paciente
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <HardDrive className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total archivos</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalFiles}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Espacio usado</p>
              <p className="text-xl font-bold text-gray-900">{formatFileSize(stats.totalSizeMb)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Imágenes</p>
              <p className="text-xl font-bold text-gray-900">
                {(stats.byType.IMAGE || 0) + (stats.byType.IMAGING || 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Documentos</p>
              <p className="text-xl font-bold text-gray-900">
                {(stats.byType.DOCUMENT || 0) + (stats.byType.LAB_RESULT || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de archivo o paciente..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            showFilters || filterType !== 'ALL'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {filterType !== 'ALL' && <span className="w-2 h-2 bg-blue-600 rounded-full" />}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de archivo</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterType === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {Object.entries(fileTypeLabels).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilterType(value as FileType)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterType === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <HardDrive className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">
            {searchTerm || filterType !== 'ALL'
              ? 'No se encontraron archivos con esos filtros'
              : 'No hay archivos subidos'}
          </p>
          <p className="text-sm text-gray-400">
            Los archivos se suben desde el expediente de cada paciente
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedFile(file)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${fileTypeColors[file.type]}`}>
                  {getFileTypeIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{file.name}</h3>
                  <p className="text-sm text-gray-500">{fileTypeLabels[file.type]}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span>{formatFileSize(file.sizeMb)}</span>
                    <span>•</span>
                    <span>{format(new Date(file.createdAt), 'd MMM yyyy', { locale: es })}</span>
                  </div>
                </div>
              </div>
              {file.patient && (
                <div className="mt-3 pt-3 border-t flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <Link
                    href={`/patients/${file.patient.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-blue-600 hover:text-blue-700"
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg m-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Detalles del archivo</h2>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${fileTypeColors[selectedFile.type]}`}>
                  {getFileTypeIcon(selectedFile.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedFile.name}</h3>
                  <p className="text-sm text-gray-500">{fileTypeLabels[selectedFile.type]}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <HardDrive className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Tamaño:</span>
                  <span className="text-gray-900">{formatFileSize(selectedFile.sizeMb)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Subido:</span>
                  <span className="text-gray-900">
                    {format(new Date(selectedFile.createdAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                  </span>
                </div>
                {selectedFile.patient && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Paciente:</span>
                    <Link
                      href={`/patients/${selectedFile.patient.id}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {selectedFile.patient.firstName} {selectedFile.patient.lastName}
                    </Link>
                  </div>
                )}
                {selectedFile.description && (
                  <div className="pt-2">
                    <p className="text-sm text-gray-500 mb-1">Descripción:</p>
                    <p className="text-sm text-gray-900">{selectedFile.description}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                {selectedFile.storageUrl && (
                  <>
                    <a
                      href={selectedFile.storageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                      Ver archivo
                    </a>
                    <a
                      href={selectedFile.storageUrl}
                      download={selectedFile.name}
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </>
                )}
                <button
                  onClick={() => handleDelete(selectedFile.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
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
