/**
 * IPROMED - AI Legal Intelligence Component (Fase 3)
 * AI-powered document generation and risk analysis
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";
import { toast } from "sonner";

// Document types for AI generation
const documentTypes = [
  { id: "tcle", label: "TCLE - Termo de Consentimento", category: "consent" },
  { id: "privacy", label: "Política de Privacidade", category: "policy" },
  { id: "contract", label: "Contrato de Serviços", category: "contract" },
  { id: "response", label: "Resposta a Reclamação", category: "response" },
  { id: "defense", label: "Defesa Administrativa", category: "defense" },
  { id: "notice", label: "Notificação Extrajudicial", category: "notice" },
];

// Risk categories
const riskCategories = [
  { id: "crm", label: "Ético (CRM)", weight: 0.3 },
  { id: "civil", label: "Cível", weight: 0.25 },
  { id: "criminal", label: "Criminal", weight: 0.25 },
  { id: "advertising", label: "Publicidade", weight: 0.2 },
];

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
    categories: { id: string; score: number; recommendations: string[] }[];
  } | null>(null);

  const handleGenerate = async () => {
    if (!selectedDocType) {
      toast.error("Selecione um tipo de documento");
      return;
    }

    setIsGenerating(true);
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2500));

    const docType = documentTypes.find(d => d.id === selectedDocType);
    const generatedText = `
# ${docType?.label}

## Dados do Cliente
- **Nome**: ${clientName || "Cliente"}
- **Especialidade**: ${clientData?.specialty || "Não informada"}

## Conteúdo Gerado

Este documento foi gerado automaticamente pelo sistema IPROMED com base nas informações fornecidas durante o onboarding jurídico.

### Cláusulas Principais

1. **Objeto do Documento**
   O presente instrumento tem por objeto estabelecer os termos e condições aplicáveis à relação entre as partes, observando as normas do Conselho Federal de Medicina e legislação vigente.

2. **Obrigações das Partes**
   - O profissional compromete-se a prestar serviços com diligência e observância das boas práticas médicas.
   - O cliente compromete-se a fornecer informações verdadeiras e completas.

3. **Consentimento Informado**
   O cliente declara ter sido informado sobre todos os procedimentos, riscos e alternativas disponíveis.

4. **Proteção de Dados**
   Os dados pessoais serão tratados conforme a Lei Geral de Proteção de Dados (LGPD).

---
*Documento gerado por IA - IPROMED Legal Hub*
*Data: ${new Date().toLocaleDateString("pt-BR")}*
    `.trim();

    setGeneratedContent(generatedText);
    setIsGenerating(false);
    toast.success("Documento gerado com sucesso!");
  };

  const handleAnalyzeRisk = async () => {
    setIsAnalyzing(true);
    // Simulate AI risk analysis
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Calculate risk scores based on client data
    const hasLawsuits = clientData?.hasActiveLawsuits ? 25 : 0;
    const hasEthics = clientData?.hasEthicsProceedings ? 20 : 0;
    const baseRisk = 15;

    const crmScore = clientData?.crmRisks ? 45 : 20;
    const civilScore = hasLawsuits + baseRisk + (clientData?.civilRisks ? 30 : 0);
    const criminalScore = hasEthics + baseRisk + (clientData?.criminalRisks ? 35 : 0);
    const advertisingScore = clientData?.advertisingRisks ? 40 : 15;

    const overallScore = Math.min(
      100,
      Math.round(
        crmScore * 0.3 +
        civilScore * 0.25 +
        criminalScore * 0.25 +
        advertisingScore * 0.2
      )
    );

    setRiskAnalysis({
      overall: overallScore,
      categories: [
        {
          id: "crm",
          score: crmScore,
          recommendations: [
            "Revisar materiais de divulgação",
            "Atualizar documentação de prontuários",
            "Verificar conformidade com Código de Ética Médica",
          ],
        },
        {
          id: "civil",
          score: civilScore,
          recommendations: [
            "Implementar TCLEs personalizados",
            "Documentar todos os procedimentos",
            "Manter registro fotográfico quando aplicável",
          ],
        },
        {
          id: "criminal",
          score: criminalScore,
          recommendations: [
            "Verificar habilitação para procedimentos específicos",
            "Garantir estrutura adequada para emergências",
            "Manter protocolos de segurança atualizados",
          ],
        },
        {
          id: "advertising",
          score: advertisingScore,
          recommendations: [
            "Revisar redes sociais e site",
            "Remover promessas de resultados",
            "Adequar linguagem às normas do CFM",
          ],
        },
      ],
    });

    setIsAnalyzing(false);
    toast.success("Análise de risco concluída!");
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

          {/* Insights Tab */}
          <TabsContent value="insights" className="mt-4">
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Dashboard Analítico</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Métricas detalhadas de conversão, SLA e retenção de clientes.
                      </p>
                      <Badge variant="outline">Em desenvolvimento</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                      <Bot className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Assistente Jurídico IA</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Chat inteligente para consultas jurídicas e orientações preventivas.
                      </p>
                      <Badge variant="outline">Em desenvolvimento</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                      <Scale className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Monitoramento de Jurisprudência</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Alertas automáticos sobre decisões relevantes para seus clientes.
                      </p>
                      <Badge variant="outline">Em desenvolvimento</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
