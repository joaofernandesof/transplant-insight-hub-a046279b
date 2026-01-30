/**
 * WhatsAppQRCodeDialog - Modal para exibir QR code de conexão WhatsApp
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  RefreshCw, 
  CheckCircle2, 
  Loader2,
  Smartphone,
  QrCode,
  AlertCircle,
  Wifi
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWhatsAppIntegration } from '@/hooks/useWhatsAppIntegration';

interface WhatsAppQRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}

export function WhatsAppQRCodeDialog({ 
  open, 
  onOpenChange,
  onConnected 
}: WhatsAppQRCodeDialogProps) {
  const {
    session,
    qrCode,
    isLoading,
    isConnecting,
    isConnected,
    createSession,
    refreshQRCode,
    disconnect,
  } = useWhatsAppIntegration();

  const [countdown, setCountdown] = useState(60);

  // Start session when dialog opens
  useEffect(() => {
    if (open && !session && !isLoading) {
      createSession();
    }
  }, [open]);

  // Countdown timer for QR code expiration
  useEffect(() => {
    if (!qrCode || isConnected) return;

    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [qrCode, isConnected]);

  // Handle successful connection
  useEffect(() => {
    if (isConnected) {
      onConnected?.();
    }
  }, [isConnected, onConnected]);

  const handleRefresh = async () => {
    if (session) {
      await refreshQRCode();
    } else {
      await createSession();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600" />
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR code com seu WhatsApp para sincronizar as mensagens
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Connection Status */}
          {isConnected ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="p-4 rounded-full bg-[hsl(var(--avivar-primary))]/10">
                <CheckCircle2 className="h-12 w-12 text-[hsl(var(--avivar-primary))]" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg text-[hsl(var(--avivar-primary))]">WhatsApp Conectado!</h3>
                {session?.phone_name && (
                  <p className="text-sm text-muted-foreground">{session.phone_name}</p>
                )}
                {session?.phone_number && (
                  <p className="text-xs text-muted-foreground font-mono">{session.phone_number}</p>
                )}
              </div>
              <Badge variant="secondary" className="gap-1">
                <Wifi className="h-3 w-3" />
                Sincronizado
              </Badge>
              
              <Separator className="my-2" />
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Fechar
                </Button>
                <Button
                  variant="destructive"
                  onClick={disconnect}
                  disabled={isLoading}
                >
                  Desconectar
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* QR Code Display */}
              <div className="flex flex-col items-center gap-4">
                <div className={cn(
                  "relative w-64 h-64 border-2 rounded-xl flex items-center justify-center",
                  "bg-white dark:bg-gray-900",
                  isLoading && "opacity-50"
                )}>
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Gerando QR Code...</span>
                    </div>
                  ) : qrCode ? (
                    <>
                      <img 
                        src={qrCode} 
                        alt="QR Code WhatsApp" 
                        className="w-full h-full object-contain p-2"
                      />
                      {/* Countdown overlay */}
                      {countdown <= 10 && countdown > 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                          <div className="text-center text-white">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">QR expira em</p>
                            <p className="text-2xl font-bold">{countdown}s</p>
                          </div>
                        </div>
                      )}
                      {countdown === 0 && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl gap-3">
                          <AlertCircle className="h-8 w-8 text-yellow-500" />
                          <p className="text-white text-sm text-center px-4">QR Code expirado</p>
                          <Button 
                            size="sm" 
                            onClick={handleRefresh}
                            className="gap-1"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Novo QR Code
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <QrCode className="h-12 w-12" />
                      <span className="text-sm">Clique para gerar</span>
                    </div>
                  )}
                </div>

                {/* Status indicator */}
                {isConnecting && (
                  <Badge variant="outline" className="gap-1.5 animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Aguardando conexão...
                  </Badge>
                )}
              </div>

              {/* Instructions */}
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Como conectar:
                </h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Abra o WhatsApp no seu celular</li>
                  <li>Toque em <strong>Configurações</strong> → <strong>Aparelhos conectados</strong></li>
                  <li>Toque em <strong>Conectar um aparelho</strong></li>
                  <li>Escaneie este QR code</li>
                </ol>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="gap-1.5 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary))]/90"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {qrCode ? 'Atualizar QR' : 'Gerar QR Code'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
