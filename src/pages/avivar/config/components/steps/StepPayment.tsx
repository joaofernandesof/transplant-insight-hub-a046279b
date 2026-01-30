/**
 * Etapa 8: Formas de Pagamento
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { PaymentMethod } from '../../types';
import { cn } from '@/lib/utils';
import { CheckCircle2, CreditCard, Banknote, Building, RefreshCcw, Heart, Landmark } from 'lucide-react';

interface StepPaymentProps {
  paymentMethods: PaymentMethod[];
  onChange: (methods: PaymentMethod[]) => void;
}

const methodIcons: Record<string, React.ReactNode> = {
  pix: <Banknote className="h-5 w-5" />,
  credito: <CreditCard className="h-5 w-5" />,
  boleto: <Building className="h-5 w-5" />,
  credito_parcelado: <CreditCard className="h-5 w-5" />,
  recorrente: <RefreshCcw className="h-5 w-5" />,
  convenio: <Heart className="h-5 w-5" />,
  financiamento: <Landmark className="h-5 w-5" />
};

const methodColors: Record<string, string> = {
  pix: 'from-green-500 to-emerald-500',
  credito: 'from-blue-500 to-indigo-500',
  boleto: 'from-gray-500 to-slate-500',
  credito_parcelado: 'from-purple-500 to-violet-500',
  recorrente: 'from-orange-500 to-amber-500',
  convenio: 'from-pink-500 to-rose-500',
  financiamento: 'from-teal-500 to-cyan-500'
};

export function StepPayment({ paymentMethods, onChange }: StepPaymentProps) {
  const selectedCount = paymentMethods.filter(m => m.enabled).length;

  const toggleMethod = (methodId: string) => {
    const updated = paymentMethods.map(m => 
      m.id === methodId ? { ...m, enabled: !m.enabled } : m
    );
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Quais formas de pagamento você aceita?
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          A IA informará aos pacientes as opções disponíveis
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {paymentMethods.map((method) => (
            <Card
              key={method.id}
              className={cn(
                "cursor-pointer transition-all duration-200",
                "border-2",
                method.enabled
                  ? "border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.05)]"
                  : "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] hover:border-[hsl(var(--avivar-primary)/0.3)]"
              )}
              onClick={() => toggleMethod(method.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br text-white",
                    methodColors[method.id] || 'from-gray-500 to-slate-500'
                  )}>
                    {methodIcons[method.id] || <CreditCard className="h-5 w-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={method.enabled}
                        onCheckedChange={() => toggleMethod(method.id)}
                        className="border-[hsl(var(--avivar-border))] data-[state=checked]:bg-[hsl(var(--avivar-primary))] data-[state=checked]:border-[hsl(var(--avivar-primary))]"
                      />
                      <span className="font-medium text-[hsl(var(--avivar-foreground))]">
                        {method.name}
                      </span>
                    </div>
                    <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] ml-6">
                      {method.description}
                    </p>
                  </div>

                  {method.enabled && (
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--avivar-primary))] flex-shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Counter */}
        <div className="flex items-center justify-center gap-2 py-4">
          <Badge 
            variant={selectedCount > 0 ? "default" : "secondary"}
            className={cn(
              selectedCount > 0 
                ? "bg-[hsl(var(--avivar-primary))] text-white" 
                : "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]"
            )}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {selectedCount} forma{selectedCount !== 1 ? 's' : ''} selecionada{selectedCount !== 1 ? 's' : ''}
          </Badge>
        </div>

        {selectedCount === 0 && (
          <p className="text-center text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ Selecione pelo menos 1 forma de pagamento para continuar
          </p>
        )}
      </div>
    </div>
  );
}
