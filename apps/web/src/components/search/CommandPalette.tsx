'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  Search,
  X,
  User,
  Calendar,
  FileText,
  Settings,
  Home,
  Loader2,
  ArrowRight,
  Command,
  BarChart3,
  HardDrive,
  Mic,
  FileStack,
} from 'lucide-react';
import { patientsApi, Patient } from '@/lib/api';

interface SearchResult {
  id: string;
  type: 'patient' | 'page' | 'action';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
}

const staticPages: SearchResult[] = [
  { id: 'home', type: 'page', title: 'Inicio', subtitle: 'Dashboard principal', icon: <Home className="h-4 w-4" />, href: '/' },
  { id: 'patients', type: 'page', title: 'Pacientes', subtitle: 'Lista de pacientes', icon: <User className="h-4 w-4" />, href: '/patients' },
  { id: 'appointments', type: 'page', title: 'Agenda', subtitle: 'Calendario de citas', icon: <Calendar className="h-4 w-4" />, href: '/appointments' },
  { id: 'consultations', type: 'page', title: 'Consultas', subtitle: 'Historial de consultas', icon: <FileText className="h-4 w-4" />, href: '/consultations' },
  { id: 'templates', type: 'page', title: 'Plantillas', subtitle: 'Plantillas médicas', icon: <FileStack className="h-4 w-4" />, href: '/templates' },
  { id: 'reports', type: 'page', title: 'Reportes', subtitle: 'Estadísticas y análisis', icon: <BarChart3 className="h-4 w-4" />, href: '/reports' },
  { id: 'storage', type: 'page', title: 'Almacenamiento', subtitle: 'Archivos y documentos', icon: <HardDrive className="h-4 w-4" />, href: '/storage' },
  { id: 'settings', type: 'page', title: 'Configuración', subtitle: 'Ajustes de la cuenta', icon: <Settings className="h-4 w-4" />, href: '/settings' },
];

const quickActions: SearchResult[] = [
  { id: 'new-consultation', type: 'action', title: 'Nueva consulta', subtitle: 'Iniciar grabación de voz', icon: <Mic className="h-4 w-4" />, href: '/consultations/new' },
  { id: 'new-patient', type: 'action', title: 'Nuevo paciente', subtitle: 'Registrar paciente', icon: <User className="h-4 w-4" />, href: '/patients/new' },
];

export function CommandPalette() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset state when opening
  const openPalette = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
    setResults([...quickActions, ...staticPages]);
  }, []);

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openPalette();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openPalette]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Search patients
  const searchPatients = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) return [];

    try {
      const token = await getToken();
      if (!token) return [];

      const response = await patientsApi.getAll(token, { search: searchQuery, limit: 5 });
      return response.data.map((patient: Patient): SearchResult => ({
        id: patient.id,
        type: 'patient',
        title: `${patient.firstName} ${patient.lastName}`,
        subtitle: `${patient.phone || patient.email || 'Sin contacto'}`,
        icon: <User className="h-4 w-4" />,
        href: `/patients/${patient.id}`,
      }));
    } catch {
      return [];
    }
  }, [getToken]);

  // Filter and search
  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setResults([...quickActions, ...staticPages]);
        return;
      }

      setIsSearching(true);
      const lowerQuery = query.toLowerCase();

      // Filter static pages and actions
      const filteredPages = staticPages.filter(
        (p) => p.title.toLowerCase().includes(lowerQuery) || p.subtitle?.toLowerCase().includes(lowerQuery)
      );
      const filteredActions = quickActions.filter(
        (a) => a.title.toLowerCase().includes(lowerQuery) || a.subtitle?.toLowerCase().includes(lowerQuery)
      );

      // Search patients
      const patientResults = await searchPatients(query);

      setResults([...filteredActions, ...patientResults, ...filteredPages]);
      setSelectedIndex(0);
      setIsSearching(false);
    };

    const debounce = setTimeout(search, 200);
    return () => clearTimeout(debounce);
  }, [query, searchPatients]);

  const handleSelect = useCallback((result: SearchResult) => {
    setIsOpen(false);
    if (result.href) {
      router.push(result.href);
    } else if (result.action) {
      result.action();
    }
  }, [router]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, handleSelect]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) {
    return (
      <button
        onClick={openPalette}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Buscar...</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-white rounded border border-gray-300">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Dialog */}
      <div className="relative flex items-start justify-center pt-[15vh]">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden mx-4">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar pacientes, páginas, acciones..."
              className="flex-1 text-lg outline-none placeholder:text-gray-400"
            />
            {isSearching && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No se encontraron resultados para &quot;{query}&quot;
              </div>
            ) : (
              <div className="py-2">
                {/* Group by type */}
                {results.some((r) => r.type === 'action') && (
                  <div className="px-3 py-1">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Acciones rápidas
                    </p>
                  </div>
                )}
                {results
                  .filter((r) => r.type === 'action')
                  .map((result) => {
                    const globalIndex = results.indexOf(result);
                    return (
                      <ResultItem
                        key={result.id}
                        result={result}
                        isSelected={selectedIndex === globalIndex}
                        onSelect={() => handleSelect(result)}
                        onHover={() => setSelectedIndex(globalIndex)}
                      />
                    );
                  })}

                {results.some((r) => r.type === 'patient') && (
                  <div className="px-3 py-1 mt-2">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Pacientes
                    </p>
                  </div>
                )}
                {results
                  .filter((r) => r.type === 'patient')
                  .map((result) => {
                    const globalIndex = results.indexOf(result);
                    return (
                      <ResultItem
                        key={result.id}
                        result={result}
                        isSelected={selectedIndex === globalIndex}
                        onSelect={() => handleSelect(result)}
                        onHover={() => setSelectedIndex(globalIndex)}
                      />
                    );
                  })}

                {results.some((r) => r.type === 'page') && (
                  <div className="px-3 py-1 mt-2">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Páginas
                    </p>
                  </div>
                )}
                {results
                  .filter((r) => r.type === 'page')
                  .map((result) => {
                    const globalIndex = results.indexOf(result);
                    return (
                      <ResultItem
                        key={result.id}
                        result={result}
                        isSelected={selectedIndex === globalIndex}
                        onSelect={() => handleSelect(result)}
                        onHover={() => setSelectedIndex(globalIndex)}
                      />
                    );
                  })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border">↑↓</kbd>
                navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border">↵</kbd>
                seleccionar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border">esc</kbd>
                cerrar
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultItem({
  result,
  isSelected,
  onSelect,
  onHover,
}: {
  result: SearchResult;
  isSelected: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50'
      }`}
    >
      <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
        {result.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{result.title}</p>
        {result.subtitle && (
          <p className={`text-sm truncate ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
            {result.subtitle}
          </p>
        )}
      </div>
      {isSelected && <ArrowRight className="h-4 w-4 text-blue-500" />}
    </button>
  );
}
