/**
 * CPG Advocacia Médica - AI Legal Intelligence Component (Fase 3)
 * AI-powered document generation and risk analysis
 * Connected to real Lovable AI via edge functions
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  FileText,
  AlertTriangle,
  Shield,
  Sparkles,
  Loader2,
  Copy,
  Download,
  RefreshCw,
  CheckCircle2,
  Scale,
  TrendingUp,
  BarChart3,
  Send,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

// Document types for AI generation - aligned with edge function
const documentTypes = [
  { id: "tcle", label: "TCLE - Termo de Consentimento", category: "consent" },
  { id: "parecer", label: "Parecer Jurídico", category: "opinion" },
  { id: "peticao_inicial", label: "Petição Inicial", category: "petition" },
  { id: "contestacao", label: "Contestação", category: "defense" },
  { id: "contrato", label: "Contrato de Serviços", category: "contract" },
  { id: "notificacao", label: "Notificação Extrajudicial", category: "notice" },
  { id: "procuracao", label: "Procuração Ad Judicia", category: "proxy" },
];

// Risk categories
const riskCategories = [
  { id: "crm", label: "Ético (CRM)", weight: 0.4 },
  { id: "civel", label: "Cível", weight: 0.35 },
  { id: "criminal", label: "Criminal", weight: 0.25 },
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AILegalIntelligenceProps {
  clientId?: string;
  clientName?: string;
  clientData?: {
    specialty?: string;
    procedures?: string;
    hasActiveLawsuits?: boolean;
    hasEthicsProceedings?: boolean;
    crmRisks?: string;
    civilRisks?: string;
    criminalRisks?: string;
    advertisingRisks?: string;
  };
}

export default function AILegalIntelligence({
  clientId,
  clientName,
  clientData,
}: AILegalIntelligenceProps) {
  const [activeTab, setActiveTab] = useState("generate");
  const [selectedDocType, setSelectedDocType] = useState("");
  const [context, setContext] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [riskAnalysis, setRiskAnalysis] = useState<{
    overall: number;
    classification: string;
    categories: { id: string; score: number; justificativa: string; recommendations: string[] }[];
  } | null>(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleGenerate = async () => {
    if (!selectedDocType) {
      toast.error("Selecione um tipo de documento");
      return;
    }

    setIsGenerating(true);
    setGeneratedContent("");

    try {
      const prompt = `
Elabore um documento jurídico completo para:
- Cliente: ${clientName || "Médico(a)"}
- Especialidade: ${clientData?.specialty || "Medicina Geral"}
- Procedimentos: ${clientData?.procedures || "Diversos"}

Contexto adicional: ${context || "Nenhum contexto adicional fornecido."}

Gere o documento completo, formatado em markdown, pronto para uso profissional.
      `.trim();

      const { data, error } = await supabase.functions.invoke("ai-legal-document", {
        body: {
          prompt,
          documentType: selectedDocType,
          context: {
            clientName,
            clientId,
          },
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setGeneratedContent(data.content || "Erro ao gerar documento.");
      toast.success("Documento gerado com sucesso!");
    } catch (error) {
      console.error("Error generating document:", error);
      toast.error("Erro ao gerar documento. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeRisk = async () => {
    setIsAnalyzing(true);
    setRiskAnalysis(null);

    try {
      const caseDescription = `
Análise de risco jurídico para:
- Médico(a): ${clientName || "Cliente"}
- Especialidade: ${clientData?.specialty || "Não informada"}
- Procedimentos realizados: ${clientData?.procedures || "Diversos"}
- Possui processos ativos: ${clientData?.hasActiveLawsuits ? "Sim" : "Não"}
- Possui procedimentos éticos: ${clientData?.hasEthicsProceedings ? "Sim" : "Não"}
- Riscos CRM identificados: ${clientData?.crmRisks || "Nenhum informado"}
- Riscos Cíveis identificados: ${clientData?.civilRisks || "Nenhum informado"}
- Riscos Criminais identificados: ${clientData?.criminalRisks || "Nenhum informado"}

Avalie o perfil de risco completo deste profissional médico.
      `.trim();

      const { data, error } = await supabase.functions.invoke("ai-legal-document", {
        body: {
          prompt: caseDescription,
          action: "risk_scoring",
          context: {
            clientName,
            clientId,
          },
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.riskData) {
        const rd = data.riskData;
        setRiskAnalysis({
          overall: rd.total_score || 0,
          classification: rd.classification || "medio",
          categories: [
            {
              id: "crm",
              score: rd.risk_crm?.score || 0,
              justificativa: rd.risk_crm?.justificativa || "",
              recommendations: rd.recommendations?.slice(0, 2) || [],
            },
            {
              id: "civel",
              score: rd.risk_civel?.score || 0,
              justificativa: rd.risk_civel?.justificativa || "",
              recommendations: rd.recommendations?.slice(2, 4) || [],
            },
            {
              id: "criminal",
              score: rd.risk_criminal?.score || 0,
              justificativa: rd.risk_criminal?.justificativa || "",
              recommendations: rd.recommendations?.slice(4) || [],
            },
          ],
        });
        toast.success("Análise de risco concluída!");
      } else {
        toast.error("Não foi possível processar a análise de risco.");
      }
    } catch (error) {
      console.error("Error analyzing risk:", error);
      toast.error("Erro ao analisar risco. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Legal Assistant Chat
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: chatInput.trim() };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const systemContext = `
Você é uma advogada especialista em Direito Médico do IPROMED. Responda de forma clara, objetiva e fundamentada.
Cliente atual: ${clientName || "Não especificado"}
Especialidade: ${clientData?.specialty || "Não informada"}
      `.trim();

      const { data, error } = await supabase.functions.invoke("ai-legal-document", {
        body: {
          prompt: `${systemContext}\n\nPergunta do cliente: ${userMessage.content}`,
          documentType: "parecer",
          context: { clientName, clientId },
        },
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data?.content || "Desculpe, não consegui processar sua pergunta.",
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Erro ao processar sua pergunta. Tente novamente.",
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success("Conteúdo copiado!");
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return "text-emerald-600";
    if (score < 60) return "text-amber-600";
    return "text-rose-600";
  };

  const getRiskLabel = (score: number) => {
    if (score < 30) return "Baixo";
    if (score < 60) return "Médio";
    return "Alto";
  };

  const getRiskBgColor = (score: number) => {
    if (score < 30) return "bg-emerald-500";
    if (score < 60) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Inteligência Jurídica IA
        </CardTitle>
        <CardDescription>
          Geração de documentos e análise de riscos com inteligência artificial
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Gerar Documentos
            </TabsTrigger>
            <TabsTrigger value="risk" className="gap-2">
              <Shield className="h-4 w-4" />
              Análise de Risco
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Document Generation Tab */}
          <TabsContent value="generate" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Documento</label>
                <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente</label>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted/50 text-sm">
                  {clientName || "Nenhum cliente selecionado"}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contexto Adicional (opcional)</label>
              <Textarea
                placeholder="Adicione informações específicas para personalizar o documento..."
                value={context}
                onChange={e => setContext(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedDocType}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando documento...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar com IA
                </>
              )}
            </Button>

            {generatedContent && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Documento Gerado</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-[300px] border rounded-md p-4 bg-muted/30">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {generatedContent}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          {/* Risk Analysis Tab */}
          <TabsContent value="risk" className="mt-4 space-y-4">
            <Button
              onClick={handleAnalyzeRisk}
              disabled={isAnalyzing}
              className="w-full gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando riscos...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Analisar Perfil de Risco
                </>
              )}
            </Button>

            {riskAnalysis && (
              <div className="space-y-6">
                {/* Overall Score */}
                <Card className="border-2">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Score de Risco Global</h3>
                        <p className="text-sm text-muted-foreground">
                          Baseado no perfil e histórico do cliente
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-4xl font-bold ${getRiskColor(riskAnalysis.overall)}`}>
                          {riskAnalysis.overall}
                        </div>
                        <Badge className={`${getRiskBgColor(riskAnalysis.overall)} text-white`}>
                          {getRiskLabel(riskAnalysis.overall)}
                        </Badge>
                      </div>
                    </div>
                    <Progress
                      value={riskAnalysis.overall}
                      className="h-3"
                    />
                  </CardContent>
                </Card>

                {/* Category Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {riskAnalysis.categories.map(category => {
                    const catInfo = riskCategories.find(r => r.id === category.id);
                    return (
                      <Card key={category.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{catInfo?.label}</CardTitle>
                            <Badge
                              variant="outline"
                              className={getRiskColor(category.score)}
                            >
                              {category.score}%
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Progress value={category.score} className="h-2 mb-3" />
                          <div className="space-y-1">
                            {category.recommendations.slice(0, 2).map((rec, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                                <span>{rec}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Legal Assistant Chat Tab */}
          <TabsContent value="insights" className="mt-4">
            <div className="space-y-4">
              <Card className="border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Assistente Jurídico IA
                  </CardTitle>
                  <CardDescription>
                    Tire dúvidas sobre Direito Médico com nossa IA especializada
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] border rounded-md p-4 mb-4 bg-muted/20">
                    {chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <Bot className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-sm">
                          Olá! Sou a assistente jurídica do IPROMED.<br />
                          Como posso ajudar você hoje?
                        </p>
                        <div className="mt-4 grid grid-cols-1 gap-2 text-xs">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setChatInput("Quais documentos preciso para abrir uma clínica?")}
                          >
                            Documentos para abrir clínica
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setChatInput("Como me proteger de processos por erro médico?")}
                          >
                            Proteção contra processos
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                msg.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              {msg.role === "assistant" ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                              ) : (
                                <p className="text-sm">{msg.content}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-muted rounded-lg px-4 py-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua pergunta jurídica..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                      disabled={isChatLoading}
                    />
                    <Button onClick={handleSendChat} disabled={isChatLoading || !chatInput.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm mb-1">Dashboard Analítico</h3>
                        <p className="text-xs text-muted-foreground">
                          Métricas de SLA e conversão
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                        <Scale className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm mb-1">Jurisprudência</h3>
                        <p className="text-xs text-muted-foreground">
                          Alertas sobre decisões relevantes
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
