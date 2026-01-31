/**
 * Etapa 5 Simplificada: Base de Conhecimento (Opcional)
 * Permite upload de documentos para treinar o agente
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  X, 
  CheckCircle2, 
  Brain,
  Sparkles,
  SkipForward
} from 'lucide-react';
import { KnowledgeUpload } from '../../KnowledgeUpload';
import { KnowledgeFile } from '../../../types';

interface StepKnowledgeSimpleProps {
  knowledgeFiles: KnowledgeFile[];
  onFilesChange: (files: KnowledgeFile[]) => void;
  onSkip: () => void;
}

export function StepKnowledgeSimple({ 
  knowledgeFiles, 
  onFilesChange,
  onSkip
}: StepKnowledgeSimpleProps) {
  const [processingFile, setProcessingFile] = useState(false);

  const handleFileProcessed = (content: string, filename: string, fileSize: number) => {
    const extension = filename.split('.').pop()?.toLowerCase() || 'txt';
    const newFile: KnowledgeFile = {
      id: `file_${Date.now()}`,
      name: filename,
      content,
      size: fileSize,
      type: extension === 'pdf' ? 'application/pdf' : extension === 'md' ? 'text/markdown' : 'text/plain',
    };
    onFilesChange([...knowledgeFiles, newFile]);
  };

  const handleRemoveFile = (fileId: string) => {
    onFilesChange(knowledgeFiles.filter(f => f.id !== fileId));
  };

  const totalChars = knowledgeFiles.reduce((sum, f) => sum + f.content.length, 0);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--avivar-primary))] to-[hsl(280_80%_50%)] flex items-center justify-center mx-auto mb-4">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Base de Conhecimento
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Adicione documentos para treinar seu agente com informações específicas
        </p>
        <Badge variant="outline" className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))]">
          <Sparkles className="h-3 w-3 mr-1" />
          Etapa opcional
        </Badge>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Info Card */}
        <Card className="bg-[hsl(var(--avivar-primary)/0.1)] border-[hsl(var(--avivar-primary)/0.3)]">
          <CardContent className="p-4">
            <h4 className="font-medium text-[hsl(var(--avivar-primary))] mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              O que você pode adicionar?
            </h4>
            <ul className="text-sm text-[hsl(var(--avivar-muted-foreground))] space-y-1">
              <li>• Perguntas e respostas frequentes (FAQ)</li>
              <li>• Informações sobre procedimentos e serviços</li>
              <li>• Políticas de cancelamento e reagendamento</li>
              <li>• Instruções pré e pós-procedimento</li>
              <li>• Qualquer documento em .txt, .md ou .pdf</li>
            </ul>
          </CardContent>
        </Card>

        {/* Upload Component */}
        <KnowledgeUpload 
          onFileProcessed={handleFileProcessed}
          isProcessing={processingFile}
        />

        {/* Uploaded Files List */}
        {knowledgeFiles.length > 0 && (
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                <h4 className="font-medium text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                  Documentos Adicionados
                </h4>
                <Badge className="bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))]">
                  {knowledgeFiles.length} arquivo{knowledgeFiles.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {knowledgeFiles.map((file) => (
                  <div 
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--avivar-muted))]"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                      <div>
                        <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">
                          {file.name}
                        </p>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                          {(file.size / 1024).toFixed(1)} KB • {file.content.length.toLocaleString()} caracteres
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(file.id)}
                      className="text-[hsl(var(--avivar-muted-foreground))] hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[hsl(var(--avivar-border))]">
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                  Total: {totalChars.toLocaleString()} caracteres de conhecimento
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skip Button */}
        <div className="text-center pt-4">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Pular etapa e adicionar depois
          </Button>
        </div>
      </div>
    </div>
  );
}
