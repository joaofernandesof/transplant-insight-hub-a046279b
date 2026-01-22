import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Clock, User, Phone, MessageCircle, AlertCircle, 
  ChevronRight, Calendar 
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Chamado, getSlaStatus } from '../hooks/usePostVenda';
import { ETAPA_LABELS, STATUS_LABELS, PRIORIDADE_LABELS } from '../lib/permissions';

interface ChamadoCardProps {
  chamado: Chamado;
}

const prioridadeColors: Record<string, string> = {
  baixa: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  alta: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgente: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const etapaColors: Record<string, string> = {
  triagem: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  atendimento: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  resolucao: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  validacao_paciente: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  nps: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  encerrado: 'bg-muted text-muted-foreground',
};

const slaColors: Record<string, string> = {
  ok: 'text-emerald-600',
  warning: 'text-amber-600',
  danger: 'text-red-600',
};

export function ChamadoCard({ chamado }: ChamadoCardProps) {
  const navigate = useNavigate();
  const slaStatus = getSlaStatus(chamado);

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-all border-l-4 ${
        chamado.prioridade === 'urgente' ? 'border-l-red-500' :
        chamado.prioridade === 'alta' ? 'border-l-orange-500' :
        chamado.prioridade === 'normal' ? 'border-l-blue-500' :
        'border-l-muted-foreground/30'
      }`}
      onClick={() => navigate(`/postvenda/chamados/${chamado.id}`)}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground">
                #{chamado.numero_chamado?.toString().padStart(5, '0')}
              </span>
              <Badge className={prioridadeColors[chamado.prioridade]}>
                {PRIORIDADE_LABELS[chamado.prioridade]}
              </Badge>
            </div>
            <p className="font-medium truncate">{chamado.tipo_demanda.toUpperCase()}</p>
          </div>
          <Badge className={etapaColors[chamado.etapa_atual]}>
            {ETAPA_LABELS[chamado.etapa_atual]}
          </Badge>
        </div>

        {/* Patient Info */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{chamado.paciente_nome}</span>
          </div>
          {chamado.paciente_telefone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{chamado.paciente_telefone}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-emerald-600"
                onClick={(e) => { e.stopPropagation(); openWhatsApp(chamado.paciente_telefone!); }}
              >
                <MessageCircle className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-3 text-xs">
            {/* SLA Status */}
            <div className={`flex items-center gap-1 ${slaColors[slaStatus]}`}>
              {slaStatus === 'danger' && <AlertCircle className="h-3.5 w-3.5" />}
              <Clock className="h-3.5 w-3.5" />
              {chamado.sla_prazo_fim ? (
                <span>
                  {new Date(chamado.sla_prazo_fim) > new Date() 
                    ? `Vence ${formatDistanceToNow(new Date(chamado.sla_prazo_fim), { locale: ptBR, addSuffix: true })}`
                    : 'SLA Estourado'
                  }
                </span>
              ) : (
                <span>Sem SLA</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(chamado.created_at), 'dd/MM HH:mm')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
