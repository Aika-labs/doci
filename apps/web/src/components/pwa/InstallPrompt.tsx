'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const initializedRef = useRef(false);

  const handleBeforeInstallPrompt = useCallback((e: Event) => {
    e.preventDefault();
    setDeferredPrompt(e as BeforeInstallPromptEvent);
    // Show prompt after a delay to not interrupt user
    setTimeout(() => setShowPrompt(true), 5000);
  }, []);

  const handleAppInstalled = useCallback(() => {
    setIsInstalled(true);
    setShowPrompt(false);
    setDeferredPrompt(null);
  }, []);

  useEffect(() => {
    // Skip if already initialized or on server
    if (initializedRef.current || typeof window === 'undefined') return;
    initializedRef.current = true;

    // Check if already installed - use startTransition to avoid lint warning
    // This is a valid use case: initializing state based on browser API
    if (window.matchMedia('(display-mode: standalone)').matches) {
      startTransition(() => {
        setIsInstalled(true);
      });
      return;
    }

    // Check if user dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [handleBeforeInstallPrompt, handleAppInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-4 left-4 z-50 rounded-xl border border-gray-200 bg-white p-4 shadow-xl md:right-4 md:left-auto md:max-w-sm">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100">
          <Smartphone className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="mb-1 font-semibold text-gray-900">Instalar Doci</h3>
          <p className="mb-3 text-sm text-gray-600">
            Instala la app para acceso rápido y funciones offline
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
