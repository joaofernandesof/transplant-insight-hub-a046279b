import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { ChamadoTimeline, ChamadoEtapaFlow, DistratoSwimLanesBpmn, PostVendaChecklistModal } from '../components';
import { DistratoEtapaFlow, DistratoEtapaBpmn, DistratoDecisao } from '../components/DistratoEtapaFlow';
import { usePostVenda, useChamadoHistorico, ChamadoEtapa } from '../hooks/usePostVenda';
import { ETAPA_LABELS, STATUS_LABELS, PRIORIDADE_LABELS, TIPO_DEMANDA_OPTIONS, DISTRATO_ETAPA_LABELS } from '../lib/permissions';
import { 
  ArrowLeft, User, Phone, Mail, Clock,
  MessageCircle, AlertCircle, Loader2, FileText, LayoutList, GitBranch,
  ClipboardCheck
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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

export default function ChamadoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { chamados, avancarEtapa, addHistorico } = usePostVenda();
  const { historico, isLoading: historicoLoading } = useChamadoHistorico(id);
  
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bpmnEnabled, setBpmnEnabled] = useState(false);
  const [swimLanesView, setSwimLanesView] = useState(false);
  const chamado = chamados.find(c => c.id === id);

  if (!chamado) {
    return (
      <div className="p-4 lg:p-6">
        <GlobalBreadcrumb />
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">Chamado não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/neoteam/postvenda/chamados')}>
            Voltar para lista
          </Button>
        </div>
      </div>
    );
  }

  const getTipoDemandaLabel = (value: string) => {
    const option = TIPO_DEMANDA_OPTIONS.find(o => o.value === value);
    return option?.label || value;
  };

  const handleAdvanceEtapa = async (targetEtapa: ChamadoEtapa, description?: string) => {
    setIsSubmitting(true);
    try {
      await avancarEtapa(chamado.id, targetEtapa, description);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevertEtapa = async (targetEtapa: ChamadoEtapa, description?: string) => {
    setIsSubmitting(true);
    try {
      await avancarEtapa(chamado.id, targetEtapa, description);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    setIsSubmitting(true);
    try {
      await addHistorico(chamado.id, 'comentario', comment);
      setShowCommentDialog(false);
      setComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <GlobalBreadcrumb />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/neoteam/postvenda/chamados')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">
              Chamado #{chamado.numero_chamado?.toString().padStart(5, '0')}
            </h1>
            <Badge className={prioridadeColors[chamado.prioridade]}>
              {PRIORIDADE_LABELS[chamado.prioridade]}
            </Badge>
            <Badge className={etapaColors[chamado.etapa_atual]}>
              {ETAPA_LABELS[chamado.etapa_atual]}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {getTipoDemandaLabel(chamado.tipo_demanda)} • {STATUS_LABELS[chamado.status]}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowChecklistModal(true)}
          className="gap-2"
        >
          <ClipboardCheck className="h-4 w-4" />
          Checklist
        </Button>
      </div>

      {/* Fluxo do Processo - Diferente para Distrato vs outros tipos */}
      <div className="space-y-4">
        {chamado.tipo_demanda === 'distrato' ? (
          <>
            {/* Toggle para Swim Lanes quando for Distrato */}
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-muted-foreground">Visualização:</span>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <Button
                  variant={!swimLanesView ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-none gap-1.5 text-xs h-8"
                  onClick={() => setSwimLanesView(false)}
                >
                  <LayoutList className="h-3.5 w-3.5" />
                  Etapas BPMN
                </Button>
                <Button
                  variant={swimLanesView ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-none gap-1.5 text-xs h-8"
                  onClick={() => setSwimLanesView(true)}
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  Swim Lanes
                </Button>
              </div>
            </div>

            {/* Fluxo BPMN de Distrato ou Swim Lanes */}
            {swimLanesView ? (
              <DistratoSwimLanesBpmn
                currentEtapa={(chamado as any).distrato_etapa_bpmn || 'solicitacao_recebida'}
                decisao={(chamado as any).distrato_decisao || 'pendente'}
              />
            ) : (
              <DistratoEtapaFlow
                currentEtapa={(chamado as any).distrato_etapa_bpmn || 'solicitacao_recebida'}
                decisao={(chamado as any).distrato_decisao || 'pendente'}
                onAdvance={async (targetEtapa, metadata) => {
                  setIsSubmitting(true);
                  try {
                    // Para distrato, atualizamos a etapa BPMN específica
                    await avancarEtapa(chamado.id, chamado.etapa_atual, metadata?.observacao);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                isSubmitting={isSubmitting}
              />
            )}
          </>
        ) : (
          /* Fluxo genérico para outros tipos de chamado */
          <ChamadoEtapaFlow
            currentEtapa={chamado.etapa_atual}
            onAdvance={handleAdvanceEtapa}
            onRevert={handleRevertEtapa}
            bpmnEnabled={bpmnEnabled}
            onToggleBpmn={setBpmnEnabled}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Motivo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Motivo da Abertura</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {chamado.motivo_abertura || 'Sem descrição'}
              </p>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Histórico</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowCommentDialog(true)}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Adicionar Comentário
              </Button>
            </CardHeader>
            <CardContent>
              <ChamadoTimeline historico={historico} isLoading={historicoLoading} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados do Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{chamado.paciente_nome}</p>
              </div>
              
              {chamado.paciente_telefone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{chamado.paciente_telefone}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-emerald-600"
                    onClick={() => openWhatsApp(chamado.paciente_telefone!)}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {chamado.paciente_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{chamado.paciente_email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chamado Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Canal de Origem</span>
                <Badge variant="outline">{chamado.canal_origem}</Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Criado em</span>
                <span>{format(new Date(chamado.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>

              {chamado.sla_prazo_fim && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prazo SLA</span>
                  <div className={`flex items-center gap-1 ${
                    chamado.sla_estourado ? 'text-destructive' : 
                    new Date(chamado.sla_prazo_fim) < new Date() ? 'text-destructive' : 'text-foreground'
                  }`}>
                    <Clock className="h-4 w-4" />
                    <span>
                      {chamado.sla_estourado ? 'Estourado' : 
                        formatDistanceToNow(new Date(chamado.sla_prazo_fim), { locale: ptBR, addSuffix: true })}
                    </span>
                  </div>
                </div>
              )}

              {chamado.responsavel_nome && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Responsável</span>
                  <span>{chamado.responsavel_nome}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Comentário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Digite seu comentário..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddComment} disabled={isSubmitting || !comment.trim()}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checklist Modal */}
      <PostVendaChecklistModal
        isOpen={showChecklistModal}
        onClose={() => setShowChecklistModal(false)}
        chamadoId={chamado.id}
        tipoDemanda={chamado.tipo_demanda}
        pacienteNome={chamado.paciente_nome}
      />
    </div>
  );
}
