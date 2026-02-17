'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuthCompat as useAuth } from '@/hooks/useAuthCompat';
import {
  Upload,
  X,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  File as FileIcon,
} from 'lucide-react';
import { useToast } from '@/components/ui';

type FileType = 'IMAGE' | 'DOCUMENT' | 'LAB_RESULT' | 'IMAGING' | 'PRESCRIPTION' | 'OTHER';

interface UploadedFile {
  id: string;
  name: string;
  type: FileType;
  sizeMb: number;
  storageUrl?: string;
}

interface FileUploadProps {
  patientId: string;
  onUploadComplete?: (file: UploadedFile) => void;
  onClose?: () => void;
  maxSizeMb?: number;
  acceptedTypes?: string[];
}

interface FileToUpload {
  file: File;
  type: FileType;
  description: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  uploadedFile?: UploadedFile;
}

const fileTypeLabels: Record<FileType, string> = {
  IMAGE: 'Imagen',
  DOCUMENT: 'Documento',
  LAB_RESULT: 'Resultado de laboratorio',
  IMAGING: 'Imagen médica',
  PRESCRIPTION: 'Receta',
  OTHER: 'Otro',
};

export function FileUpload({
  patientId,
  onUploadComplete,
  onClose,
  maxSizeMb = 10,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx'],
}: FileUploadProps) {
  const { getToken } = useAuth();
  const { success, error: showError } = useToast();
  const [files, setFiles] = useState<FileToUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectFileType = (file: File): FileType => {
    const mimeType = file.type.toLowerCase();
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (mimeType.startsWith('image/')) {
      // Check if it's a medical imaging file
      if (['dcm', 'dicom'].includes(extension || '')) {
        return 'IMAGING';
      }
      return 'IMAGE';
    }

    if (mimeType === 'application/pdf') {
      return 'DOCUMENT';
    }

    if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
      return 'LAB_RESULT';
    }

    if (['doc', 'docx'].includes(extension || '')) {
      return 'DOCUMENT';
    }

    return 'OTHER';
  };

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newFiles: FileToUpload[] = Array.from(fileList).map((file) => ({
        file,
        type: detectFileType(file),
        description: '',
        status: 'pending' as const,
      }));

      // Validate file sizes
      const validFiles = newFiles.map((f) => {
        const sizeMb = f.file.size / (1024 * 1024);
        if (sizeMb > maxSizeMb) {
          return {
            ...f,
            status: 'error' as const,
            error: `El archivo excede el límite de ${maxSizeMb}MB`,
          };
        }
        return f;
      });

      setFiles((prev) => [...prev, ...validFiles]);
    },
    [maxSizeMb]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFileType = (index: number, type: FileType) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, type } : f)));
  };

  const updateFileDescription = (index: number, description: string) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, description } : f)));
  };

  const uploadFile = async (fileToUpload: FileToUpload, index: number) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No autenticado');

      setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, status: 'uploading' } : f)));

      const formData = new FormData();
      formData.append('file', fileToUpload.file);
      formData.append('patientId', patientId);
      formData.append('type', fileToUpload.type);
      if (fileToUpload.description) {
        formData.append('description', fileToUpload.description);
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/storage/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const uploadedFile = await response.json();

      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: 'success', uploadedFile } : f))
      );

      success('Archivo subido', `${fileToUpload.file.name} se subió correctamente`);
      onUploadComplete?.(uploadedFile);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: 'error', error: errorMessage } : f))
      );
      showError('Error al subir', errorMessage);
    }
  };

  const uploadAllFiles = async () => {
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'pending') {
        await uploadFile(files[i], i);
      }
    }

    setIsUploading(false);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileIcon className="h-5 w-5" />;
    }
    return <FileText className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    return `${mb.toFixed(2)} MB`;
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const successCount = files.filter((f) => f.status === 'success').length;

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/[0.06] bg-white/[0.03]">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="text-lg font-semibold text-white">Subir archivos</h3>
        {onClose && (
          <button onClick={onClose} className="p-1 text-white/30 hover:text-white/50">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`m-4 cursor-pointer rounded-2xl border-2 border-dashed p-8 transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-white/[0.08] hover:border-gray-400 hover:bg-white/[0.02]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="text-center">
          <Upload
            className={`mx-auto mb-3 h-10 w-10 ${isDragging ? 'text-blue-500' : 'text-white/30'}`}
          />
          <p className="font-medium text-white/70">
            {isDragging
              ? 'Suelta los archivos aquí'
              : 'Arrastra archivos aquí o haz clic para seleccionar'}
          </p>
          <p className="mt-1 text-sm text-white/40">
            Máximo {maxSizeMb}MB por archivo • PDF, imágenes, documentos
          </p>
        </div>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="px-4 pb-4">
          <div className="space-y-3">
            {files.map((fileItem, index) => (
              <div
                key={index}
                className={`rounded-2xl border p-3 ${
                  fileItem.status === 'error'
                    ? 'border-red-200 bg-red-50'
                    : fileItem.status === 'success'
                      ? 'border-green-200 bg-green-50'
                      : 'border-white/[0.06] bg-white/[0.02]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border bg-white/[0.03]">
                    {getFileIcon(fileItem.file)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-white">{fileItem.file.name}</p>
                      {fileItem.status === 'uploading' && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                      )}
                      {fileItem.status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                      )}
                      {fileItem.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <p className="text-sm text-white/40">{formatFileSize(fileItem.file.size)}</p>
                    {fileItem.error && (
                      <p className="mt-1 text-sm text-red-400">{fileItem.error}</p>
                    )}
                  </div>
                  {fileItem.status === 'pending' && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-white/30 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {fileItem.status === 'pending' && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs text-white/40">Tipo</label>
                      <select
                        value={fileItem.type}
                        onChange={(e) => updateFileType(index, e.target.value as FileType)}
                        className="w-full rounded border border-white/[0.08] px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500/20"
                      >
                        {Object.entries(fileTypeLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-white/40">Descripción</label>
                      <input
                        type="text"
                        value={fileItem.description}
                        onChange={(e) => updateFileDescription(index, e.target.value)}
                        placeholder="Opcional"
                        className="w-full rounded border border-white/[0.08] px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <p className="text-sm text-white/40">
              {successCount > 0 && `${successCount} subido${successCount > 1 ? 's' : ''}`}
              {successCount > 0 && pendingCount > 0 && ' • '}
              {pendingCount > 0 && `${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}`}
            </p>
            <div className="flex gap-2">
              {onClose && (
                <button
                  onClick={onClose}
                  className="rounded-2xl border border-white/[0.08] px-4 py-2 text-white/70 hover:bg-white/[0.02]"
                >
                  Cerrar
                </button>
              )}
              {pendingCount > 0 && (
                <button
                  onClick={uploadAllFiles}
                  disabled={isUploading}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Subir {pendingCount > 1 ? `${pendingCount} archivos` : 'archivo'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
