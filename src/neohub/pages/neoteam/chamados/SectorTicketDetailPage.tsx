import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, MessageSquare, ChevronRight, Clock, User, Calendar, Loader2, AlertCircle,
} from 'lucide-react';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { useSectorTickets, useSectorTicketHistory, SECTOR_LABELS, PRIORITY_CONFIG, STATUS_CONFIG } from '@/neohub/hooks/useSectorTickets';
import { SectorTicketStageFlow } from './SectorTicketStageFlow';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  sectorCode: string;
  sectorSlug: string;
}

export default function SectorTicketDetailPage({ sectorCode, sectorSlug }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tickets, stages, getStagesForType, advanceStage, addComment, isLoading } = useSectorTickets(sectorCode);
  const { history, isLoading: historyLoading } = useSectorTicketHistory(id);
  const [comment, setComment] = useState('');

  const ticket = tickets.find(t => t.id === id);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">Chamado não encontrado</p>
        <Button variant="outline" onClick={() => navigate(`/neoteam/${sectorSlug}/chamados`)}>Voltar</Button>
      </div>
    );
  }

  const typeStages = getStagesForType(ticket.ticket_type_id);
  const currentStageIdx = typeStages.findIndex(s => s.id === ticket.current_stage_id);
  const nextStage = currentStageIdx >= 0 && currentStageIdx < typeStages.length - 1 ? typeStages[currentStageIdx + 1] : null;
  const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.normal;
  const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.aberto;

  const handleAdvance = () => {
    if (!nextStage) return;
    advanceStage.mutate({ ticketId: ticket.id, nextStageId: nextStage.id });
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    await addComment.mutateAsync({ ticketId: ticket.id, comment: comment.trim() });
    setComment('');
  };

  return (
    <div className="space-y-6 p-6">
      <NeoTeamBreadcrumb />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/neoteam/${sectorSlug}/chamados`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold">
              Chamado #{String(ticket.ticket_number).padStart(5, '0')}
            </h1>
            <Badge className={priority.color}>{priority.label}</Badge>
            <Badge className={status.color}>{status.label}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {ticket.ticket_type?.name} • {ticket.current_stage?.name || 'Aberto'}
          </p>
        </div>
      </div>

      {/* Stage Flow */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ChevronRight className="h-4 w-4" />
            Fluxo de Etapas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SectorTicketStageFlow stages={typeStages} currentStageId={ticket.current_stage_id} />
          {nextStage && ticket.status !== 'resolvido' && ticket.status !== 'cancelado' && (
            <div className="flex justify-center mt-4">
              <Button onClick={handleAdvance} disabled={advanceStage.isPending} className="gap-2">
                {advanceStage.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Avançar para: {nextStage.name}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader><CardTitle className="text-base">Descrição</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {ticket.description || 'Sem descrição'}
              </p>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Histórico</CardTitle>
                <div className="flex items-center gap-2">
                  <Textarea
                    placeholder="Adicionar comentário..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="min-h-[38px] h-[38px] resize-none text-sm"
                    rows={1}
                  />
                  <Button size="sm" variant="outline" onClick={handleComment} disabled={!comment.trim()}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro</p>
              ) : (
                <div className="space-y-4">
                  {history.map(h => (
                    <div key={h.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        {h.action === 'comentario' ? (
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        ) : h.action === 'etapa_avancada' ? (
                          <ChevronRight className="h-4 w-4 text-primary" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{h.user_name || 'Sistema'}</span>
                          {h.action === 'etapa_avancada' && h.from_stage_name && (
                            <span className="text-xs text-muted-foreground">
                              {h.from_stage_name} → {h.to_stage_name}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(new Date(h.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                        {h.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">{h.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Informações</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Solicitante</span>
                <span className="font-medium">{ticket.requester_name}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Responsável</span>
                <span className="font-medium">{ticket.assigned_name || '—'}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Filial</span>
                <span className="font-medium">{ticket.branch || '—'}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Criado em</span>
                <span className="font-medium">
                  {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              {ticket.sla_deadline && (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SLA</span>
                    <span className={`font-medium ${ticket.sla_breached ? 'text-destructive' : ''}`}>
                      {format(new Date(ticket.sla_deadline), "dd/MM HH:mm", { locale: ptBR })}
                      {ticket.sla_breached && ' (Estourado)'}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
