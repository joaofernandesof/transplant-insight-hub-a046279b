/**
 * Etapa Final: Revisão e Confirmação com Prompt Final
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AgentConfig, DAY_NAMES, WeekSchedule } from '../../types';
import { usePromptGenerator } from '../../hooks/usePromptGenerator';
import { 
  CheckCircle2, 
  User, 
  Building2, 
  Bot, 
  Scissors,
  CreditCard,
  Clock,
  Image,
  Key,
  Edit,
  Sparkles,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Save,
  Copy,
  Download,
  AlertTriangle,
  Maximize2,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StepReviewProps {
  config: AgentConfig;
  onEdit: (step: number) => void;
  onComplete: (editedPrompt?: string) => void;
  onPrev: () => void;
}

export function StepReview({ config, onEdit, onComplete, onPrev }: StepReviewProps) {
  const { prompt: generatedPrompt } = usePromptGenerator(config);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(generatedPrompt);
  const [hasEdited, setHasEdited] = useState(false);

  const enabledServices = config.services.filter(s => s.enabled);
  const enabledPayments = config.paymentMethods.filter(m => m.enabled);
  const activeDays = (Object.keys(config.schedule) as Array<keyof WeekSchedule>)
    .filter(d => config.schedule[d].enabled);
  const validImages = config.beforeAfterImages.filter(url => url);

  // Update edited prompt when generated prompt changes
  useEffect(() => {
    if (!hasEdited) {
      setEditedPrompt(generatedPrompt);
    }
  }, [generatedPrompt, hasEdited]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedPrompt);
    toast.success('Prompt copiado para a área de transferência!');
  };

  const handleDownload = () => {
    const blob = new Blob([editedPrompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt_${config.attendantName || 'agente'}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Prompt baixado!');
  };

  const handleResetToGenerated = () => {
    setEditedPrompt(generatedPrompt);
    setHasEdited(false);
    toast.success('Prompt restaurado para versão gerada');
  };

  const handleSave = () => {
    onComplete(hasEdited ? editedPrompt : undefined);
  };

  const handlePromptChange = (value: string) => {
    setEditedPrompt(value);
    setHasEdited(true);
  };

  // Count lines and characters
  const lineCount = editedPrompt.split('\n').length;
  const charCount = editedPrompt.length;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-[hsl(var(--avivar-primary))]" />
          <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
            Tudo pronto! 🎉
          </h2>
        </div>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Revise as informações e finalize a configuração do seu agente
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Summary Card */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-[hsl(var(--avivar-foreground))]">
                Resumo da Configuração
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(1)}
                className="text-[hsl(var(--avivar-primary))] hover:text-[hsl(var(--avivar-accent))]"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  <Scissors className="h-4 w-4" />
                  Nicho
                </div>
                <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                  Clínica de Transplante Capilar
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  <Building2 className="h-4 w-4" />
                  Clínica
                </div>
                <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                  {config.companyName || '-'}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  <User className="h-4 w-4" />
                  Médico
                </div>
                <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                  {config.professionalName || '-'} {config.crm && `(CRM ${config.crm})`}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  <Bot className="h-4 w-4" />
                  Assistente
                </div>
                <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                  {config.attendantName || '-'}
                </p>
              </div>
            </div>

            <hr className="border-[hsl(var(--avivar-border))]" />

            {/* Services */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                <Scissors className="h-4 w-4" />
                Serviços ({enabledServices.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {enabledServices.map(s => (
                  <Badge key={s.id} variant="secondary" className="bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-foreground))]">
                    {s.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Payments */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                <CreditCard className="h-4 w-4" />
                Formas de Pagamento ({enabledPayments.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {enabledPayments.map(m => (
                  <Badge key={m.id} variant="secondary" className="bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-foreground))]">
                    {m.name}
                  </Badge>
                ))}
              </div>
            </div>

            <hr className="border-[hsl(var(--avivar-border))]" />

            {/* Resources */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                <span className="text-sm text-[hsl(var(--avivar-foreground))]">
                  {validImages.length} fotos
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                <span className="text-sm text-[hsl(var(--avivar-foreground))]">
                  {activeDays.length} dias
                </span>
              </div>

              <div className="flex items-center gap-2">
                {config.openaiApiKeyValid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Key className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                )}
                <span className="text-sm text-[hsl(var(--avivar-foreground))]">
                  {config.openaiApiKeyValid ? 'API Key ✓' : 'API Key ✗'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings Collapsible with Prompt Editor */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-[hsl(var(--avivar-muted)/0.3)] transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                    <CardTitle className="text-base text-[hsl(var(--avivar-foreground))]">
                      Configurações Avançadas
                    </CardTitle>
                    <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">(opcional)</span>
                    {hasEdited && (
                      <Badge variant="outline" className="border-blue-500 text-blue-500 text-xs ml-2">
                        Editado
                      </Badge>
                    )}
                  </div>
                  {isAdvancedOpen ? (
                    <ChevronUp className="h-5 w-5 text-[hsl(var(--avivar-muted-foreground))]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[hsl(var(--avivar-muted-foreground))]" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-3">
                {/* Description */}
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  A personalidade, instruções e fluxo de atendimento foram configurados automaticamente com base no seu tipo de negócio.
                  Você pode ajustá-los abaixo se necessário.
                </p>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))] border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Personalidade configurada
                  </Badge>
                  <Badge className="bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))] border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Instruções definidas
                  </Badge>
                  <Badge className="bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))] border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Fluxo de atendimento pronto
                  </Badge>
                </div>

                {/* Warning */}
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    <span className="font-medium text-[hsl(var(--avivar-foreground))]">Edição Avançada:</span>{' '}
                    Alterações manuais requerem conhecimento técnico e podem afetar o comportamento do agente.
                  </p>
                </div>

                {/* Prompt Editor */}
                <div className="relative">
                  <Textarea
                    value={editedPrompt}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    className="min-h-[200px] font-mono text-xs border-[hsl(var(--avivar-border))] rounded-lg resize-none bg-[hsl(var(--avivar-background))] text-[hsl(var(--avivar-foreground))] focus-visible:ring-[hsl(var(--avivar-primary))] pr-12"
                    placeholder="Prompt do agente..."
                  />
                  {/* Expand Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsModalOpen(true)}
                    className="absolute bottom-2 right-2 h-8 w-8 bg-[hsl(var(--avivar-muted))] hover:bg-[hsl(var(--avivar-muted)/0.8)] text-[hsl(var(--avivar-foreground))]"
                    title="Expandir editor"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                      {lineCount} linhas • {charCount.toLocaleString()} caracteres
                    </span>
                    {hasEdited && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetToGenerated}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-100/50 h-7 text-xs"
                      >
                        Restaurar original
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] h-7"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownload}
                      className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] h-7"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={onPrev}
            className="flex-1 border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Voltar
          </Button>
          <Button
            size="lg"
            onClick={handleSave}
            className="flex-[2] bg-gradient-to-r from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] hover:from-[hsl(270_75%_50%)] hover:to-[hsl(280_80%_55%)] text-white shadow-lg"
          >
            <Save className="h-5 w-5 mr-2" />
            💾 Criar Meu Agente de IA
            <CheckCircle2 className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Fullscreen Modal for Prompt Editing */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between text-[hsl(var(--avivar-foreground))]">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                Prompt do Agente
                {hasEdited && (
                  <Badge variant="outline" className="border-blue-500 text-blue-500 text-xs">
                    Editado
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[hsl(var(--avivar-muted-foreground))] font-normal">
                  {lineCount} linhas • {charCount.toLocaleString()} caracteres
                </span>
                {hasEdited && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetToGenerated}
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-100/50 h-7 text-xs"
                  >
                    Restaurar original
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] h-7"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] h-7"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Baixar
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0">
            <Textarea
              value={editedPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              className="h-full w-full font-mono text-sm border-[hsl(var(--avivar-border))] rounded-lg resize-none bg-[hsl(var(--avivar-card))] text-[hsl(var(--avivar-foreground))] focus-visible:ring-[hsl(var(--avivar-primary))]"
              placeholder="Prompt do agente..."
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}