import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertCircle,
  ArrowRight,
  Clock,
  FileText,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useDistratoRequests,
  DistratoSolicitacao,
  DistratoEtapa,
  DISTRATO_ETAPA_LABELS,
  DISTRATO_ETAPA_COLORS,
} from '../hooks/useDistrato';
import { NovaDistratoDialog } from './NovaDistratoDialog';
import { DistratoDetailSheet } from './DistratoDetailSheet';

// Ordem das colunas do Kanban
const KANBAN_COLUMNS: DistratoEtapa[] = [
  'solicitacao_recebida',
  'checklist_preenchido',
  'aguardando_parecer_gerente',
  'em_negociacao',
  'devolver',
  'nao_devolver',
  'aguardando_pagamento_financeiro',
  'caso_concluido',
];

interface DistratoCardProps {
  solicitacao: DistratoSolicitacao;
  onClick: () => void;
  onMover: (novaEtapa: DistratoEtapa) => void;
}

const DistratoCard = ({ solicitacao, onClick, onMover }: DistratoCardProps) => {
  const prazoEstourado = solicitacao.prazo_atual && isPast(new Date(solicitacao.prazo_atual));
  
  // Próximas etapas válidas
  const getProximasEtapas = (): DistratoEtapa[] => {
    const proximas: DistratoEtapa[] = [];

    switch (solicitacao.etapa_atual) {
      case 'solicitacao_recebida':
        proximas.push('checklist_preenchido');
        break;
      case 'checklist_preenchido':
        proximas.push('aguardando_parecer_gerente');
        break;
      case 'aguardando_parecer_gerente':
        proximas.push('em_negociacao', 'devolver', 'nao_devolver');
        break;
      case 'em_negociacao':
        proximas.push('devolver', 'nao_devolver');
        break;
      case 'devolver':
        proximas.push('aguardando_pagamento_financeiro');
        break;
      case 'nao_devolver':
        proximas.push('caso_concluido');
        break;
      case 'aguardando_pagamento_financeiro':
        proximas.push('caso_concluido');
        break;
    }
    
    return proximas;
  };

  return (
    <Card 
      className={`border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${
        prazoEstourado ? 'border-l-destructive bg-destructive/5' : 'border-l-primary'
      }`}
    >
      <CardContent className="p-3" onClick={onClick}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs font-mono">
                #{solicitacao.numero_solicitacao}
              </Badge>
              {prazoEstourado && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  SLA
                </Badge>
              )}
            </div>
            <p className="font-medium text-sm line-clamp-2">{solicitacao.paciente_nome}</p>
            {solicitacao.paciente_email && (
              <p className="text-xs text-muted-foreground truncate">{solicitacao.paciente_email}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(); }}>
                <FileText className="h-4 w-4 mr-2" />
                Ver Detalhes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {getProximasEtapas().map(etapa => (
                <DropdownMenuItem 
                  key={etapa}
                  onClick={(e) => { e.stopPropagation(); onMover(etapa); }}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {DISTRATO_ETAPA_LABELS[etapa]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {solicitacao.prazo_atual && (
              <span className={prazoEstourado ? 'text-destructive font-medium' : ''}>
                {formatDistanceToNow(new Date(solicitacao.prazo_atual), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            )}
          </div>
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs bg-primary/10">
              {solicitacao.responsavel_nome?.charAt(0) || 'J'}
            </AvatarFallback>
          </Avatar>
        </div>

        {solicitacao.checklist_valor_total_contrato && (
          <div className="mt-2 pt-2 border-t flex justify-between text-xs">
            <span className="text-muted-foreground">Valor contrato:</span>
            <span className="font-medium">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                .format(solicitacao.checklist_valor_total_contrato)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function DistratoKanban() {
  const { solicitacoes, isLoading, stats, moverParaEtapa } = useDistratoRequests();
  const [isNovaDialogOpen, setIsNovaDialogOpen] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<DistratoSolicitacao | null>(null);

  const getSolicitacoesByEtapa = (etapa: DistratoEtapa) => 
    solicitacoes.filter(s => s.etapa_atual === etapa);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Kanban de Distratos</h2>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Badge variant="outline">{stats.total}</Badge>
              <span className="text-muted-foreground">Total</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="secondary">{stats.emAndamento}</Badge>
              <span className="text-muted-foreground">Em andamento</span>
            </div>
            {stats.slaEstourados > 0 && (
              <div className="flex items-center gap-1">
                <Badge variant="destructive">{stats.slaEstourados}</Badge>
                <span className="text-muted-foreground">SLA</span>
              </div>
            )}
          </div>
        </div>
        <Button className="gap-2" onClick={() => setIsNovaDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Solicitação
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((etapa) => {
          const items = getSolicitacoesByEtapa(etapa);
          const colors = DISTRATO_ETAPA_COLORS[etapa];
          
          return (
            <div key={etapa} className="min-w-[220px] space-y-2">
              <div className={`p-2 rounded-lg border-l-4 ${colors}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xs leading-tight">
                    {DISTRATO_ETAPA_LABELS[etapa]}
                  </h3>
                  <Badge variant="secondary" className="text-xs h-5 min-w-5 flex items-center justify-center">
                    {items.length}
                  </Badge>
                </div>
              </div>
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-2 pr-2">
                  {items.map((solicitacao) => (
                    <DistratoCard
                      key={solicitacao.id}
                      solicitacao={solicitacao}
                      onClick={() => setSelectedSolicitacao(solicitacao)}
                      onMover={(novaEtapa) => moverParaEtapa(solicitacao.id, novaEtapa)}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-xs">
                      Nenhuma solicitação
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>

      {/* Dialogs */}
      <NovaDistratoDialog 
        open={isNovaDialogOpen} 
        onOpenChange={setIsNovaDialogOpen} 
      />

      <DistratoDetailSheet
        solicitacao={selectedSolicitacao}
        open={!!selectedSolicitacao}
        onOpenChange={(open) => !open && setSelectedSolicitacao(null)}
      />
    </div>
  );
}
