'use client';

import { useEffect, useState, useRef } from 'react';

export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Check if service worker is supported (computed, not state)
  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;

  useEffect(() => {
    if (!isSupported) return;

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        registrationRef.current = reg;
        setRegistration(reg);
        setIsRegistered(true);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New content available, refresh to update');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });

    // Handle controller change
    const handleControllerChange = () => {
      console.log('Service Worker controller changed');
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [isSupported]);

  const update = async () => {
    if (registrationRef.current) {
      await registrationRef.current.update();
    }
  };

  return {
    isSupported,
    isRegistered,
    registration,
    update,
  };
}
