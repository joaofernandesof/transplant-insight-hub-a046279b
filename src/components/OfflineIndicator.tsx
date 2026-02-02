// ============================================
// OfflineIndicator - Indicador de Conectividade
// ============================================
// Exibe um banner quando o usuário está offline

import { useState, useEffect } from 'react';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // Para ambiente web, usar eventos nativos do browser
    if (!isNative) {
      const handleOnline = () => {
        setIsOnline(true);
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOnline(navigator.onLine);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // Para ambiente Capacitor, usar plugin Network
    const checkNetwork = async () => {
      try {
        const status = await Network.getStatus();
        setIsOnline(status.connected);
      } catch (error) {
        console.error('Error checking network status:', error);
      }
    };

    checkNetwork();

    const listener = Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
      const wasOffline = !isOnline;
      setIsOnline(status.connected);
      
      // Mostrar mensagem de reconexão por 3 segundos
      if (wasOffline && status.connected) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [isNative, isOnline]);

  // Não mostrar nada se estiver online e não acabou de reconectar
  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-300',
        isOnline 
          ? 'bg-emerald-500 text-white animate-in slide-in-from-top' 
          : 'bg-destructive text-destructive-foreground',
        className
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Conexão restaurada</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Sem conexão com a internet</span>
        </>
      )}
    </div>
  );
}

export default OfflineIndicator;
