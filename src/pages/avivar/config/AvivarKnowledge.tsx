/**
 * AvivarKnowledge - Base de Conhecimento do Agente
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Eye, 
  ChevronDown,
  Sparkles,
  Settings,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  name: string;
  chunks: number;
  createdAt: string;
}

export default function AvivarKnowledge() {
  const [text, setText] = useState('');
  const [chunkSize, setChunkSize] = useState(1000);
  const [overlap, setOverlap] = useState(200);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [documents, setDocuments] = useState<Document[]>([
    { id: '1', name: 'informacoes_clinica.txt', chunks: 12, createdAt: '30/01/2026 14:35' },
    { id: '2', name: 'precos_procedimentos.txt', chunks: 5, createdAt: '30/01/2026 10:20' },
  ]);

  const estimatedChunks = text ? Math.ceil(text.length / (chunkSize - overlap)) : 0;

  const handleProcess = async () => {
    if (!text) return;

    setIsProcessing(true);
    setProgress(0);

    // Simulate processing
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 300));
      setProgress(i);
    }

    // Add new document
    setDocuments(prev => [...prev, {
      id: Date.now().toString(),
      name: `documento_${Date.now()}.txt`,
      chunks: estimatedChunks,
      createdAt: new Date().toLocaleString('pt-BR')
    }]);

    setText('');
    setIsProcessing(false);
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const totalChunks = documents.reduce((acc, d) => acc + d.chunks, 0);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
          Base de Conhecimento
          <Sparkles className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
        </h1>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Adicione documentos com informações da clínica. A IA usará para responder
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="text" className="space-y-4">
        <TabsList className="bg-[hsl(var(--avivar-muted))] border border-[hsl(var(--avivar-border))]">
          <TabsTrigger value="upload" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
            <Upload className="h-4 w-4 mr-2" />
            Upload de Arquivo
          </TabsTrigger>
          <TabsTrigger value="text" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Digitar/Colar Texto
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardContent className="p-6">
              <div className="border-2 border-dashed border-[hsl(var(--avivar-border))] rounded-xl p-12 text-center hover:border-[hsl(var(--avivar-primary))] transition-colors cursor-pointer">
                <Upload className="h-12 w-12 mx-auto text-[hsl(var(--avivar-muted-foreground))] mb-4" />
                <p className="text-[hsl(var(--avivar-foreground))] font-medium">
                  Arraste arquivo ou clique para selecionar
                </p>
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] mt-2">
                  Formatos: .txt, .md, .pdf | Máximo: 10MB
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text">
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardContent className="p-6 space-y-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Cole ou digite informações...
Exemplos:
- Preços dos procedimentos
- FAQs frequentes
- Políticas da clínica
- Diferenciais do tratamento"
                rows={10}
                className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
              />
              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  {text.length} caracteres
                </span>
                {text && (
                  <Badge variant="secondary" className="bg-[hsl(var(--avivar-muted))]">
                    ~{estimatedChunks} chunks estimados
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Advanced Settings */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
          >
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações Avançadas
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="bg-[hsl(var(--avivar-muted))] border-[hsl(var(--avivar-border))] mt-2">
            <CardContent className="p-4 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[hsl(var(--avivar-foreground))]">Tamanho do Chunk</Label>
                <Input
                  type="number"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(parseInt(e.target.value))}
                  className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                />
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Recomendado: 1000</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[hsl(var(--avivar-foreground))]">Overlap</Label>
                <Input
                  type="number"
                  value={overlap}
                  onChange={(e) => setOverlap(parseInt(e.target.value))}
                  className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                />
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Recomendado: 200</p>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Process Button */}
      <Button
        onClick={handleProcess}
        disabled={!text || isProcessing}
        className="w-full bg-gradient-to-r from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] hover:from-[hsl(270_75%_50%)] hover:to-[hsl(280_80%_55%)] text-white"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Processar e Adicionar
          </>
        )}
      </Button>

      {/* Processing Modal */}
      {isProcessing && (
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-primary)/0.3)]">
          <CardContent className="p-6 space-y-4">
            <h4 className="font-medium text-[hsl(var(--avivar-foreground))]">
              Processando Documento...
            </h4>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando embeddings... {progress}%
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <Database className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            Documentos na Base ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--avivar-muted))] border border-[hsl(var(--avivar-border))]"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-[hsl(var(--avivar-primary))]" />
                <div>
                  <p className="font-medium text-[hsl(var(--avivar-foreground))]">{doc.name}</p>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    {doc.chunks} chunks | {doc.createdAt}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-[hsl(var(--avivar-muted-foreground))]">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeDocument(doc.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="pt-2 border-t border-[hsl(var(--avivar-border))]">
            <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] flex items-center gap-2">
              <Database className="h-4 w-4" />
              Total: {totalChunks} chunks
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
