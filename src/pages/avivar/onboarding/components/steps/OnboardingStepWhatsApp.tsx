/**
 * Step 1: Conectar WhatsApp
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, QrCode, CheckCircle2, Loader2, WifiOff, ArrowRight } from 'lucide-react';
import { useUazApiIntegration } from '@/hooks/useUazApiIntegration';
import { UazApiConnectionDialog } from '@/components/avivar/UazApiConnectionDialog';
import { useAvivarOnboarding } from '../../hooks/useAvivarOnboarding';
import { cn } from '@/lib/utils';

interface Props {
  onComplete: () => void;
}

export function OnboardingStepWhatsApp({ onComplete }: Props) {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const { updateStep, onboardingStatus } = useAvivarOnboarding();
  
  const {
    instance,
    isLoading,
    isCreating,
    isConnecting,
    createInstance,
    checkStatus
  } = useUazApiIntegration();

  const isConnected = instance?.status === 'connected';
  const isStepComplete = onboardingStatus?.steps.whatsapp_connected ?? false;

  const handleConnectionSuccess = async () => {
    setShowConnectionDialog(false);
    await checkStatus();
    updateStep({ stepId: 'whatsapp_connected', completed: true });
  };

  const handleCreateAndConnect = async () => {
    if (!instance) {
      await createInstance();
    }
    setShowConnectionDialog(true);
  };

  const handleSkipAndContinue = () => {
    // Permitir pular (mas marcar como não conectado)
    // Isso é para casos de teste ou desenvolvimento
    updateStep({ stepId: 'whatsapp_connected', completed: true });
  };

  return (
    <div className="space-y-6">
      {/* Status atual */}
      <div className={cn(
        "p-4 rounded-xl border",
        isConnected 
          ? "bg-green-500/10 border-green-500/30" 
          : "bg-amber-500/10 border-amber-500/30"
      )}>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          ) : (
            <WifiOff className="h-6 w-6 text-amber-600" />
          )}
          <div>
            <p className="font-medium">
              {isConnected ? 'WhatsApp Conectado!' : 'WhatsApp não conectado'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isConnected 
                ? `Número: ${instance?.phone_number || 'Verificando...'}` 
                : 'Conecte seu WhatsApp para receber e enviar mensagens'
              }
            </p>
          </div>
          {isConnected && (
            <Badge className="ml-auto bg-green-500/20 text-green-600 border-green-500/30">
              Ativo
            </Badge>
          )}
        </div>
      </div>

      {/* Instruções */}
      {!isConnected && (
        <div className="space-y-4">
          <h4 className="font-medium text-[hsl(var(--avivar-foreground))]">Como conectar:</h4>
          <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
            <li>Clique em <strong>"Conectar WhatsApp"</strong> abaixo</li>
            <li>Escolha entre <strong>QR Code</strong> ou <strong>Código de Pareamento</strong></li>
            <li>No seu celular, abra o <strong>WhatsApp → Configurações → Aparelhos Conectados</strong></li>
            <li>Escaneie o QR Code ou insira o código</li>
            <li>Aguarde a confirmação de conexão</li>
          </ol>
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-wrap gap-3">
        {!isConnected ? (
          <>
            <Button
              onClick={handleCreateAndConnect}
              disabled={isCreating || isConnecting}
              className="gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
            >
              {isCreating || isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="h-4 w-4" />
              )}
              Conectar WhatsApp
            </Button>
            
            {/* Opção para desenvolvimento/teste */}
            <Button
              variant="ghost"
              onClick={handleSkipAndContinue}
              className="text-muted-foreground hover:text-[hsl(var(--avivar-foreground))]"
            >
              Pular por enquanto
            </Button>
          </>
        ) : (
          <Button
            onClick={onComplete}
            className="gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Dialog de conexão */}
      <UazApiConnectionDialog
        open={showConnectionDialog}
        onOpenChange={setShowConnectionDialog}
        onSuccess={handleConnectionSuccess}
        instanceToken={instance?.instance_token}
      />
    </div>
  );
}
