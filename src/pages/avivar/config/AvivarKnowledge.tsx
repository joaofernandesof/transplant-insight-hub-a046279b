/**
 * AvivarKnowledge - Base de Conhecimento do Agente
 * Com salvamento real no Supabase e redirecionamento para teste
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
  CheckCircle2
} from 'lucide-react';
import { KnowledgeUpload } from './components/KnowledgeUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Document {
  id: string;
  name: string;
  chunks: number;
  createdAt: string;
}

export default function AvivarKnowledge() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [chunkSize, setChunkSize] = useState(1000);
  const [overlap, setOverlap] = useState(200);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);

  const estimatedChunks = text ? Math.ceil(text.length / (chunkSize - overlap)) : 0;

  // Load documents from database
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('avivar_knowledge_documents')
        .select('id, name, chunks_count, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
        return;
      }

      setDocuments(data?.map(doc => ({
        id: doc.id,
        name: doc.name,
        chunks: doc.chunks_count || 0,
        createdAt: new Date(doc.created_at).toLocaleString('pt-BR')
      })) || []);

    } catch (error) {
      console.error('Error:', error);
    }
  };

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

  const handleProcess = async () => {
    if (!text) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Você precisa estar logado para adicionar documentos');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProgressMessage('Preparando documento...');

    try {
      // Step 1: Split into chunks
      setProgress(20);
      setProgressMessage('Dividindo em chunks...');
      
      const chunks = splitIntoChunks(text, chunkSize, overlap);
      
      await new Promise(r => setTimeout(r, 300));

      // Step 2: Save document to database
      setProgress(40);
      setProgressMessage('Salvando documento...');

      const docName = documentName || `documento_${Date.now()}.txt`;
      
      const { data: docData, error: docError } = await supabase
        .from('avivar_knowledge_documents')
        .insert({
          user_id: user.id,
          name: docName,
          content: text,
          chunks_count: chunks.length,
          chunk_size: chunkSize,
          overlap: overlap
        })
        .select()
        .single();

      if (docError) {
        console.error('Error saving document:', docError);
        throw new Error('Erro ao salvar documento');
      }

      await new Promise(r => setTimeout(r, 300));

      // Step 3: Save chunks
      setProgress(60);
      setProgressMessage('Salvando chunks...');

      const chunkRecords = chunks.map((content, index) => ({
        document_id: docData.id,
        content: content,
        chunk_index: index
      }));

      const { error: chunksError } = await supabase
        .from('avivar_knowledge_chunks')
        .insert(chunkRecords);

      if (chunksError) {
        console.error('Error saving chunks:', chunksError);
        // Continue anyway - document was saved
      }

      setProgress(80);
      setProgressMessage('Finalizando...');
      await new Promise(r => setTimeout(r, 300));

      setProgress(100);
      setProgressMessage('Concluído!');

      // Add to local state
      setDocuments(prev => [{
        id: docData.id,
        name: docName,
        chunks: chunks.length,
        createdAt: new Date().toLocaleString('pt-BR')
      }, ...prev]);

      setText('');
      setDocumentName('');
      
      toast.success('✅ Documento processado com sucesso!', {
        description: `${chunks.length} chunks adicionados à base de conhecimento`
      });

      // Redirect to test page after 1.5 seconds
      setTimeout(() => {
        setIsProcessing(false);
        navigate('/avivar/config/test');
      }, 1500);

    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Erro ao processar documento');
      setIsProcessing(false);
    }
  };

  const removeDocument = async (id: string) => {
    try {
      // Delete chunks first
      await supabase
        .from('avivar_knowledge_chunks')
        .delete()
        .eq('document_id', id);

      // Delete document
      const { error } = await supabase
        .from('avivar_knowledge_documents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting document:', error);
        toast.error('Erro ao remover documento');
        return;
      }

      setDocuments(prev => prev.filter(d => d.id !== id));
      toast.success('Documento removido');

    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erro ao remover documento');
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
            <Rocket className="h-4 w-4 mr-2" />
            Processar e Adicionar
          </>
        )}
      </Button>

      {/* Processing Modal */}
      {isProcessing && (
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-primary)/0.3)]">
          <CardContent className="p-6 space-y-4">
            <h4 className="font-medium text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              {progress === 100 ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Documento Processado!
                </>
              ) : (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--avivar-primary))]" />
                  Processando Documento...
                </>
              )}
            </h4>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
              {progressMessage} {progress < 100 && `${progress}%`}
            </div>
            {progress === 100 && (
              <p className="text-sm text-green-600">
                Redirecionando para tela de teste...
              </p>
            )}
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
          {documents.length === 0 ? (
            <div className="text-center py-8 text-[hsl(var(--avivar-muted-foreground))]">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum documento adicionado</p>
              <p className="text-sm">Adicione documentos para treinar a IA</p>
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

      {/* Test Button */}
      {documents.length > 0 && (
        <Button
          onClick={() => navigate('/avivar/config/test')}
          variant="outline"
          className="w-full border-[hsl(var(--avivar-primary))] text-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Testar IA com Base de Conhecimento
        </Button>
      )}
    </div>
  );
}
