/**
 * Etapa 3 Simplificada: Serviços + Pagamentos (Tudo em Uma Tela)
 * Pré-preenche serviços do template e permite edição rápida
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Package, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Service, PaymentMethod, NichoType, SubnichoType } from '../../../types';
import { getServicesForSubnicho } from '../../../nichoConfig';

interface StepServicesSimpleProps {
  services: Service[];
  paymentMethods: PaymentMethod[];
  nicho: NichoType | null;
  subnicho: SubnichoType | null;
  onServicesChange: (services: Service[]) => void;
  onPaymentsChange: (methods: PaymentMethod[]) => void;
}

export function StepServicesSimple({
  services,
  paymentMethods,
  nicho,
  subnicho,
  onServicesChange,
  onPaymentsChange,
}: StepServicesSimpleProps) {
  const [showPayments, setShowPayments] = useState(true);
  const [newServiceName, setNewServiceName] = useState('');

  // Inicializar serviços do template se vazio
  React.useEffect(() => {
    if (subnicho && services.length === 0) {
      const templateServices = getServicesForSubnicho(subnicho);
      if (templateServices.length > 0) {
        // Ativa os 3 primeiros por padrão
        const initialServices = templateServices.map((s, i) => ({
          ...s,
          enabled: i < 3
        }));
        onServicesChange(initialServices);
      }
    }
  }, [subnicho]);

  const toggleService = (id: string) => {
    onServicesChange(
      services.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    );
  };

  const addCustomService = () => {
    if (!newServiceName.trim()) return;
    
    const newService: Service = {
      id: `custom_${Date.now()}`,
      name: newServiceName.trim(),
      description: 'Serviço personalizado',
      enabled: true,
    };
    
    onServicesChange([...services, newService]);
    setNewServiceName('');
  };

  const removeService = (id: string) => {
    onServicesChange(services.filter(s => s.id !== id));
  };

  const togglePayment = (id: string) => {
    onPaymentsChange(
      paymentMethods.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p)
    );
  };

  const enabledServicesCount = services.filter(s => s.enabled).length;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          O que você oferece? 🛍️
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Selecione os serviços que sua empresa oferece
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Serviços */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[hsl(var(--avivar-primary))]">
                <Package className="h-5 w-5" />
                <span className="font-medium">Serviços</span>
              </div>
              <span className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                {enabledServicesCount} selecionado{enabledServicesCount !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all",
                    service.enabled
                      ? "bg-[hsl(var(--avivar-primary)/0.1)] border-[hsl(var(--avivar-primary)/0.3)]"
                      : "bg-[hsl(var(--avivar-muted)/0.3)] border-[hsl(var(--avivar-border))]"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Switch
                      checked={service.enabled}
                      onCheckedChange={() => toggleService(service.id)}
                    />
                    <div className="min-w-0">
                      <p className={cn(
                        "font-medium truncate",
                        service.enabled 
                          ? "text-[hsl(var(--avivar-foreground))]" 
                          : "text-[hsl(var(--avivar-muted-foreground))]"
                      )}>
                        {service.name}
                      </p>
                      <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] truncate">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  {service.id.startsWith('custom_') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeService(service.id)}
                      className="text-[hsl(var(--avivar-muted-foreground))] hover:text-destructive ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Adicionar serviço personalizado */}
            <div className="flex gap-2 pt-2">
              <Input
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Adicionar outro serviço..."
                className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                onKeyDown={(e) => e.key === 'Enter' && addCustomService()}
              />
              <Button
                onClick={addCustomService}
                disabled={!newServiceName.trim()}
                className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)]"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pagamentos (colapsável) */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4 space-y-4">
            <button
              onClick={() => setShowPayments(!showPayments)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2 text-[hsl(var(--avivar-primary))]">
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Formas de Pagamento</span>
                <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">(opcional)</span>
              </div>
              {showPayments ? (
                <ChevronUp className="h-5 w-5 text-[hsl(var(--avivar-muted-foreground))]" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[hsl(var(--avivar-muted-foreground))]" />
              )}
            </button>

            {showPayments && (
              <div className="grid grid-cols-2 gap-2 pt-2">
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
