'use client';

import { useEffect } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { esES } from '@clerk/localizations';
import { ToastProvider } from '@/components/ui';
import { ThemeProvider } from '@/components/ThemeProvider';
import { OfflineIndicator, InstallPrompt } from '@/components/pwa';

interface ProvidersProps {
  children: React.ReactNode;
}

function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('SW registration failed:', error);
      });
    }
  }, []);
  return null;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ClerkProvider
      localization={esES}
      appearance={{
        variables: {
          colorPrimary: '#2563eb',
          colorBackground: '#ffffff',
          colorText: '#1f2937',
          colorInputBackground: '#f9fafb',
          colorInputText: '#1f2937',
          borderRadius: '0.5rem',
        },
        elements: {
          formButtonPrimary:
            'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors',
          card: 'shadow-lg rounded-xl border border-gray-200',
          headerTitle: 'text-2xl font-bold text-gray-900',
          headerSubtitle: 'text-gray-600',
          socialButtonsBlockButton:
            'border border-gray-300 hover:bg-gray-50 transition-colors rounded-lg',
          formFieldInput:
            'border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          footerActionLink: 'text-blue-600 hover:text-blue-700 font-medium',
        },
      }}
    >
      <ToastProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </ToastProvider>
      <ServiceWorkerRegistration />
      <OfflineIndicator />
      <InstallPrompt />
    </ClerkProvider>
  );
}
