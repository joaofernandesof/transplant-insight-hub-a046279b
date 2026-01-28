/**
 * IPROMED - AI Legal Assistant Component
 * Interface para assistente de IA jurídica com geração de documentos
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sparkles,
  FileText,
  Send,
  Loader2,
  Copy,
  Download,
  RefreshCw,
  MessageSquare,
  FileSignature,
  Scale,
  AlertTriangle,
  CheckCircle2,
  Wand2,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DocumentTemplate {
  id: string;
  code: string;
  title: string;
  category: string;
  description: string | null;
}

const documentCategories = [
  { value: 'contrato', label: 'Contratos', icon: FileSignature },
  { value: 'parecer', label: 'Pareceres', icon: Scale },
  { value: 'notificacao', label: 'Notificações', icon: AlertTriangle },
  { value: 'termo', label: 'Termos', icon: CheckCircle2 },
  { value: 'peticao', label: 'Petições', icon: FileText },
];

const quickPrompts = [
  {
    title: "Analisar Contrato",
    prompt: "Analise os principais riscos e pontos de atenção do seguinte contrato médico:",
    icon: FileText,
  },
  {
    title: "Resposta CRM",
    prompt: "Elabore uma resposta técnica para um procedimento administrativo no CRM sobre:",
    icon: Scale,
  },
  {
    title: "Parecer Jurídico",
    prompt: "Elabore um parecer jurídico sobre a seguinte situação médico-legal:",
    icon: BookOpen,
  },
  {
    title: "LGPD Médica",
    prompt: "Explique as obrigações de LGPD aplicáveis à seguinte situação em clínica médica:",
    icon: Lightbulb,
  },
];

export default function AILegalAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [generatedDocument, setGeneratedDocument] = useState<string>("");

  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['ipromed-document-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_document_templates')
        .select('id, title, category, description')
        .eq('is_active', true)
        .order('title');
      
      if (error) throw error;
      return (data || []).map(t => ({
        ...t,
        code: t.id, // use id as code fallback
      })) as DocumentTemplate[];
    },
  });

  // Fetch clients for document generation
  const { data: clients = [] } = useQuery({
    queryKey: ['ipromed-clients-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_legal_clients')
        .select('id, name')
        .eq('status', 'ativo')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Simulate AI response (in production, this would call an edge function)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: generateMockResponse(inputMessage),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      toast.error("Erro ao processar mensagem");
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockResponse = (input: string): string => {
    // Mock responses based on keywords
    if (input.toLowerCase().includes('contrato')) {
      return `**Análise de Contrato Médico**

Baseado na sua consulta, aqui estão os pontos principais a considerar:

1. **Cláusulas Essenciais**
   - Objeto e escopo dos serviços
   - Responsabilidades das partes
   - Condições de pagamento
   - Prazo e renovação

2. **Riscos Identificados**
   - Verifique cláusulas de responsabilidade civil
   - Atenção ao sigilo médico e LGPD
   - Cláusulas penais e multas

3. **Recomendações**
   - Incluir cláusula de mediação/arbitragem
   - Definir claramente hipóteses de rescisão
   - Prever atualização monetária

*Esta é uma análise preliminar. Para parecer formal, gere um documento através da aba "Documentos".*`;
    }

    if (input.toLowerCase().includes('crm') || input.toLowerCase().includes('ético')) {
      return `**Orientação sobre Procedimento no CRM**

Para processos éticos no Conselho Regional de Medicina:

1. **Etapas do Processo**
   - Instauração de sindicância
   - Defesa prévia (prazo de 30 dias)
   - Instrução processual
   - Julgamento pelo Conselho

2. **Estratégia de Defesa**
   - Documentar todo o prontuário médico
   - Reunir evidências do procedimento
   - Demonstrar cumprimento de protocolos
   - Buscar depoimentos de testemunhas

3. **Prazos Importantes**
   - Defesa: 30 dias da notificação
   - Recurso: 30 dias da decisão

*Consulte a Dra. Larissa ou Dra. Caroline para acompanhamento específico.*`;
    }

    return `**Resposta da IA Jurídica IPROMED**

Analisei sua consulta e aqui está minha orientação:

${input.length > 50 ? 
  'Esta é uma questão complexa que envolve múltiplos aspectos do Direito Médico. Recomendo:' :
  'Para esta questão, considere os seguintes pontos:'}

1. **Análise Preliminar**
   - Identifique todas as partes envolvidas
   - Documente cronologicamente os fatos
   - Preserve evidências relevantes

2. **Próximos Passos**
   - Agende consulta com a equipe jurídica
   - Prepare documentação de suporte
   - Considere aspectos de confidencialidade

3. **Legislação Aplicável**
   - Código de Ética Médica
   - Código Civil (responsabilidade)
   - Lei 13.709/2018 (LGPD)

*Para documentos formais, utilize a aba "Documentos".*`;
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt + " ");
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copiado para área de transferência");
  };

  const handleGenerateDocument = async () => {
    if (!selectedTemplate) {
      toast.error("Selecione um template");
      return;
    }

    setIsLoading(true);
    try {
      // Mock document generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const template = templates.find(t => t.id === selectedTemplate);
      const client = clients.find(c => c.id === selectedClient);

      setGeneratedDocument(`# ${template?.title || 'Documento'}

**Cliente:** ${client?.name || 'Não especificado'}
**Data:** ${new Date().toLocaleDateString('pt-BR')}

---

## CONSIDERAÇÕES PRELIMINARES

Este documento foi gerado automaticamente pelo sistema IPROMED com base no template "${template?.title}".

## CONTEÚDO

[Conteúdo do documento seria gerado aqui com base no template e dados do cliente]

## FUNDAMENTAÇÃO LEGAL

- Código de Ética Médica (Resolução CFM 2.217/2018)
- Código de Defesa do Consumidor (Lei 8.078/90)
- Lei Geral de Proteção de Dados (Lei 13.709/18)

---

*Documento gerado em ${new Date().toLocaleString('pt-BR')}*
*IPROMED - Instituto de Proteção Médica*`);

      toast.success("Documento gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar documento");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            IA Jurídica
          </h2>
          <p className="text-muted-foreground">
            Assistente inteligente para análises e documentos jurídicos
          </p>
        </div>
        <Badge className="bg-purple-100 text-purple-700 gap-1">
          <Sparkles className="h-3 w-3" />
          Beta
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat Jurídico
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Gerar Documentos
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Quick Prompts */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wand2 className="h-4 w-4" />
                    Prompts Rápidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quickPrompts.map((prompt, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 text-xs"
                      onClick={() => handleQuickPrompt(prompt.prompt)}
                    >
                      <prompt.icon className="h-3 w-3" />
                      {prompt.title}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <Card className="lg:col-span-3 border-none shadow-md">
              <CardContent className="p-0">
                {/* Messages */}
                <ScrollArea className="h-[400px] p-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <Sparkles className="h-12 w-12 mb-4 opacity-20" />
                      <p className="font-medium">Assistente Jurídico IPROMED</p>
                      <p className="text-sm mt-1">
                        Faça perguntas sobre direito médico, analise contratos ou solicite orientações jurídicas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-3",
                            message.role === 'user' ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg p-4",
                              message.role === 'user'
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              {message.content.split('\n').map((line, i) => (
                                <p key={i} className="mb-2 last:mb-0">
                                  {line.startsWith('**') && line.endsWith('**') 
                                    ? <strong>{line.slice(2, -2)}</strong>
                                    : line.startsWith('- ') 
                                    ? <span className="block ml-4">• {line.slice(2)}</span>
                                    : line}
                                </p>
                              ))}
                            </div>
                            {message.role === 'assistant' && (
                              <div className="flex gap-2 mt-3 pt-2 border-t border-border/50">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleCopyMessage(message.content)}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copiar
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex gap-3">
                          <div className="bg-muted rounded-lg p-4">
                            <Loader2 className="h-5 w-5 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Digite sua pergunta jurídica..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="min-h-[60px] resize-none"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="px-6"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Generator */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSignature className="h-4 w-4" />
                  Gerar Documento
                </CardTitle>
                <CardDescription>
                  Selecione um template e cliente para gerar documentos automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Template</label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentCategories.map((cat) => (
                        <div key={cat.value}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            {cat.label}
                          </div>
                          {templates
                            .filter(t => t.category === cat.value)
                            .map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.title}
                              </SelectItem>
                            ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Cliente (opcional)</label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleGenerateDocument}
                  disabled={!selectedTemplate || isLoading}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  Gerar Documento
                </Button>
              </CardContent>
            </Card>

            {/* Document Preview */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Preview
                  </CardTitle>
                  {generatedDocument && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopyMessage(generatedDocument)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {generatedDocument ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {generatedDocument.split('\n').map((line, i) => {
                        if (line.startsWith('# ')) {
                          return <h1 key={i} className="text-xl font-bold">{line.slice(2)}</h1>;
                        }
                        if (line.startsWith('## ')) {
                          return <h2 key={i} className="text-lg font-semibold mt-4">{line.slice(3)}</h2>;
                        }
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>;
                        }
                        if (line.startsWith('- ')) {
                          return <li key={i} className="ml-4">{line.slice(2)}</li>;
                        }
                        if (line === '---') {
                          return <hr key={i} className="my-4" />;
                        }
                        if (line.startsWith('*') && line.endsWith('*')) {
                          return <p key={i} className="text-sm text-muted-foreground italic">{line.slice(1, -1)}</p>;
                        }
                        return <p key={i}>{line}</p>;
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4 opacity-20" />
                      <p>Selecione um template para gerar um documento</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
