import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { ChamadoTimeline } from '../components';
import { usePostVenda, useChamadoHistorico, ChamadoEtapa } from '../hooks/usePostVenda';
import { ETAPA_LABELS, STATUS_LABELS, PRIORIDADE_LABELS, TIPO_DEMANDA_OPTIONS } from '../lib/permissions';
import { 
  ArrowLeft, User, Phone, Mail, Clock, Calendar, 
  MessageCircle, ChevronRight, AlertCircle, CheckCircle2,
  ArrowRight, Loader2, FileText
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const etapaFlow: ChamadoEtapa[] = ['triagem', 'atendimento', 'resolucao', 'validacao_paciente', 'nps', 'encerrado'];

export default function ChamadoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { chamados, avancarEtapa, addHistorico, updateChamado } = usePostVenda();
  const { historico, isLoading: historicoLoading } = useChamadoHistorico(id);
  
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [advanceDescription, setAdvanceDescription] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const currentEtapaIndex = etapaFlow.indexOf(chamado.etapa_atual);
  const nextEtapa = currentEtapaIndex < etapaFlow.length - 1 ? etapaFlow[currentEtapaIndex + 1] : null;

  const getTipoDemandaLabel = (value: string) => {
    const option = TIPO_DEMANDA_OPTIONS.find(o => o.value === value);
    return option?.label || value;
  };

  const handleAdvanceEtapa = async () => {
    if (!nextEtapa) return;
    setIsSubmitting(true);
    try {
      await avancarEtapa(chamado.id, nextEtapa, advanceDescription || undefined);
      setShowAdvanceDialog(false);
      setAdvanceDescription('');
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
          <div className="flex items-center gap-3">
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
      </div>

      {/* Etapa Flow */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {etapaFlow.map((etapa, index) => {
              const isComplete = index < currentEtapaIndex;
              const isCurrent = index === currentEtapaIndex;
              return (
                <div key={etapa} className="flex items-center flex-1">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    isCurrent ? 'bg-primary text-primary-foreground' :
                    isComplete ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span className="h-4 w-4 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                    )}
                    <span className="text-sm font-medium hidden lg:inline">{ETAPA_LABELS[etapa]}</span>
                  </div>
                  {index < etapaFlow.length - 1 && (
                    <ChevronRight className={`h-5 w-5 mx-2 ${isComplete ? 'text-primary' : 'text-muted-foreground'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
          {/* Actions */}
          {nextEtapa && chamado.etapa_atual !== 'encerrado' && (
            <Card className="border-primary">
              <CardContent className="p-4">
                <Button 
                  className="w-full gap-2" 
                  onClick={() => setShowAdvanceDialog(true)}
                >
                  <ArrowRight className="h-4 w-4" />
                  Avançar para {ETAPA_LABELS[nextEtapa]}
                </Button>
              </CardContent>
            </Card>
          )}

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

      {/* Advance Etapa Dialog */}
      <Dialog open={showAdvanceDialog} onOpenChange={setShowAdvanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avançar para {nextEtapa ? ETAPA_LABELS[nextEtapa] : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea
                placeholder="Descreva o que foi feito ou observações..."
                value={advanceDescription}
                onChange={(e) => setAdvanceDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdvanceDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdvanceEtapa} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
