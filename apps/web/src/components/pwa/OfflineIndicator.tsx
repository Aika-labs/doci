'use client';

import { useState, useEffect, useSyncExternalStore, useRef, startTransition } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

function getOnlineStatus() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

function subscribeToOnlineStatus(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function OfflineIndicator() {
  const isOnline = useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineStatus,
    () => true // Server snapshot
  );
  const [showReconnected, setShowReconnected] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
    } else if (wasOfflineRef.current) {
      // Use startTransition to avoid the lint warning about setState in effects
      // This is a valid use case: responding to external state change (network status)
      startTransition(() => {
        setShowReconnected(true);
      });
      const timer = setTimeout(() => {
        startTransition(() => {
          setShowReconnected(false);
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-all ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-yellow-500 text-yellow-900'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-5 w-5" />
          <span className="font-medium">Conexión restaurada</span>
        </>
      ) : (
        <>
          <WifiOff className="h-5 w-5" />
          <div>
            <p className="font-medium">Sin conexión</p>
            <p className="text-sm opacity-90">Algunas funciones pueden no estar disponibles</p>
          </div>
        </>
      )}
    </div>
  );
}
