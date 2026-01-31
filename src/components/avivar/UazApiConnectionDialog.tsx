/**
 * UazApiConnectionDialog - Modal para conectar WhatsApp via UazAPI
 * Suporta QR Code e Código de Pareamento
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  QrCode, 
  Hash,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Smartphone,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUazApiIntegration } from '@/hooks/useUazApiIntegration';
import { toast } from 'sonner';

interface UazApiConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  instanceToken?: string;
}

export function UazApiConnectionDialog({ 
  open, 
  onOpenChange,
  onSuccess,
  instanceToken
}: UazApiConnectionDialogProps) {
  const { connectInstance, checkStatus, isConnecting, instance } = useUazApiIntegration();
  
  const [activeTab, setActiveTab] = useState<'qrcode' | 'paircode'>('qrcode');
  const [phone, setPhone] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(120);
  const [isPolling, setIsPolling] = useState(false);

  // Handle connection request
  const handleConnect = async () => {
    const phoneToSend = activeTab === 'paircode' ? phone.replace(/\D/g, '') : undefined;
    
    if (activeTab === 'paircode' && !phoneToSend) {
      toast.error('Digite o número do WhatsApp');
      return;
    }

    const result = await connectInstance(phoneToSend);
    
    if (result) {
      if (result.qrCode) {
        setQrCode(result.qrCode);
        setCountdown(120);
        startPolling();
      }
      if (result.pairCode) {
        setPairCode(result.pairCode);
        setCountdown(300); // 5 minutes for pair code
        startPolling();
      }
    }
  };

  // Start polling for connection status
  const startPolling = () => {
    setIsPolling(true);
  };

  // Countdown timer
  useEffect(() => {
    if (!isPolling || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsPolling(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPolling, countdown]);

  // Poll for status
  useEffect(() => {
    if (!isPolling) return;

    const pollInterval = setInterval(async () => {
      await checkStatus();
    }, 3000);

    // Auto-stop after timeout
    const timeout = setTimeout(() => {
      setIsPolling(false);
    }, activeTab === 'paircode' ? 300000 : 120000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [isPolling, activeTab, checkStatus]);

  // Watch for successful connection
  useEffect(() => {
    if (instance?.status === 'connected') {
      setIsPolling(false);
      onSuccess?.();
    }
  }, [instance?.status, onSuccess]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQrCode(null);
      setPairCode(null);
      setPhone('');
      setCountdown(120);
      setIsPolling(false);
    }
  }, [open]);

  // Copy pair code to clipboard
  const copyPairCode = () => {
    if (pairCode) {
      navigator.clipboard.writeText(pairCode);
      toast.success('Código copiado!');
    }
  };

  // Format countdown
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            Escolha como deseja conectar seu WhatsApp
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'qrcode' | 'paircode')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qrcode" className="gap-2">
              <QrCode className="h-4 w-4" />
              QR Code
            </TabsTrigger>
            <TabsTrigger value="paircode" className="gap-2">
              <Hash className="h-4 w-4" />
              Código
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qrcode" className="space-y-4 pt-4">
            {/* QR Code Display */}
            <div className="flex flex-col items-center gap-4">
              <div className={cn(
                "relative w-64 h-64 border-2 rounded-xl flex items-center justify-center",
                "bg-white dark:bg-gray-900",
                isConnecting && "opacity-50"
              )}>
                {isConnecting ? (
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
                    {countdown <= 20 && countdown > 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                        <div className="text-center text-white">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">QR expira em</p>
                          <p className="text-2xl font-bold">{formatCountdown(countdown)}</p>
                        </div>
                      </div>
                    )}
                    {countdown === 0 && (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl gap-3">
                        <AlertCircle className="h-8 w-8 text-yellow-500" />
                        <p className="text-white text-sm text-center px-4">QR Code expirado</p>
                        <Button size="sm" onClick={handleConnect} className="gap-1">
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
              {isPolling && (
                <Badge variant="outline" className="gap-1.5 animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Aguardando conexão... {formatCountdown(countdown)}
                </Badge>
              )}
            </div>

            {/* Generate Button */}
            {!qrCode && !isConnecting && (
              <Button 
                onClick={handleConnect} 
                className="w-full gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary))]/90"
              >
                <QrCode className="h-4 w-4" />
                Gerar QR Code
              </Button>
            )}

            {/* Instructions */}
            <div className="space-y-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Como escanear:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Abra o WhatsApp no celular</li>
                <li>Vá em <strong>Configurações</strong> → <strong>Aparelhos conectados</strong></li>
                <li>Toque em <strong>Conectar um aparelho</strong></li>
                <li>Escaneie este QR code</li>
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="paircode" className="space-y-4 pt-4">
            {/* Phone Input */}
            <div className="space-y-2">
              <Label htmlFor="phone">Número do WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="5511999999999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!!pairCode}
              />
              <p className="text-xs text-muted-foreground">
                Digite com código do país (55 para Brasil)
              </p>
            </div>

            {/* Pair Code Display */}
            {pairCode && (
              <div className="flex flex-col items-center gap-4 p-6 bg-muted/50 rounded-xl">
                <p className="text-sm text-muted-foreground">Seu código de pareamento:</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-mono font-bold tracking-widest">
                    {pairCode}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={copyPairCode}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Válido por {formatCountdown(countdown)}
                </p>
              </div>
            )}

            {/* Status indicator */}
            {isPolling && pairCode && (
              <Badge variant="outline" className="gap-1.5 animate-pulse w-full justify-center">
                <Loader2 className="h-3 w-3 animate-spin" />
                Aguardando conexão...
              </Badge>
            )}

            {/* Generate Button */}
            {!pairCode && (
              <Button 
                onClick={handleConnect}
                disabled={isConnecting || !phone}
                className="w-full gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary))]/90"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Hash className="h-4 w-4" />
                )}
                Gerar Código de Pareamento
              </Button>
            )}

            {/* Instructions */}
            <div className="space-y-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Como usar o código:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Abra o WhatsApp no celular</li>
                <li>Vá em <strong>Configurações</strong> → <strong>Aparelhos conectados</strong></li>
                <li>Toque em <strong>Conectar um aparelho</strong></li>
                <li>Selecione <strong>Conectar com número de telefone</strong></li>
                <li>Digite o código acima</li>
              </ol>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
