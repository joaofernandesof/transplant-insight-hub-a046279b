/**
 * AvivarKnowledge - Base de Conhecimento e Finalização do Agente
 * Salva o agente na tabela avivar_agents ao finalizar
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Eye, 
  ChevronDown,
  Sparkles,
  Settings,
  Loader2,
  Database,
  Rocket,
  CheckCircle2,
  Bot
} from 'lucide-react';
import { KnowledgeUpload } from './components/KnowledgeUpload';
import { useAgentConfig } from './hooks/useAgentConfig';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Document {
  id: string;
  name: string;
  content: string;
  chunks: number;
  createdAt: string;
}

export default function AvivarKnowledge() {
  const navigate = useNavigate();
  const { config, resetConfig } = useAgentConfig();
  
  const [text, setText] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [chunkSize, setChunkSize] = useState(1000);
  const [overlap, setOverlap] = useState(200);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  
  // Agent name dialog
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [agentName, setAgentName] = useState(config.attendantName || 'Meu Agente');
  const [isSavingAgent, setIsSavingAgent] = useState(false);

  const estimatedChunks = text ? Math.ceil(text.length / (chunkSize - overlap)) : 0;

  const handleFileProcessed = (content: string, filename: string, fileSize: number) => {
    setText(content);
    setDocumentName(filename);
  };

  // Split text into chunks
  const splitIntoChunks = (text: string, size: number, overlapSize: number): string[] => {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + size, text.length);
      chunks.push(text.slice(start, end));
      start = end - overlapSize;
      if (start < 0) start = 0;
      if (end === text.length) break;
    }
    
    return chunks;
  };

  const handleAddDocument = () => {
    if (!text) return;

    const chunks = splitIntoChunks(text, chunkSize, overlap);
    const docName = documentName || `documento_${Date.now()}.txt`;
    
    setDocuments(prev => [{
      id: crypto.randomUUID(),
      name: docName,
      content: text,
      chunks: chunks.length,
      createdAt: new Date().toLocaleString('pt-BR')
    }, ...prev]);

    setText('');
    setDocumentName('');
    toast.success(`"${docName}" adicionado com ${chunks.length} chunks`);
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    toast.info('Documento removido');
  };

  const handleFinalize = () => {
    setShowAgentDialog(true);
  };

  const saveAgent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (!agentName.trim()) {
      toast.error('Digite um nome para o agente');
      return;
    }

    setIsSavingAgent(true);
    setProgress(0);
    setProgressMessage('Salvando agente...');

    try {
      // Step 1: Create agent
      setProgress(20);
      setProgressMessage('Criando agente...');

      const knowledgeFiles = documents.map(doc => ({
        name: doc.name,
        content: doc.content,
        chunks: doc.chunks
      }));

      const agentPayload = {
        user_id: user.id,
        name: agentName.trim(),
        personality: config.aiIdentity || null,
        knowledge_files: knowledgeFiles,
        target_kanbans: ['comercial'],
        target_stages: ['novo_lead', 'qualificacao'],
        openai_api_key_hash: config.openaiApiKey ? 'configured' : null,
        tone_of_voice: config.toneOfVoice || 'cordial',
        ai_instructions: config.aiInstructions || null,
        ai_restrictions: config.aiRestrictions || null,
        fluxo_atendimento: config.fluxoAtendimento || {},
        company_name: config.companyName || null,
        professional_name: config.professionalName || null,
        services: config.services || [],
        schedule: config.schedule || {},
        is_active: true
      };

      const { data: agentData, error: agentError } = await supabase
        .from('avivar_agents')
        .insert(agentPayload as any)
        .select()
        .single();

      if (agentError) {
        console.error('Agent save error:', agentError);
        throw new Error('Erro ao criar agente');
      }

      setProgress(60);
      setProgressMessage('Salvando base de conhecimento...');

      // Step 2: Save documents to knowledge base linked to this agent
      for (const doc of documents) {
        const chunks = splitIntoChunks(doc.content, chunkSize, overlap);
        
        const { data: docData, error: docError } = await supabase
          .from('avivar_knowledge_documents')
          .insert({
            user_id: user.id,
            agent_id: agentData.id, // Link document to the agent
            name: doc.name,
            content: doc.content,
            chunks_count: chunks.length,
            chunk_size: chunkSize,
            overlap: overlap
          })
          .select()
          .single();

        if (!docError && docData) {
          const chunkRecords = chunks.map((content, index) => ({
            document_id: docData.id,
            content: content,
            chunk_index: index
          }));

          await supabase.from('avivar_knowledge_chunks').insert(chunkRecords);
        }
      }

      setProgress(100);
      setProgressMessage('Agente criado com sucesso!');

      // Clean up wizard state
      resetConfig();

      toast.success(`🎉 Agente "${agentName}" criado com sucesso!`, {
        description: 'Configure os kanbans de atuação na página de agentes'
      });

      // Redirect to agents page
      setTimeout(() => {
        navigate('/avivar/config');
      }, 1500);

    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erro ao salvar agente');
      setIsSavingAgent(false);
    }
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
          Adicione documentos para treinar seu agente. Ao finalizar, ele será salvo.
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
              <KnowledgeUpload 
                onFileProcessed={handleFileProcessed}
                isProcessing={isProcessing}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text">
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[hsl(var(--avivar-foreground))]">Nome do Documento</Label>
                <Input
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Ex: precos_procedimentos.txt"
                  className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                />
              </div>
              
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

      {/* Add Document Button */}
      <Button
        onClick={handleAddDocument}
        disabled={!text}
        variant="outline"
        className="w-full border-[hsl(var(--avivar-primary))] text-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
      >
        <FileText className="h-4 w-4 mr-2" />
        Adicionar Documento
      </Button>

      {/* Documents List */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <Database className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            Documentos Adicionados ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-[hsl(var(--avivar-muted-foreground))]">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum documento adicionado</p>
              <p className="text-sm">Adicione documentos para treinar seu agente</p>
            </div>
          ) : (
            documents.map((doc) => (
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeDocument(doc.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}

          {documents.length > 0 && (
            <div className="pt-2 border-t border-[hsl(var(--avivar-border))]">
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] flex items-center gap-2">
                <Database className="h-4 w-4" />
                Total: {totalChunks} chunks na base de conhecimento
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Finalize Button */}
      <Button
        onClick={handleFinalize}
        className="w-full bg-gradient-to-r from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] hover:from-[hsl(270_75%_50%)] hover:to-[hsl(280_80%_55%)] text-white h-12 text-lg"
      >
        <Rocket className="h-5 w-5 mr-2" />
        Finalizar e Criar Agente
      </Button>

      {/* Agent Name Dialog */}
      <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <DialogContent className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <Bot className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
              Nomeie seu Agente
            </DialogTitle>
          </DialogHeader>

          {isSavingAgent ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                {progress === 100 ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--avivar-primary))]" />
                )}
                <span className="text-[hsl(var(--avivar-foreground))]">{progressMessage}</span>
              </div>
              <Progress value={progress} className="h-2" />
              {progress === 100 && (
                <p className="text-sm text-green-500">Redirecionando para página de agentes...</p>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[hsl(var(--avivar-foreground))]">Nome do Agente</Label>
                <Input
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Ex: Ana, Sofia, Carlos..."
                  className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                />
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                  Este nome identificará seu agente na lista de agentes
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[hsl(var(--avivar-muted))] border border-[hsl(var(--avivar-border))]">
                <p className="text-sm text-[hsl(var(--avivar-foreground))] font-medium mb-2">
                  Resumo do Agente
                </p>
                <ul className="text-xs text-[hsl(var(--avivar-muted-foreground))] space-y-1">
                  <li>• Empresa: {config.companyName || 'Não definida'}</li>
                  <li>• Tom de voz: {config.toneOfVoice || 'Cordial'}</li>
                  <li>• Documentos: {documents.length} ({totalChunks} chunks)</li>
                  <li>• Serviços: {config.services?.filter(s => s.enabled).length || 0}</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAgentDialog(false)}
                  className="flex-1 border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={saveAgent}
                  disabled={!agentName.trim()}
                  className="flex-1 bg-gradient-to-r from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] text-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Criar Agente
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
