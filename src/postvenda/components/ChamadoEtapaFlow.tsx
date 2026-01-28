import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, ChevronLeft, ChevronRight, 
  ArrowRight, Loader2, SkipForward, 
  GitBranch, ArrowLeftRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChamadoEtapa } from '../hooks/usePostVenda';
import { ETAPA_LABELS } from '../lib/permissions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const etapaFlow: ChamadoEtapa[] = ['triagem', 'atendimento', 'resolucao', 'validacao_paciente', 'nps', 'encerrado'];

const etapaColors: Record<string, { bg: string; border: string; text: string; ring: string }> = {
  triagem: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', ring: 'ring-amber-200' },
  atendimento: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', ring: 'ring-blue-200' },
  resolucao: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', ring: 'ring-purple-200' },
  validacao_paciente: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', ring: 'ring-orange-200' },
  nps: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  encerrado: { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-600', ring: 'ring-slate-200' },
};

interface ChamadoEtapaFlowProps {
  currentEtapa: ChamadoEtapa;
  onAdvance: (targetEtapa: ChamadoEtapa, description?: string) => Promise<void>;
  onRevert?: (targetEtapa: ChamadoEtapa, description?: string) => Promise<void>;
  bpmnEnabled?: boolean;
  onToggleBpmn?: (enabled: boolean) => void;
  isSubmitting?: boolean;
}

export function ChamadoEtapaFlow({ 
  currentEtapa, 
  onAdvance, 
  onRevert,
  bpmnEnabled = false,
  onToggleBpmn,
  isSubmitting = false
}: ChamadoEtapaFlowProps) {
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [description, setDescription] = useState('');
  const [targetEtapa, setTargetEtapa] = useState<ChamadoEtapa | null>(null);

  const currentIndex = etapaFlow.indexOf(currentEtapa);
  const nextEtapa = currentIndex < etapaFlow.length - 1 ? etapaFlow[currentIndex + 1] : null;
  const prevEtapa = currentIndex > 0 ? etapaFlow[currentIndex - 1] : null;
  const canAdvance = nextEtapa !== null && currentEtapa !== 'encerrado';
  const canRevert = prevEtapa !== null && onRevert;

  const handleAdvance = async () => {
    if (!nextEtapa) return;
    await onAdvance(nextEtapa, description || undefined);
    setShowAdvanceDialog(false);
    setDescription('');
  };

  const handleRevert = async () => {
    if (!prevEtapa || !onRevert) return;
    await onRevert(prevEtapa, description || undefined);
    setShowRevertDialog(false);
    setDescription('');
  };

  const handleSkip = async () => {
    if (!targetEtapa) return;
    await onAdvance(targetEtapa, description || undefined);
    setShowSkipDialog(false);
    setDescription('');
    setTargetEtapa(null);
  };

  const getSkipOptions = () => {
    return etapaFlow.filter((_, index) => index > currentIndex + 1 && index < etapaFlow.length);
  };

  return (
    <Card className="border border-border/50 bg-gradient-to-br from-card to-muted/20">
      <CardContent className="p-4 lg:p-6">
        {/* Header with BPMN Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Fluxo do Processo</span>
          </div>
          {onToggleBpmn && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="bpmn-mode" className="text-xs text-muted-foreground cursor-pointer">
                      BPMN
                    </Label>
                    <Switch
                      id="bpmn-mode"
                      checked={bpmnEnabled}
                      onCheckedChange={onToggleBpmn}
                      className="scale-75"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ativar modo BPMN permite pular etapas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative mb-6">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted rounded-full -translate-y-1/2" />
          <div 
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-primary to-primary/70 rounded-full -translate-y-1/2 transition-all duration-500"
            style={{ width: `${(currentIndex / (etapaFlow.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between items-start">
          {etapaFlow.map((etapa, index) => {
            const isComplete = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;
            const colors = etapaColors[etapa];

            return (
              <div key={etapa} className="flex flex-col items-center flex-1">
                {/* Step Circle */}
                <div
                  className={cn(
                    "w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10",
                    isComplete && "bg-primary border-primary text-primary-foreground shadow-md",
                    isCurrent && cn(
                      colors.bg, 
                      colors.border, 
                      colors.text, 
                      "ring-4",
                      colors.ring,
                      "shadow-lg scale-110"
                    ),
                    isFuture && "bg-muted border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 lg:h-6 lg:w-6" />
                  ) : (
                    <span className="text-sm lg:text-base font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <div className="mt-2 text-center max-w-[80px] lg:max-w-[100px]">
                  <p className={cn(
                    "text-[10px] lg:text-xs font-medium leading-tight",
                    isCurrent && cn(colors.text, "font-bold"),
                    isFuture && "text-muted-foreground",
                    isComplete && "text-foreground"
                  )}>
                    {ETAPA_LABELS[etapa]}
                  </p>
                </div>

                {/* Current Badge */}
                {isCurrent && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "mt-1 text-[9px] lg:text-[10px] h-4 px-1.5",
                      colors.bg, colors.text, "border", colors.border
                    )}
                  >
                    Atual
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation Actions */}
        <div className="mt-6 flex items-center justify-center gap-2 lg:gap-3">
          {/* Revert Button */}
          {canRevert && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRevertDialog(true)}
                    disabled={isSubmitting}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden lg:inline">Voltar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Voltar para {ETAPA_LABELS[prevEtapa!]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Advance Button */}
          {canAdvance && (
            <Button
              onClick={() => setShowAdvanceDialog(true)}
              disabled={isSubmitting}
              className="gap-2 px-4 lg:px-6"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Avançar para {ETAPA_LABELS[nextEtapa!]}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Skip Button (BPMN Mode) */}
          {bpmnEnabled && canAdvance && getSkipOptions().length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSkipDialog(true)}
                    disabled={isSubmitting}
                    className="gap-1"
                  >
                    <SkipForward className="h-4 w-4" />
                    <span className="hidden lg:inline">Pular</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pular para outra etapa (BPMN)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* BPMN Indicator */}
        {bpmnEnabled && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ArrowLeftRight className="h-3 w-3" />
            <span>Modo BPMN ativo - navegação flexível habilitada</span>
          </div>
        )}
      </CardContent>

      {/* Advance Dialog */}
      <Dialog open={showAdvanceDialog} onOpenChange={setShowAdvanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avançar para {nextEtapa ? ETAPA_LABELS[nextEtapa] : ''}</DialogTitle>
            <DialogDescription>
              O chamado será movido para a próxima etapa do processo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea
                placeholder="Descreva o que foi feito ou observações..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdvanceDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdvance} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revert Dialog */}
      <Dialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voltar para {prevEtapa ? ETAPA_LABELS[prevEtapa] : ''}</DialogTitle>
            <DialogDescription>
              O chamado será retornado para a etapa anterior.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Motivo (obrigatório)</label>
              <Textarea
                placeholder="Descreva o motivo do retorno..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevertDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRevert} 
              disabled={isSubmitting || !description.trim()}
              variant="secondary"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Retorno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skip Dialog (BPMN) */}
      <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Pular Etapas (BPMN)
            </DialogTitle>
            <DialogDescription>
              Selecione a etapa de destino para pular diretamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Etapa de destino</label>
              <Select value={targetEtapa || ''} onValueChange={(v) => setTargetEtapa(v as ChamadoEtapa)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a etapa..." />
                </SelectTrigger>
                <SelectContent>
                  {getSkipOptions().map(etapa => (
                    <SelectItem key={etapa} value={etapa}>
                      {ETAPA_LABELS[etapa]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Justificativa (obrigatório)</label>
              <Textarea
                placeholder="Justifique o motivo do pulo de etapas..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSkipDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSkip} 
              disabled={isSubmitting || !targetEtapa || !description.trim()}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Pular para {targetEtapa ? ETAPA_LABELS[targetEtapa] : 'etapa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
