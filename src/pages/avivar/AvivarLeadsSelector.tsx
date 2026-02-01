/**
 * AvivarLeadsSelector - Página de seleção de Kanbans
 * Lista todos os kanbans disponíveis para o usuário escolher
 */

import { useNavigate } from 'react-router-dom';
import { Briefcase, HeartPulse, TrendingUp, Users, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const kanbans = [
  {
    id: 'comercial',
    title: 'Kanban Comercial',
    description: 'Gerencie leads desde o primeiro contato até o fechamento',
    icon: Briefcase,
    href: '/avivar/comercial',
    color: 'from-blue-500 to-blue-600',
    stats: { leads: 47, novos: 12 },
  },
  {
    id: 'posvenda',
    title: 'Kanban Pós-Venda',
    description: 'Acompanhe pacientes após o procedimento',
    icon: HeartPulse,
    href: '/avivar/posvenda',
    color: 'from-emerald-500 to-emerald-600',
    stats: { leads: 23, novos: 5 },
  },
];

export function AvivarLeadsSelector() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] mb-2">
          Leads
        </h1>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Selecione o kanban que deseja visualizar
        </p>
      </div>

      {/* Kanban List */}
      <div className="space-y-4">
        {kanbans.map((kanban) => {
          const Icon = kanban.icon;
          return (
            <Card
              key={kanban.id}
              className="group cursor-pointer border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] hover:bg-[hsl(var(--avivar-primary)/0.05)] hover:border-[hsl(var(--avivar-primary)/0.3)] transition-all duration-300"
              onClick={() => navigate(kanban.href)}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kanban.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[hsl(var(--avivar-foreground))] text-lg">
                        {kanban.title}
                      </h3>
                      {kanban.stats.novos > 0 && (
                        <Badge className="bg-[hsl(var(--avivar-primary))] text-white text-xs">
                          +{kanban.stats.novos} novos
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                      {kanban.description}
                    </p>
                  </div>

                  {/* Stats & Arrow */}
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
                        {kanban.stats.leads}
                      </p>
                      <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">leads ativos</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-[hsl(var(--avivar-muted-foreground))] group-hover:text-[hsl(var(--avivar-primary))] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default AvivarLeadsSelector;
