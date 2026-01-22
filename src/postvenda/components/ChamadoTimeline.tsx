import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Clock, User, CheckCircle2, ArrowRight, MessageCircle, 
  FileText, AlertCircle, Star 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChamadoHistorico } from '../hooks/usePostVenda';
import { ETAPA_LABELS } from '../lib/permissions';

interface ChamadoTimelineProps {
  historico: ChamadoHistorico[];
  isLoading?: boolean;
}

const acaoIcons: Record<string, React.ElementType> = {
  criacao: FileText,
  transicao_etapa: ArrowRight,
  comentario: MessageCircle,
  evidencia: FileText,
  validacao: CheckCircle2,
  nps: Star,
  alerta_sla: AlertCircle,
};

const acaoLabels: Record<string, string> = {
  criacao: 'Chamado criado',
  transicao_etapa: 'Mudança de etapa',
  comentario: 'Comentário',
  evidencia: 'Evidência anexada',
  validacao: 'Validação',
  nps: 'NPS',
  alerta_sla: 'Alerta SLA',
};

export function ChamadoTimeline({ historico, isLoading }: ChamadoTimelineProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (historico.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum registro no histórico
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-4">
        {historico.map((item, index) => {
          const Icon = acaoIcons[item.acao] || MessageCircle;
          const isFirst = index === 0;
          const isLast = index === historico.length - 1;

          return (
            <div key={item.id} className="relative pl-10">
              {/* Icon circle */}
              <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                isLast ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border'
              }`}>
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className={`p-3 rounded-lg ${isLast ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {acaoLabels[item.acao] || item.acao}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {ETAPA_LABELS[item.etapa]}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(item.data_evento), "dd/MM HH:mm", { locale: ptBR })}
                  </span>
                </div>

                {item.descricao && (
                  <p className="text-sm text-muted-foreground mb-2">{item.descricao}</p>
                )}

                {item.usuario_nome && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{item.usuario_nome}</span>
                  </div>
                )}

                {/* Evidências */}
                {item.evidencias && item.evidencias.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {item.evidencias.map((ev: any, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {ev.name || `Anexo ${i + 1}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
