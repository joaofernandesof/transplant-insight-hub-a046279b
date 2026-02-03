/**
 * WhatsAppConnectionErrorDialog - Popup central de erro na conexão
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, HelpCircle, ExternalLink } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorMessage?: string;
  onRetry: () => void;
}

export function WhatsAppConnectionErrorDialog({ open, onOpenChange, errorMessage, onRetry }: Props) {
  const handleRetry = () => {
    onOpenChange(false);
    onRetry();
  };

  const handleShowInstructions = () => {
    // Open instructions in a new tab or show inline
    window.open('https://docs.avivar.com.br/whatsapp-connection', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-center bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
        </div>

        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
            Falha na Conexão
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--avivar-muted-foreground))] text-base">
            Não foi possível conectar seu WhatsApp. Isso pode acontecer por alguns motivos.
          </DialogDescription>
        </DialogHeader>

        {/* Error Details */}
        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-left">
            <p className="text-sm text-red-600 font-medium">Detalhes do erro:</p>
            <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
          </div>
        )}

        {/* Common Issues */}
        <div className="bg-[hsl(var(--avivar-muted))] rounded-lg p-4 text-left space-y-2">
          <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">
            Possíveis causas:
          </p>
          <ul className="text-sm text-[hsl(var(--avivar-muted-foreground))] space-y-1 list-disc list-inside">
            <li>QR Code expirou (válido por 2 minutos)</li>
            <li>WhatsApp já conectado em outro dispositivo</li>
            <li>Problema de conexão com a internet</li>
            <li>Número bloqueado ou restrito</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-2">
          <Button
            onClick={handleRetry}
            className="w-full gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
            size="lg"
          >
            <RefreshCw className="h-5 w-5" />
            Tentar novamente
          </Button>
          
          <Button
            onClick={handleShowInstructions}
            variant="outline"
            className="w-full gap-2 border-[hsl(var(--avivar-border))] hover:bg-[hsl(var(--avivar-muted))]"
            size="lg"
          >
            <HelpCircle className="h-5 w-5" />
            Ver instruções
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
