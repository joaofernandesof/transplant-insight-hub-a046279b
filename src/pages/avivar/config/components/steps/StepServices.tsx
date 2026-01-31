/**
 * Etapa 6: Serviços Oferecidos
 * Lista de serviços dinâmica baseada no subnicho selecionado
 */

import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Service, SubnichoType, NichoType } from '../../types';
import { getServicesForSubnicho, getNichoTerminology } from '../../nichoConfig';
import { cn } from '@/lib/utils';
import { CheckCircle2, Sparkles, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface StepServicesProps {
  services: Service[];
  onChange: (services: Service[]) => void;
  subnicho?: SubnichoType | null;
  nicho?: NichoType | null;
}

// Ícones padrão por categoria de serviço
const getCategoryEmoji = (serviceId: string): string => {
  const emojiMap: Record<string, string> = {
    // Saúde
    consulta: '🩺', retorno: '📋', exames: '🔬', atestado: '📄', receita: '💊',
    emergencia: '🚑', internacao: '🏥', cirurgia: '🔪',
    limpeza: '🦷', clareamento: '✨', implante: '🔩', canal: '🦷', ortodontia: '😁',
    avaliacao: '📊', terapia: '🧠', fisio: '💪', nutri: '🥗',
    
    // Estética  
    cabelo: '💇', barba: '🧔', sobrancelha: '👁️', tratamento: '💉',
    botox: '💉', preenchimento: '💋', peeling: '✨', laser: '⚡',
    corte: '✂️', coloracao: '🎨', escova: '💆', manicure: '💅', maquiagem: '💄',
    massagem: '🧘', spa: '🧖', facial: '🧴', corporal: '🏋️',
    micropigmentacao: '🖌️', depilacao: '✨',
    
    // Vendas
    equipamentos: '🔧', insumos: '📦', smartphones: '📱', acessorios: '🎧',
    feminino: '👗', masculino: '👔', infantil: '👶', calcados: '👟',
    joias: '💎', relogios: '⌚', skincare: '🧴', perfumaria: '🌸',
    whey: '🥛', vitaminas: '💊', suplemento: '💪', moveis: '🛋️',
    
    // Imobiliário
    venda: '🏠', locacao: '🔑', lancamentos: '🏗️', comercial: '🏢',
    condominio: '🏘️', financiamento: '💰',
    
    // Alimentação
    almoco: '🍽️', jantar: '🌙', reserva: '📅', delivery: '🛵',
    pedido: '📝', cardapio: '📖', lanches: '🍔', porcoes: '🍟',
    pizza: '🍕', rodizio: '🔄', cafe: '☕', doces: '🍰', salgados: '🥐',
    bolos: '🎂', tortas: '🥧', food_truck: '🚚',
    
    // Serviços
    trabalhista: '⚖️', civil: '📜', criminal: '🔒', empresarial: '💼',
    abertura: '📝', mensal: '📅', irpf: '📊', consultoria: '💡',
    treino: '🏃', personal: '👨‍🏫', revisao: '🔧', oleo: '🛢️', freios: '🛑',
    vet: '🐕', vacinas: '💉', banho: '🛁', racao: '🦴', hotel: '🏨',
    social_media: '📱', trafego: '📈', design: '🎨', site: '💻', branding: '🎯',
    matricula: '📚', cursos: '🎓', casamento: '💒', corporativo: '🤝',
    ensaio: '📸', produto: '📦', suporte: '🛠️', desenvolvimento: '👨‍💻',
  };
  
  // Procurar match parcial
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (serviceId.toLowerCase().includes(key)) {
      return emoji;
    }
  }
  
  return '✨';
};

export function StepServices({ 
  services, 
  onChange,
  subnicho = null,
  nicho = null 
}: StepServicesProps) {
  const terminology = getNichoTerminology(nicho);
  const selectedCount = services.filter(s => s.enabled).length;

  // Atualizar serviços quando subnicho mudar (apenas se não tiver serviços selecionados)
  useEffect(() => {
    if (subnicho && services.every(s => !s.enabled)) {
      const nichoServices = getServicesForSubnicho(subnicho);
      // Verificar se os serviços atuais são diferentes dos do nicho
      const currentIds = services.map(s => s.id).sort().join(',');
      const nichoIds = nichoServices.map(s => s.id).sort().join(',');
      if (currentIds !== nichoIds) {
        onChange(nichoServices);
      }
    }
  }, [subnicho]);

  const toggleService = (serviceId: string) => {
    const updated = services.map(s => 
      s.id === serviceId ? { ...s, enabled: !s.enabled } : s
    );
    onChange(updated);
  };

  const selectAll = () => {
    const updated = services.map(s => ({ ...s, enabled: true }));
    onChange(updated);
  };

  const deselectAll = () => {
    const updated = services.map(s => ({ ...s, enabled: false }));
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Quais serviços você oferece?
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          A IA só oferecerá aos {terminology.cliente}s os serviços marcados aqui
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-4">
        {/* Quick actions */}
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            className="text-xs border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
          >
            Selecionar Todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deselectAll}
            className="text-xs border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
          >
            Limpar Seleção
          </Button>
        </div>

        {/* Services list */}
        {services.map((service) => (
          <Card
            key={service.id}
            className={cn(
              "cursor-pointer transition-all duration-200",
              "border-2",
              service.enabled
                ? "border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.05)]"
                : "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] hover:border-[hsl(var(--avivar-primary)/0.3)]"
            )}
            onClick={() => toggleService(service.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[hsl(var(--avivar-muted))] text-2xl">
                  {getCategoryEmoji(service.id)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={service.enabled}
                      onCheckedChange={() => toggleService(service.id)}
                      className="border-[hsl(var(--avivar-border))] data-[state=checked]:bg-[hsl(var(--avivar-primary))] data-[state=checked]:border-[hsl(var(--avivar-primary))]"
                    />
                    <h4 className="font-medium text-[hsl(var(--avivar-foreground))]">
                      {service.name}
                    </h4>
                  </div>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] mt-1 ml-6">
                    {service.description}
                  </p>
                </div>

                {service.enabled && (
                  <CheckCircle2 className="h-5 w-5 text-[hsl(var(--avivar-primary))] flex-shrink-0" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Counter */}
        <div className="flex items-center justify-center gap-2 py-2">
          <Badge 
            variant={selectedCount > 0 ? "default" : "secondary"}
            className={cn(
              selectedCount > 0 
                ? "bg-[hsl(var(--avivar-primary))] text-white" 
                : "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]"
            )}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {selectedCount} serviço{selectedCount !== 1 ? 's' : ''} selecionado{selectedCount !== 1 ? 's' : ''}
          </Badge>
        </div>

        {selectedCount === 0 && (
          <p className="text-center text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ Selecione pelo menos 1 serviço para continuar
          </p>
        )}
      </div>
    </div>
  );
}
