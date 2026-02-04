/**
 * CPG Advocacia Médica - Gerador de Peças com IA
 * Criação de documentos jurídicos assistida por IA
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Sparkles,
  FileText,
  Send,
  Copy,
  Download,
  Loader2,
  RefreshCw,
  History,
  Wand2,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface GeneratedDocument {
  id: string;
  title: string;
  document_type: string;
  content: string | null;
  generation_status: string;
  created_at: string;
  ipromed_legal_clients?: { name: string } | null;
  ipromed_legal_cases?: { title: string } | null;
}

const documentTypes = [
  { value: 'peticao_inicial', label: 'Petição Inicial' },
  { value: 'contestacao', label: 'Contestação' },
  { value: 'recurso', label: 'Recurso' },
  { value: 'parecer', label: 'Parecer Jurídico' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'notificacao', label: 'Notificação Extrajudicial' },
  { value: 'procuracao', label: 'Procuração' },
  { value: 'tcle', label: 'TCLE' },
];

const promptTemplates: Record<string, string> = {
  peticao_inicial: `Elabore uma petição inicial completa para o seguinte caso:

FATOS:
{fatos}

FUNDAMENTOS JURÍDICOS:
{fundamentos}

PEDIDOS:
{pedidos}

Inclua: qualificação das partes, dos fatos, fundamentos legais detalhados, pedidos específicos e valor da causa.`,

  contestacao: `Elabore uma contestação para o seguinte caso:

RESUMO DA AÇÃO:
{resumo}

ARGUMENTOS DE DEFESA:
{defesa}

Inclua: preliminares se aplicável, contestação do mérito, impugnação específica dos fatos e pedidos.`,

  parecer: `Elabore um parecer jurídico sobre:

CONSULTA:
{consulta}

DOCUMENTOS ANALISADOS:
{documentos}

Inclua: resumo da consulta, análise jurídica, fundamentação legal, riscos envolvidos e conclusão com recomendações.`,

  contrato: `Elabore um contrato de {tipo_contrato}:

PARTES:
{partes}

OBJETO:
{objeto}

CONDIÇÕES:
{condicoes}

Inclua: qualificação completa das partes, cláusulas essenciais, obrigações, penalidades e foro.`,
};

export default function AIDocumentGenerator() {
  const [activeTab, setActiveTab] = useState('generate');
  const [selectedType, setSelectedType] = useState('peticao_inicial');
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [caseId, setCaseId] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const queryClient = useQueryClient();

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ['ipromed-clients-dropdown'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ipromed_legal_clients')
        .select('id, name')
        .order('name');
      return data || [];
    },
  });

  // Fetch cases
  const { data: cases = [] } = useQuery({
    queryKey: ['ipromed-cases-dropdown'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ipromed_legal_cases')
        .select('id, title, case_number')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Fetch history
  const { data: history = [] } = useQuery({
    queryKey: ['ipromed-ai-documents'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ipromed_ai_documents')
        .select(`
          *,
          ipromed_legal_clients(name),
          ipromed_legal_cases(title)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      return data as GeneratedDocument[] || [];
    },
  });

  // Generate document
  const generateDocument = async () => {
    if (!prompt.trim()) {
      toast.error('Descreva o documento que deseja gerar');
      return;
    }

    setIsGenerating(true);
    setGeneratedContent('');

    // Preparar o prompt final - substituir placeholders por texto real
    const docType = documentTypes.find(d => d.value === selectedType)?.label || 'Documento';
    const selectedClient = clients.find(c => c.id === clientId);
    const selectedCase = cases.find(c => c.id === caseId);
    
    // Build enriched prompt
    let enrichedPrompt = prompt;
    
    // Replace common placeholders with actual instructions
    enrichedPrompt = enrichedPrompt
      .replace(/\{consulta\}/g, title || 'conforme descrito abaixo')
      .replace(/\{documentos\}/g, 'conforme informações fornecidas')
      .replace(/\{fatos\}/g, 'conforme descrito')
      .replace(/\{fundamentos\}/g, 'fundamentação jurídica aplicável')
      .replace(/\{pedidos\}/g, 'pedidos pertinentes ao caso')
      .replace(/\{resumo\}/g, 'resumo do caso')
      .replace(/\{defesa\}/g, 'argumentos de defesa')
      .replace(/\{tipo_contrato\}/g, 'prestação de serviços médicos')
      .replace(/\{partes\}/g, 'partes envolvidas')
      .replace(/\{objeto\}/g, 'objeto do contrato')
      .replace(/\{condicoes\}/g, 'condições acordadas');

    try {
      // Save to database first
      const { data: docRecord, error: insertError } = await supabase
        .from('ipromed_ai_documents')
        .insert([{
          title: title || `${docType} - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
          document_type: selectedType,
          prompt_used: enrichedPrompt,
          client_id: clientId && clientId !== '__none__' ? clientId : null,
          case_id: caseId && caseId !== '__none__' ? caseId : null,
          generation_status: 'generating',
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      // Call AI edge function
      const { data, error } = await supabase.functions.invoke('ai-legal-document', {
        body: {
          prompt: enrichedPrompt,
          documentType: selectedType,
          context: {
            clientId: clientId && clientId !== '__none__' ? clientId : null,
            caseId: caseId && caseId !== '__none__' ? caseId : null,
            clientName: selectedClient?.name,
            caseNumber: selectedCase?.case_number,
            title: title,
          },
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.error) {
        console.error('AI returned error:', data.error);
        throw new Error(data.error);
      }

      const content = data?.content;
      
      if (!content || content.trim() === '') {
        throw new Error('Resposta vazia da IA');
      }
      
      setGeneratedContent(content);

      // Update record with content
      await supabase
        .from('ipromed_ai_documents')
        .update({
          content,
          generation_status: 'completed',
        })
        .eq('id', docRecord.id);

      queryClient.invalidateQueries({ queryKey: ['ipromed-ai-documents'] });
      toast.success('Documento gerado com sucesso!');
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error(`Erro ao gerar documento: ${error.message || 'Tente novamente'}`);
      
      // Update status to failed if we have a record
      setGeneratedContent('');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackDocument = () => {
    // This is no longer used as fallback - we show error instead
    const docType = documentTypes.find(d => d.value === selectedType)?.label || 'Documento';
    return `# ${docType}

## ${title || 'Título do Documento'}

*Erro ao gerar documento com IA. Por favor, tente novamente.*

---

Data: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('Copiado para a área de transferência');
  };

  const useTemplate = () => {
    const template = promptTemplates[selectedType] || promptTemplates.peticao_inicial;
    setPrompt(template);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            Criação de Peças com IA
          </h1>
          <p className="text-sm text-muted-foreground">
            Gere documentos jurídicos assistido por inteligência artificial
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate" className="gap-2">
            <Wand2 className="h-4 w-4" />
            Gerar Documento
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="mt-4 sm:mt-6">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Input Panel */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-base sm:text-lg">Configuração</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">Tipo de Documento</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="h-10 sm:h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">Título (opcional)</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nome do documento"
                    className="h-10 sm:h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm">Cliente</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger className="h-10 sm:h-11">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm">Processo</Label>
                    <Select value={caseId} onValueChange={setCaseId}>
                      <SelectTrigger className="h-10 sm:h-11">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {cases.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.case_number || c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Instruções para a IA</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={useTemplate}
                      className="text-xs text-purple-600 h-8 px-2"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Template
                    </Button>
                  </div>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Descreva os detalhes do documento..."
                    rows={6}
                    className="resize-none text-sm"
                  />
                </div>

                <Button
                  className="w-full gap-2 bg-purple-600 hover:bg-purple-700 h-11"
                  onClick={generateDocument}
                  disabled={isGenerating || !prompt.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Gerar Documento
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Output Panel */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg">Resultado</CardTitle>
                  {generatedContent && (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8 px-2 sm:px-3">
                        <Copy className="h-3.5 w-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">Copiar</span>
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3">
                        <Download className="h-3.5 w-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">Exportar</span>
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-[250px] sm:h-[400px] text-muted-foreground">
                    <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-purple-600 mb-3 sm:mb-4" />
                    <p className="font-medium text-sm sm:text-base">Gerando documento...</p>
                    <p className="text-xs sm:text-sm">Isso pode levar alguns segundos</p>
                  </div>
                ) : generatedContent ? (
                  <ScrollArea className="h-[250px] sm:h-[400px] border rounded-lg p-3 sm:p-4 bg-gray-50">
                    <pre className="whitespace-pre-wrap text-xs sm:text-sm font-sans">
                      {generatedContent}
                    </pre>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[250px] sm:h-[400px] text-muted-foreground">
                    <FileText className="h-10 w-10 sm:h-12 sm:w-12 opacity-20 mb-3 sm:mb-4" />
                    <p className="font-medium text-sm sm:text-base">Nenhum documento gerado</p>
                    <p className="text-xs sm:text-sm text-center px-4">Configure e clique em "Gerar Documento"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                  <History className="h-12 w-12 opacity-20 mb-4" />
                  <p className="font-medium">Nenhum documento gerado</p>
                  <p className="text-sm">Os documentos gerados aparecerão aqui</p>
                </div>
              ) : (
                <div className="divide-y">
                  {history.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer flex items-start justify-between"
                      onClick={() => {
                        setGeneratedContent(doc.content || '');
                        setActiveTab('generate');
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <FileCheck className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {documentTypes.find(t => t.value === doc.document_type)?.label || doc.document_type}
                            </Badge>
                            {doc.ipromed_legal_clients?.name && (
                              <span className="text-xs text-muted-foreground">
                                {doc.ipromed_legal_clients.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          doc.generation_status === 'completed' 
                            ? 'bg-emerald-100 text-emerald-700'
                            : doc.generation_status === 'failed'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }>
                          {doc.generation_status === 'completed' ? 'Concluído' : 
                           doc.generation_status === 'failed' ? 'Falhou' : 'Gerando'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(doc.created_at), 'dd/MM/yy HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
