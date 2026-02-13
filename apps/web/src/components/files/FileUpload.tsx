'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
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

  const handleFiles = useCallback((fileList: FileList | File[]) => {
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
  }, [maxSizeMb]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFileType = (index: number, type: FileType) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, type } : f))
    );
  };

  const updateFileDescription = (index: number, description: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, description } : f))
    );
  };

  const uploadFile = async (fileToUpload: FileToUpload, index: number) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No autenticado');

      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: 'uploading' } : f))
      );

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
        prev.map((f, i) =>
          i === index ? { ...f, status: 'success', uploadedFile } : f
        )
      );

      success('Archivo subido', `${fileToUpload.file.name} se subió correctamente`);
      onUploadComplete?.(uploadedFile);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Subir archivos</h3>
        {onClose && (
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
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
        className={`m-4 p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
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
          <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          <p className="text-gray-700 font-medium">
            {isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí o haz clic para seleccionar'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
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
                className={`p-3 rounded-lg border ${
                  fileItem.status === 'error'
                    ? 'border-red-200 bg-red-50'
                    : fileItem.status === 'success'
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border">
                    {getFileIcon(fileItem.file)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{fileItem.file.name}</p>
                      {fileItem.status === 'uploading' && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      )}
                      {fileItem.status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {fileItem.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{formatFileSize(fileItem.file.size)}</p>
                    {fileItem.error && (
                      <p className="text-sm text-red-600 mt-1">{fileItem.error}</p>
                    )}
                  </div>
                  {fileItem.status === 'pending' && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {fileItem.status === 'pending' && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                      <select
                        value={fileItem.type}
                        onChange={(e) => updateFileType(index, e.target.value as FileType)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      >
                        {Object.entries(fileTypeLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Descripción</label>
                      <input
                        type="text"
                        value={fileItem.description}
                        onChange={(e) => updateFileDescription(index, e.target.value)}
                        placeholder="Opcional"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">
              {successCount > 0 && `${successCount} subido${successCount > 1 ? 's' : ''}`}
              {successCount > 0 && pendingCount > 0 && ' • '}
              {pendingCount > 0 && `${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}`}
            </p>
            <div className="flex gap-2">
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cerrar
                </button>
              )}
              {pendingCount > 0 && (
                <button
                  onClick={uploadAllFiles}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
