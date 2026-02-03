/**
 * WhatsAppConnectionSuccessDialog - Popup central de sucesso na conexão
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
import { CheckCircle2, Kanban, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber?: string;
}

export function WhatsAppConnectionSuccessDialog({ open, onOpenChange, phoneNumber }: Props) {
  const navigate = useNavigate();

  const handleGoToFunnels = () => {
    onOpenChange(false);
    navigate('/avivar/leads');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-center bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg animate-bounce">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
            WhatsApp Conectado! 🎉
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--avivar-muted-foreground))] text-base">
            Seu WhatsApp foi conectado com sucesso.
            {phoneNumber && (
              <span className="block mt-1 font-medium text-[hsl(var(--avivar-foreground))]">
                Número: {phoneNumber}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 px-2">
          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
            Agora você pode receber e enviar mensagens diretamente pelo CRM.
          </p>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleGoToFunnels}
          className="w-full gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
          size="lg"
        >
          <Kanban className="h-5 w-5" />
          Editar Funil de Vendas
        </Button>
      </DialogContent>
    </Dialog>
  );
}
