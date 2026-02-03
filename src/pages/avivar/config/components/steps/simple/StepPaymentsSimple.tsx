/**
 * Etapa 4 Simplificada: Formas de Pagamento
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentMethod } from '../../../types';

interface StepPaymentsSimpleProps {
  paymentMethods: PaymentMethod[];
  onPaymentsChange: (methods: PaymentMethod[]) => void;
}

export function StepPaymentsSimple({
  paymentMethods,
  onPaymentsChange,
}: StepPaymentsSimpleProps) {
  const togglePayment = (id: string) => {
    onPaymentsChange(
      paymentMethods.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p)
    );
  };

  const enabledCount = paymentMethods.filter(p => p.enabled).length;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Formas de Pagamento 💳
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Selecione as formas de pagamento aceitas
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[hsl(var(--avivar-primary))]">
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Formas de Pagamento</span>
              </div>
              <span className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                {enabledCount} selecionado{enabledCount !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => togglePayment(method.id)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                    method.enabled
                      ? "bg-[hsl(var(--avivar-primary)/0.1)] border-[hsl(var(--avivar-primary)/0.3)]"
                      : "bg-[hsl(var(--avivar-muted)/0.3)] border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)]"
                  )}
                >
                  <Switch
                    checked={method.enabled}
                    onCheckedChange={() => togglePayment(method.id)}
                  />
                  <span className={cn(
                    "text-sm",
                    method.enabled 
                      ? "text-[hsl(var(--avivar-foreground))]" 
                      : "text-[hsl(var(--avivar-muted-foreground))]"
                  )}>
                    {method.name}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] text-center mt-4">
              Essas informações serão usadas pelo agente para informar os clientes sobre as opções de pagamento disponíveis.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
