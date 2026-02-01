/**
 * Etapa Final: Revisão e Confirmação com Prompt Final
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Eye,
  FileText
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
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
    await navigator.clipboard.writeText(isEditing ? editedPrompt : generatedPrompt);
    toast.success('Prompt copiado para a área de transferência!');
  };

  const handleDownload = () => {
    const content = isEditing ? editedPrompt : generatedPrompt;
    const blob = new Blob([content], { type: 'text/plain' });
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

  // Count lines and characters
  const currentPrompt = isEditing ? editedPrompt : generatedPrompt;
  const lineCount = currentPrompt.split('\n').length;
  const charCount = currentPrompt.length;

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

        {/* Prompt Review Collapsible */}
        <Collapsible open={isPromptOpen} onOpenChange={setIsPromptOpen}>
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-[hsl(var(--avivar-muted)/0.3)] transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                    <CardTitle className="text-lg text-[hsl(var(--avivar-foreground))]">
                      Prompt Final do Agente
                    </CardTitle>
                    {hasEdited && (
                      <Badge variant="outline" className="border-blue-500 text-blue-500 text-xs">
                        Editado
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                      {lineCount} linhas • {charCount.toLocaleString()} chars
                    </span>
                    {isPromptOpen ? (
                      <ChevronUp className="h-5 w-5 text-[hsl(var(--avivar-muted-foreground))]" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-[hsl(var(--avivar-muted-foreground))]" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-3">
                {/* Warning */}
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    <span className="font-medium text-[hsl(var(--avivar-foreground))]">Edição Avançada:</span>{' '}
                    Alterações manuais requerem conhecimento técnico e podem afetar o comportamento do agente.
                  </p>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                    )}
                    
                    {hasEdited && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetToGenerated}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-100/50"
                      >
                        Restaurar
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownload}
                      className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Prompt Content */}
                {isEditing ? (
                  <Textarea
                    value={editedPrompt}
                    onChange={(e) => {
                      setEditedPrompt(e.target.value);
                      setHasEdited(true);
                    }}
                    className="min-h-[300px] font-mono text-xs border-[hsl(var(--avivar-border))] rounded-lg resize-none bg-[hsl(var(--avivar-background))] text-[hsl(var(--avivar-foreground))] focus-visible:ring-[hsl(var(--avivar-primary))]"
                    placeholder="Digite o prompt do agente..."
                  />
                ) : (
                  <ScrollArea className="h-[300px] border border-[hsl(var(--avivar-border))] rounded-lg">
                    <pre className="p-4 text-xs font-mono text-[hsl(var(--avivar-foreground))] whitespace-pre-wrap leading-relaxed">
                      {generatedPrompt}
                    </pre>
                  </ScrollArea>
                )}
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
    </div>
  );
}