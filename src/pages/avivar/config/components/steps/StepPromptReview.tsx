/**
 * Etapa Final: Revisão e Edição do Prompt Completo
 * Permite visualizar e editar o prompt gerado antes de salvar
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AgentConfig } from '../../types';
import { usePromptGenerator } from '../../hooks/usePromptGenerator';
import { 
  ChevronLeft, 
  Copy, 
  Download, 
  Save, 
  AlertTriangle,
  Eye,
  Edit,
  Sparkles,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StepPromptReviewProps {
  config: AgentConfig;
  onPrev: () => void;
  onComplete: (editedPrompt?: string) => void;
}

export function StepPromptReview({ config, onPrev, onComplete }: StepPromptReviewProps) {
  const { prompt: generatedPrompt } = usePromptGenerator(config);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(generatedPrompt);
  const [hasEdited, setHasEdited] = useState(false);

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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleResetToGenerated = () => {
    setEditedPrompt(generatedPrompt);
    setHasEdited(false);
    toast.success('Prompt restaurado para versão gerada');
  };

  const handleSave = () => {
    onComplete(hasEdited ? editedPrompt : undefined);
  };

  // Syntax highlighting for prompt sections (view mode only)
  const highlightedPrompt = generatedPrompt
    .replace(/<(\w+)>/g, '<span class="text-purple-400">&lt;$1&gt;</span>')
    .replace(/<\/(\w+)>/g, '<span class="text-purple-400">&lt;/$1&gt;</span>')
    .replace(/# (PASSO \d+:.+)/g, '<span class="text-blue-400 font-semibold"># $1</span>')
    .replace(/📅/g, '<span class="text-yellow-400">📅</span>')
    .replace(/•/g, '<span class="text-green-400">•</span>');

  // Count lines and characters
  const currentPrompt = isEditing ? editedPrompt : generatedPrompt;
  const lineCount = currentPrompt.split('\n').length;
  const charCount = currentPrompt.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-[hsl(var(--avivar-primary))]" />
          Revisão do Prompt Final
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Este é o prompt completo que será usado pelo seu agente de IA
        </p>
      </div>

      {/* Warning about editing */}
      <Card className="bg-amber-500/10 border-amber-500/30 max-w-3xl mx-auto">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">
              ⚠️ Edição Avançada
            </p>
            <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
              O prompt foi gerado automaticamente com base nas suas configurações.
              Editar manualmente requer conhecimento técnico e pode afetar o comportamento do agente.
              Alterações incorretas podem comprometer a qualidade das respostas.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Prompt
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
              Restaurar Original
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
            {lineCount} linhas • {charCount.toLocaleString()} caracteres
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar
          </Button>
        </div>
      </div>

      {/* Prompt Content */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] max-w-3xl mx-auto">
        <CardContent className="p-0">
          {isEditing ? (
            <Textarea
              value={editedPrompt}
              onChange={(e) => {
                setEditedPrompt(e.target.value);
                setHasEdited(true);
              }}
              className="min-h-[50vh] font-mono text-sm border-0 rounded-lg resize-none bg-[hsl(var(--avivar-background))] text-[hsl(var(--avivar-foreground))] focus-visible:ring-[hsl(var(--avivar-primary))]"
              placeholder="Digite o prompt do agente..."
            />
          ) : (
            <ScrollArea className="h-[50vh]">
              <pre 
                className="p-6 text-sm font-mono text-[hsl(var(--avivar-foreground))] whitespace-pre-wrap leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlightedPrompt }}
              />
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Status indicator */}
      {hasEdited && (
        <Card className="bg-blue-500/10 border-blue-500/30 max-w-3xl mx-auto">
          <CardContent className="p-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-[hsl(var(--avivar-foreground))]">
              Prompt editado manualmente - suas alterações serão salvas
            </span>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3 max-w-3xl mx-auto">
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
          💾 Salvar Agente
          <CheckCircle2 className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
