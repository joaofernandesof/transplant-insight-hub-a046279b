/**
 * IPROMED - Clicksign Integration Component (Fase 2)
 * Contract signature workflow with Clicksign preparation
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileSignature,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Users,
  Calendar,
  Eye,
  Download,
  RefreshCw,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// Contract status types
type ContractStatus = "draft" | "pending_signature" | "signed" | "expired" | "cancelled";

interface Contract {
  id: string;
  clientId: string;
  clientName: string;
  type: string;
  title: string;
  status: ContractStatus;
  createdAt: string;
  sentAt?: string;
  signedAt?: string;
  expiresAt?: string;
  signers: Array<{
    name: string;
    email: string;
    signed: boolean;
    signedAt?: string;
  }>;
  clicksignDocumentKey?: string;
}

// Contract templates
const contractTemplates = [
  { id: "preventive", title: "Contrato de Assessoria Preventiva", type: "service" },
  { id: "tcle", title: "Termo de Consentimento (TCLE)", type: "consent" },
  { id: "adhesion", title: "Termo de Adesão ao Plano", type: "adhesion" },
  { id: "confidentiality", title: "Termo de Confidencialidade", type: "nda" },
  { id: "mandate", title: "Procuração para Representação", type: "mandate" },
];

const statusConfig: Record<ContractStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: "Rascunho", color: "bg-gray-100 text-gray-700", icon: FileText },
  pending_signature: { label: "Aguardando Assinatura", color: "bg-amber-100 text-amber-700", icon: Clock },
  signed: { label: "Assinado", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  expired: { label: "Expirado", color: "bg-rose-100 text-rose-700", icon: XCircle },
  cancelled: { label: "Cancelado", color: "bg-gray-100 text-gray-700", icon: XCircle },
};

interface ClicksignContractsProps {
  clientId?: string;
  clientName?: string;
  contracts?: Contract[];
  onSendContract?: (contractId: string) => void;
  onCreateContract?: (templateId: string, clientId: string) => void;
}

// Mock contracts for demonstration
const mockContracts: Contract[] = [
  {
    id: "1",
    clientId: "1",
    clientName: "Dra. Marcia San Juan Dertkigil",
    type: "service",
    title: "Contrato de Assessoria Preventiva",
    status: "pending_signature",
    createdAt: "2026-01-25",
    sentAt: "2026-01-25",
    expiresAt: "2026-02-25",
    signers: [
      { name: "Dra. Marcia San Juan Dertkigil", email: "marcia@email.com", signed: false },
      { name: "Dra. Larissa IPROMED", email: "larissa@ipromed.com", signed: true, signedAt: "2026-01-25" },
    ],
  },
  {
    id: "2",
    clientId: "3",
    clientName: "Dra. Cintia de Andrade",
    type: "service",
    title: "Contrato de Assessoria Preventiva",
    status: "pending_signature",
    createdAt: "2026-01-25",
    sentAt: "2026-01-25",
    signers: [
      { name: "Dra. Cintia de Andrade", email: "cintia@email.com", signed: false },
    ],
  },
  {
    id: "3",
    clientId: "4",
    clientName: "Fábio Branaro",
    type: "service",
    title: "Contrato de Assessoria Preventiva",
    status: "pending_signature",
    createdAt: "2026-01-25",
    sentAt: "2026-01-25",
    signers: [
      { name: "Fábio Branaro", email: "fabio@email.com", signed: false },
    ],
  },
];

export default function ClicksignContracts({
  clientId,
  clientName,
  contracts = mockContracts,
  onSendContract,
  onCreateContract,
}: ClicksignContractsProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  const filteredContracts = clientId
    ? contracts.filter(c => c.clientId === clientId)
    : contracts;

  const pendingContracts = filteredContracts.filter(c => c.status === "pending_signature");
  const signedContracts = filteredContracts.filter(c => c.status === "signed");
  const draftContracts = filteredContracts.filter(c => c.status === "draft");

  const handleSendContract = async (contractId: string) => {
    setIsSending(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSending(false);
    onSendContract?.(contractId);
    toast.success("Contrato enviado para assinatura!", {
      description: "O cliente receberá um email com o link para assinar.",
    });
  };

  const handleCreateContract = () => {
    if (!selectedTemplate || !clientId) {
      toast.error("Selecione um modelo de contrato");
      return;
    }
    onCreateContract?.(selectedTemplate, clientId);
    toast.success("Contrato criado com sucesso!", {
      description: "O contrato está pronto para envio.",
    });
    setSelectedTemplate("");
  };

  const getSignatureProgress = (contract: Contract) => {
    const total = contract.signers.length;
    const signed = contract.signers.filter(s => s.signed).length;
    return Math.round((signed / total) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-primary" />
              Contratos & Assinaturas
            </CardTitle>
            <CardDescription>
              {clientName ? `Contratos de ${clientName}` : "Gestão de contratos com assinatura digital"}
            </CardDescription>
          </div>
          {clientId && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Contrato
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Contrato</DialogTitle>
                  <DialogDescription>
                    Selecione um modelo para criar um novo contrato para {clientName}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Modelo de Contrato</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {contractTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateContract} className="w-full">
                    Criar Contrato
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pendentes
              {pendingContracts.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingContracts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="signed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Assinados
            </TabsTrigger>
            <TabsTrigger value="drafts" className="gap-2">
              <FileText className="h-4 w-4" />
              Rascunhos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <ScrollArea className="h-[400px]">
              {pendingContracts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum contrato pendente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingContracts.map(contract => {
                    const StatusIcon = statusConfig[contract.status].icon;
                    const progress = getSignatureProgress(contract);

                    return (
                      <Card key={contract.id} className="border-l-4 border-l-amber-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={statusConfig[contract.status].color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig[contract.status].label}
                                </Badge>
                              </div>
                              <h4 className="font-medium">{contract.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {contract.clientName}
                              </p>

                              <div className="mt-3 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    Assinaturas: {contract.signers.filter(s => s.signed).length}/{contract.signers.length}
                                  </span>
                                  <span className="font-medium">{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {contract.signers.map((signer, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className={signer.signed ? "border-emerald-500 text-emerald-700" : ""}
                                  >
                                    {signer.signed ? (
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                    ) : (
                                      <Clock className="h-3 w-3 mr-1" />
                                    )}
                                    {signer.name.split(" ")[0]}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                              <Button variant="outline" size="sm" className="gap-1">
                                <Eye className="h-3 w-3" />
                                Ver
                              </Button>
                              <Button variant="outline" size="sm" className="gap-1">
                                <RefreshCw className="h-3 w-3" />
                                Reenviar
                              </Button>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Enviado em {new Date(contract.sentAt!).toLocaleDateString("pt-BR")}
                            </span>
                            {contract.expiresAt && (
                              <span className="flex items-center gap-1 text-amber-600">
                                <AlertTriangle className="h-3 w-3" />
                                Expira em {new Date(contract.expiresAt).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="signed" className="mt-4">
            <ScrollArea className="h-[400px]">
              {signedContracts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum contrato assinado ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {signedContracts.map(contract => (
                    <Card key={contract.id} className="border-l-4 border-l-emerald-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge className={statusConfig.signed.color}>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {statusConfig.signed.label}
                            </Badge>
                            <h4 className="font-medium mt-2">{contract.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {contract.clientName}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Download className="h-3 w-3" />
                            Baixar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="drafts" className="mt-4">
            <ScrollArea className="h-[400px]">
              {draftContracts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum rascunho</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {draftContracts.map(contract => (
                    <Card key={contract.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge className={statusConfig.draft.color}>
                              <FileText className="h-3 w-3 mr-1" />
                              {statusConfig.draft.label}
                            </Badge>
                            <h4 className="font-medium mt-2">{contract.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {contract.clientName}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="gap-1"
                            onClick={() => handleSendContract(contract.id)}
                            disabled={isSending}
                          >
                            {isSending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                            Enviar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Clicksign Integration Notice */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <FileSignature className="h-5 w-5" />
            <span className="font-medium">Assinatura Digital</span>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
            O sistema suporta dois provedores de assinatura digital:
          </p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="p-3 bg-white dark:bg-background rounded-lg border">
              <p className="font-medium text-sm">ClickSign</p>
              <p className="text-xs text-muted-foreground">Assinatura eletrônica simples</p>
              <Badge variant="outline" className="mt-2 text-xs">API Key pendente</Badge>
            </div>
            <div className="p-3 bg-white dark:bg-background rounded-lg border">
              <p className="font-medium text-sm">GOV.BR (ICP-Brasil)</p>
              <p className="text-xs text-muted-foreground">Assinatura com validade jurídica plena</p>
              <Badge variant="outline" className="mt-2 text-xs">Credenciais pendentes</Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Configure as credenciais de API para ativar a assinatura digital automática.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
