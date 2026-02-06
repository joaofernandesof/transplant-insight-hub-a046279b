/**
 * CPG Advocacia Médica - Módulo de Propostas Comerciais
 * Geração de propostas personalizadas para clientes
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Printer, Eye, Plus, Trash2, Save, RefreshCw } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { ProposalPreview } from "./components/proposals/ProposalPreview";
import { toast } from "sonner";

// Tipos de documentos jurídicos incluídos
const LEGAL_DOCUMENTS = [
  { id: "contrato_servicos", label: "Contrato de Prestação de Serviços Médicos" },
  { id: "tcle_procedimentos", label: "TCLEs personalizados por procedimento" },
  { id: "tcle_teleconsulta", label: "TCLE para Teleconsulta" },
  { id: "termo_imagem", label: "Termo de Uso de Imagem" },
  { id: "politica_prontuario", label: "Política de Prontuário" },
  { id: "politica_agendamento", label: "Política de Agendamento" },
  { id: "termo_sigilo", label: "Termo de Sigilo" },
  { id: "termo_recusa", label: "Termo de Recusa de Tratamento" },
  { id: "anamnese", label: "Formulário de Anamnese Guiado" },
];

// Serviços incluídos no plano Essencial
const ESSENTIAL_SERVICES = [
  { id: "consultoria", label: "Consultoria jurídica preventiva ilimitada" },
  { id: "defesa_crm", label: "Defesa ética perante o CRM" },
  { id: "defesa_civel", label: "Defesa cível (danos morais e materiais)" },
  { id: "audiencias", label: "Acompanhamento em audiências" },
  { id: "processos_3", label: "Até 3 processos concomitantes" },
  { id: "atendimento", label: "Atendimento contínuo e estratégico" },
];

// Serviços adicionais do plano Integral
const INTEGRAL_SERVICES = [
  { id: "contratos", label: "Análise e revisão de contratos médicos" },
  { id: "defesa_criminal", label: "Defesa criminal médica" },
  { id: "defesa_admin", label: "Defesa administrativa (Vigilância, ANS)" },
  { id: "gestao_crise", label: "Gestão de crise e reputação" },
  { id: "parecer", label: "Parecer jurídico técnico" },
  { id: "processos_ilimitados", label: "Processos concomitantes ilimitados" },
];

// Todos os serviços disponíveis
const PLAN_SERVICES = [...ESSENTIAL_SERVICES, ...INTEGRAL_SERVICES];

// Condições especiais pré-definidas
const SPECIAL_CONDITIONS = [
  { id: "mesma_clinica", label: "Médico(a) da mesma clínica" },
  { id: "ex_aluno_ibramec", label: "Cônjuge de aluna IBRAMEC" },
  { id: "indicacao", label: "Indicação de cliente ativo" },
  { id: "parceiro", label: "Parceiro estratégico" },
  { id: "estrutura_organizada", label: "Estrutura assistencial organizada" },
];

export interface ProposalData {
  clientName: string;
  planName: string;
  planSubtitle: string;
  monthlyValue: number;
  conditions: string[];
  customConditions: string[];
  services: string[];
  documents: string[];
  documentsIncluded: "full" | "discount" | "none";
  introMessage: string;
  closingMessage: string;
}

const defaultProposal: ProposalData = {
  clientName: "Dr. Dertkigil",
  planName: "Plano de Assessoria Jurídica Integral",
  planSubtitle: "Condição Especial - Cônjuge de Aluna IBRAMEC",
  monthlyValue: 1900,
  conditions: ["ex_aluno_ibramec"],
  customConditions: ["Cônjuge da Dra. Marcia Dertkigil, aluna IBRAMEC"],
  services: PLAN_SERVICES.map(s => s.id),
  documents: LEGAL_DOCUMENTS.map(d => d.id),
  documentsIncluded: "full",
  introMessage: "Quero te apresentar uma proposta especial de assessoria jurídica, pensada exclusivamente para você. Por ser cônjuge da Dra. Marcia Dertkigil, aluna IBRAMEC, conseguimos aplicar uma condição excepcional: todos os benefícios do Plano Integral pelo valor do Plano Essencial.",
  closingMessage: "Esta é uma condição exclusiva que reconhece a parceria com o IBRAMEC. Você terá acesso a toda a proteção jurídica do nosso plano mais completo, incluindo defesa criminal, administrativa e gestão de crise, por um investimento significativamente menor.",
};

export default function IpromedProposals() {
  const [proposal, setProposal] = useState<ProposalData>(defaultProposal);
  const [showPreview, setShowPreview] = useState(false);
  const [newCondition, setNewCondition] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Proposta_CPG_${proposal.clientName || "Cliente"}`,
    onAfterPrint: () => toast.success("Proposta gerada com sucesso!"),
  });

  const updateField = <K extends keyof ProposalData>(field: K, value: ProposalData[K]) => {
    setProposal(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: "conditions" | "services" | "documents", itemId: string) => {
    setProposal(prev => {
      const current = prev[field];
      const updated = current.includes(itemId)
        ? current.filter(id => id !== itemId)
        : [...current, itemId];
      return { ...prev, [field]: updated };
    });
  };

  const addCustomCondition = () => {
    if (newCondition.trim()) {
      setProposal(prev => ({
        ...prev,
        customConditions: [...prev.customConditions, newCondition.trim()],
      }));
      setNewCondition("");
    }
  };

  const removeCustomCondition = (index: number) => {
    setProposal(prev => ({
      ...prev,
      customConditions: prev.customConditions.filter((_, i) => i !== index),
    }));
  };

  const resetProposal = () => {
    setProposal(defaultProposal);
    toast.info("Proposta resetada para valores padrão");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Propostas Comerciais
          </h1>
          <p className="text-muted-foreground">
            Gere propostas personalizadas para seus clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetProposal}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? "Editar" : "Visualizar"}
          </Button>
          <Button onClick={() => handlePrint()}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir / PDF
          </Button>
        </div>
      </div>

      {showPreview ? (
        /* Preview Mode */
        <div className="bg-white rounded-lg shadow-lg">
          <ProposalPreview ref={printRef} proposal={proposal} />
        </div>
      ) : (
        /* Edit Mode */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1 - Dados Básicos */}
          <div className="space-y-6">
            {/* Informações do Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clientName">Nome do Cliente</Label>
                  <Input
                    id="clientName"
                    value={proposal.clientName}
                    onChange={e => updateField("clientName", e.target.value)}
                    placeholder="Ex: Dra. Maria Silva"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Plano e Valor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plano e Valor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="planName">Nome do Plano</Label>
                  <Input
                    id="planName"
                    value={proposal.planName}
                    onChange={e => updateField("planName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="planSubtitle">Subtítulo</Label>
                  <Input
                    id="planSubtitle"
                    value={proposal.planSubtitle}
                    onChange={e => updateField("planSubtitle", e.target.value)}
                    placeholder="Ex: Condição Especial"
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyValue">Valor Mensal (R$)</Label>
                  <Input
                    id="monthlyValue"
                    type="number"
                    value={proposal.monthlyValue}
                    onChange={e => updateField("monthlyValue", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Documentação Jurídica</Label>
                  <Select
                    value={proposal.documentsIncluded}
                    onValueChange={(v: "full" | "discount" | "none") => updateField("documentsIncluded", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">100% Inclusa (sem custo adicional)</SelectItem>
                      <SelectItem value="discount">Com Desconto</SelectItem>
                      <SelectItem value="none">Não Incluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Condições Especiais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Condições Especiais (Por você...)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {SPECIAL_CONDITIONS.map(condition => (
                    <div key={condition.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={condition.id}
                        checked={proposal.conditions.includes(condition.id)}
                        onCheckedChange={() => toggleArrayItem("conditions", condition.id)}
                      />
                      <label htmlFor={condition.id} className="text-sm cursor-pointer">
                        {condition.label}
                      </label>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Condições Customizadas */}
                <div>
                  <Label>Condições Personalizadas</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newCondition}
                      onChange={e => setNewCondition(e.target.value)}
                      placeholder="Nova condição..."
                      onKeyDown={e => e.key === "Enter" && addCustomCondition()}
                    />
                    <Button type="button" size="icon" onClick={addCustomCondition}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {proposal.customConditions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {proposal.customConditions.map((cond, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          {cond}
                          <button onClick={() => removeCustomCondition(idx)}>
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2 - Serviços e Documentos */}
          <div className="space-y-6">
            {/* Serviços Incluídos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Serviços Incluídos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {PLAN_SERVICES.map(service => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={service.id}
                        checked={proposal.services.includes(service.id)}
                        onCheckedChange={() => toggleArrayItem("services", service.id)}
                      />
                      <label htmlFor={service.id} className="text-sm cursor-pointer">
                        {service.label}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Documentos Jurídicos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Documentação Jurídica Preventiva</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {LEGAL_DOCUMENTS.map(doc => (
                    <div key={doc.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={doc.id}
                        checked={proposal.documents.includes(doc.id)}
                        onCheckedChange={() => toggleArrayItem("documents", doc.id)}
                      />
                      <label htmlFor={doc.id} className="text-sm cursor-pointer">
                        {doc.label}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mensagens Personalizadas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mensagens Personalizadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="introMessage">Mensagem de Abertura</Label>
                  <Textarea
                    id="introMessage"
                    value={proposal.introMessage}
                    onChange={e => updateField("introMessage", e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="closingMessage">Mensagem de Fechamento</Label>
                  <Textarea
                    id="closingMessage"
                    value={proposal.closingMessage}
                    onChange={e => updateField("closingMessage", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
