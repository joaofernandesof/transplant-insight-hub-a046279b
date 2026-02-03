/**
 * Etapa 3 Simplificada: Apenas Serviços/Produtos com opção de valor
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Package, DollarSign, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Service, NichoType, SubnichoType } from '../../../types';
import { getServicesForSubnicho } from '../../../nichoConfig';

interface StepServicesOnlyProps {
  services: Service[];
  nicho: NichoType | null;
  subnicho: SubnichoType | null;
  onServicesChange: (services: Service[]) => void;
}

export function StepServicesOnly({
  services,
  nicho,
  subnicho,
  onServicesChange,
}: StepServicesOnlyProps) {
  const [newServiceName, setNewServiceName] = useState('');

  // Inicializar serviços do template se vazio
  useEffect(() => {
    if (subnicho && services.length === 0) {
      const templateServices = getServicesForSubnicho(subnicho);
      if (templateServices.length > 0) {
        // Ativa os 3 primeiros por padrão, todos com showPrice=false (não informar valores)
        const initialServices = templateServices.map((s, i) => ({
          ...s,
          enabled: i < 3,
          showPrice: false, // Por padrão, não informar valores
          price: null,
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

  const toggleShowPrice = (id: string) => {
    onServicesChange(
      services.map(s => s.id === id ? { 
        ...s, 
        showPrice: !s.showPrice,
        price: !s.showPrice ? s.price : null // Limpa preço se desativar
      } : s)
    );
  };

  const updatePrice = (id: string, value: string) => {
    const numValue = value ? parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) * 100 : null;
    onServicesChange(
      services.map(s => s.id === id ? { ...s, price: numValue } : s)
    );
  };

  const formatPrice = (cents: number | null | undefined): string => {
    if (!cents) return '';
    return (cents / 100).toFixed(2).replace('.', ',');
  };

  const addCustomService = () => {
    if (!newServiceName.trim()) return;
    
    const newService: Service = {
      id: `custom_${Date.now()}`,
      name: newServiceName.trim(),
      description: 'Serviço personalizado',
      enabled: true,
      showPrice: false,
      price: null,
    };
    
    onServicesChange([...services, newService]);
    setNewServiceName('');
  };

  const removeService = (id: string) => {
    onServicesChange(services.filter(s => s.id !== id));
  };

  const enabledServicesCount = services.filter(s => s.enabled).length;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          O que você oferece? 🛍️
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Selecione os serviços e produtos da sua empresa
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[hsl(var(--avivar-primary))]">
                <Package className="h-5 w-5" />
                <span className="font-medium">Serviços e Produtos</span>
              </div>
              <span className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                {enabledServicesCount} selecionado{enabledServicesCount !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    service.enabled
                      ? "bg-[hsl(var(--avivar-primary)/0.1)] border-[hsl(var(--avivar-primary)/0.3)]"
                      : "bg-[hsl(var(--avivar-muted)/0.3)] border-[hsl(var(--avivar-border))]"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Switch
                        checked={service.enabled}
                        onCheckedChange={() => toggleService(service.id)}
                      />
                      <div className="min-w-0 flex-1">
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

                    {/* Controle de Preço */}
                    {service.enabled && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleShowPrice(service.id)}
                          className={cn(
                            "text-xs h-8 px-2",
                            service.showPrice 
                              ? "text-[hsl(var(--avivar-primary))]" 
                              : "text-[hsl(var(--avivar-muted-foreground))]"
                          )}
                          title={service.showPrice ? "Ocultar valor" : "Informar valor"}
                        >
                          {service.showPrice ? (
                            <DollarSign className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>

                        {service.showPrice && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">R$</span>
                            <Input
                              value={formatPrice(service.price)}
                              onChange={(e) => updatePrice(service.id, e.target.value)}
                              placeholder="0,00"
                              className="w-24 h-8 text-sm bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {service.id.startsWith('custom_') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeService(service.id)}
                        className="text-[hsl(var(--avivar-muted-foreground))] hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
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

            <div className="bg-[hsl(var(--avivar-muted)/0.3)] rounded-lg p-3 mt-4">
              <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                <strong>💡 Dica:</strong> Clique em <DollarSign className="h-3 w-3 inline" /> para adicionar valor ou deixe com <EyeOff className="h-3 w-3 inline" /> para não informar valores (ideal para trazer o cliente até a clínica).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
