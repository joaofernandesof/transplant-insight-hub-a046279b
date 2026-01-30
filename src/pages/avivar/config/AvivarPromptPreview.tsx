/**
 * AvivarPromptPreview - Preview do Prompt Final
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Download, Edit, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAgentConfig } from './hooks/useAgentConfig';
import { usePromptGenerator } from './hooks/usePromptGenerator';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function AvivarPromptPreview() {
  const navigate = useNavigate();
  const { config } = useAgentConfig();
  const { prompt } = usePromptGenerator(config);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    toast.success('Prompt copiado para a área de transferência!');
  };

  const handleDownload = () => {
    const blob = new Blob([prompt], { type: 'text/plain' });
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

  // Syntax highlighting for prompt sections
  const highlightedPrompt = prompt
    .replace(/<(\w+)>/g, '<span class="text-purple-400">&lt;$1&gt;</span>')
    .replace(/<\/(\w+)>/g, '<span class="text-purple-400">&lt;/$1&gt;</span>')
    .replace(/# (PASSO \d+:.+)/g, '<span class="text-blue-400 font-semibold"># $1</span>')
    .replace(/📅/g, '<span class="text-yellow-400">📅</span>')
    .replace(/•/g, '<span class="text-green-400">•</span>');

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            Preview do Prompt Final
            <Sparkles className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
          </h1>
          <p className="text-[hsl(var(--avivar-muted-foreground))]">
            Prompt completo que será usado pelo agente
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCopy}
            className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar .txt
          </Button>
          <Button
            onClick={() => navigate('/avivar/config')}
            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Prompt Preview */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardContent className="p-0">
          <ScrollArea className="h-[60vh]">
            <pre 
              className="p-6 text-sm font-mono text-[hsl(var(--avivar-foreground))] whitespace-pre-wrap leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightedPrompt }}
            />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-[hsl(var(--avivar-primary)/0.05)] border-[hsl(var(--avivar-primary)/0.3)]">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
          <p className="text-sm text-[hsl(var(--avivar-foreground))]">
            💡 Prompt gerado automaticamente com base nas suas configurações. 
            Teste no Chat ou integre ao seu sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
