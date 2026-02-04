/**
 * IPROMED - Sistema Gerenciador de Contratos e Documentos
 * Fluxo completo: Upload → Vincular Cliente → Ações rápidas
 */

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  Search,
  FileSignature,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Loader2,
  FileText,
  Upload,
  ChevronDown,
  Home,
  FolderOpen,
  Trash2,
  HelpCircle,
  BarChart3,
  Calendar,
  MessageCircle,
  ExternalLink,
  Bell,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import NewContractDialog from "./components/contracts/NewContractDialog";
import { LinkClientDialog } from "./components/contracts/LinkClientDialog";
import { ContractsTable } from "./components/contracts/ContractsTable";
import { SendForSignatureDialog } from "./components/contracts/SendForSignatureDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Sidebar navigation items
const sidebarNav = [
  { icon: Home, label: "Início", id: "home" },
];

const documentsNav = [
  { label: "Todos", id: "all", icon: FolderOpen },
  { label: "Em processo", id: "pending_signature", icon: Clock },
  { label: "Finalizados", id: "signed", icon: CheckCircle },
  { label: "Cancelados", id: "cancelled", icon: XCircle },
  { label: "Rascunhos", id: "draft", icon: FileText },
  { label: "Lixeira", id: "trash", icon: Trash2 },
];

export default function IpromedContracts() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeSection, setActiveSection] = useState<string>("home");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<string>("30");
  const [documentsOpen, setDocumentsOpen] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showFaqDialog, setShowFaqDialog] = useState(false);
  
  // Link client dialog state
  const [linkClientDialog, setLinkClientDialog] = useState<{
    open: boolean;
    contractId: string;
    contractTitle: string;
  }>({ open: false, contractId: "", contractTitle: "" });
  
  // Send for signature dialog state
  const [sendSignatureDialog, setSendSignatureDialog] = useState<{
    open: boolean;
    contract: any | null;
  }>({ open: false, contract: null });
  
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Fetch contracts
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["ipromed-contracts", searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("ipromed_contracts")
        .select(`
          *,
          client:ipromed_legal_clients!ipromed_contracts_client_id_fkey(id, name, email)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all" && statusFilter !== "trash") {
        query = query.eq("status", statusFilter as any);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,contract_number.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch contract documents for signature dialog
  const { data: contractDocuments = [] } = useQuery({
    queryKey: ["contract-documents", sendSignatureDialog.contract?.id],
    queryFn: async () => {
      if (!sendSignatureDialog.contract?.id) return [];
      const { data, error } = await supabase
        .from("ipromed_contract_documents")
        .select("*")
        .eq("contract_id", sendSignatureDialog.contract.id);
      if (error) throw error;
      return data;
    },
    enabled: !!sendSignatureDialog.contract?.id,
  });

  // Stats calculations
  const stats = {
    inProcess: contracts.filter((c) => c.status === "pending_signature").length,
    refused: contracts.filter((c) => c.status === "cancelled").length,
    finalized: contracts.filter((c) => c.status === "signed" || c.status === "active").length,
    drafts: contracts.filter((c) => c.status === "draft").length,
    total: contracts.length,
  };

  // Plan usage
  const planUsage = {
    used: contracts.length,
    total: 200,
    percentage: Math.min((contracts.length / 200) * 100, 100),
  };

  // Send contract for signature (quick action)
  const sendForSignatureQuick = useMutation({
    mutationFn: async (contractId: string) => {
      setSendingId(contractId);
      const { error } = await supabase
        .from("ipromed_contracts")
        .update({ status: "pending_signature", sent_at: new Date().toISOString() })
        .eq("id", contractId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ipromed-contracts"] });
      toast.success("Contrato enviado para assinatura!");
      setSendingId(null);
    },
    onError: () => {
      setSendingId(null);
    },
  });

  // Handle file upload - creates draft and opens link client dialog
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let lastContractId = "";
    let lastContractTitle = "";

    try {
      for (const file of Array.from(files)) {
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `contracts/${fileName}`;

        // Upload file
        const { error: uploadError } = await supabase.storage
          .from("ipromed-documents")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`Erro ao enviar ${file.name}`);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("ipromed-documents")
          .getPublicUrl(filePath);

        // Generate contract number
        const { data: lastContract } = await supabase
          .from("ipromed_contracts")
          .select("contract_number")
          .like("contract_number", "DOC_%")
          .order("contract_number", { ascending: false })
          .limit(1);

        let nextNumber = 1;
        if (lastContract && lastContract.length > 0) {
          const match = lastContract[0].contract_number.match(/DOC_(\d+)/);
          if (match) nextNumber = parseInt(match[1], 10) + 1;
        }
        const contractNumber = `DOC_${nextNumber.toString().padStart(4, "0")}`;

        const title = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");

        // Create contract record as draft
        const { data: newContract, error: insertError } = await supabase
          .from("ipromed_contracts")
          .insert({
            title,
            contract_number: contractNumber,
            status: "draft",
            document_url: urlData.publicUrl,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Insert error:", insertError);
          toast.error(`Erro ao criar registro para ${file.name}`);
        } else {
          // Also create document record
          await supabase.from("ipromed_contract_documents").insert({
            contract_id: newContract.id,
            file_name: file.name,
            file_path: urlData.publicUrl,
            file_type: file.type || "application/pdf",
            file_size: file.size,
            document_type: "contract",
          });

          toast.success(`${file.name} enviado com sucesso!`);
          lastContractId = newContract.id;
          lastContractTitle = title;
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["ipromed-contracts"] });

      // Open link client dialog for last uploaded file
      if (lastContractId) {
        setLinkClientDialog({
          open: true,
          contractId: lastContractId,
          contractTitle: lastContractTitle,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar documento");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    if (["all", "pending_signature", "signed", "cancelled", "draft", "trash"].includes(id)) {
      setStatusFilter(id === "all" ? "all" : id);
    }
  };

  const handleStatClick = (filter: string) => {
    setStatusFilter(filter);
    setActiveSection(filter);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const handleOpenSupport = () => {
    window.open("https://wa.me/5511999999999?text=Olá,%20preciso%20de%20suporte%20com%20o%20sistema%20de%20contratos", "_blank");
  };

  const handleSendForSignature = async (data: any) => {
    if (!sendSignatureDialog.contract) return;

    try {
      await supabase
        .from("ipromed_contracts")
        .update({
          status: "pending_signature",
          sent_at: new Date().toISOString(),
        })
        .eq("id", sendSignatureDialog.contract.id);

      queryClient.invalidateQueries({ queryKey: ["ipromed-contracts"] });
      toast.success("Contrato enviado para assinatura!");
      setSendSignatureDialog({ open: false, contract: null });
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar para assinatura");
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <Button
            onClick={() => setIsNewDialogOpen(true)}
            className="w-full gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Novo Contrato
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {sidebarNav.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "secondary" : "ghost"}
                className="w-full justify-start gap-2 mb-1"
                onClick={() => handleNavClick(item.id)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}

            <Collapsible open={documentsOpen} onOpenChange={setDocumentsOpen} className="mt-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between px-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documentos
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", documentsOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-1 mt-1">
                {documentsNav.map((item) => (
                  <Button
                    key={item.id}
                    variant={statusFilter === item.id || (item.id === "all" && statusFilter === "all") ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start gap-2 text-sm"
                    onClick={() => handleNavClick(item.id)}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>

            <Button variant="ghost" className="w-full justify-start gap-2 mt-4" onClick={() => navigate("/ipromed/dashboard")}>
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Button>

            <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/ipromed/clients")}>
              <Users className="h-4 w-4" />
              Clientes
            </Button>

            <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/ipromed/agenda")}>
              <Calendar className="h-4 w-4" />
              Agenda
            </Button>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Search Bar */}
        <div className="border-b p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documento por título ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => { setStatusFilter("all"); setSearchTerm(""); }}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">{getGreeting()}, IPROMED!</h1>
              <Button variant="outline" onClick={() => navigate("/ipromed/legal")}>
                <FileSignature className="h-4 w-4 mr-2" />
                Hub Jurídico
              </Button>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload Area */}
              <Card className="lg:col-span-2">
                <CardContent className="pt-6">
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer",
                      uploading ? "border-primary bg-primary/5" : "hover:border-primary/50"
                    )}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      multiple
                      disabled={uploading}
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-primary/10 rounded-xl">
                        {uploading ? (
                          <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        ) : (
                          <Upload className="h-8 w-8 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {uploading ? "Enviando documentos..." : "Adicionar documentos"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {uploading ? "Aguarde o upload finalizar" : "Clique aqui ou arraste documentos PDF"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Cards - Clicáveis */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Neste momento</CardTitle>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Últimos 7 dias</SelectItem>
                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                        <SelectItem value="90">Últimos 90 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleStatClick("pending_signature")}
                      className={cn(
                        "text-center rounded-lg p-3 transition-all hover:scale-105",
                        statusFilter === "pending_signature" ? "bg-amber-100 dark:bg-amber-900/30 ring-2 ring-amber-500" : "hover:bg-muted/50"
                      )}
                    >
                      <p className="text-3xl font-bold">{stats.inProcess}</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-amber-600">
                        <Clock className="h-3 w-3" />
                        Em processo
                      </div>
                    </button>
                    <button
                      onClick={() => handleStatClick("cancelled")}
                      className={cn(
                        "text-center rounded-lg p-3 transition-all hover:scale-105",
                        statusFilter === "cancelled" ? "bg-red-100 dark:bg-red-900/30 ring-2 ring-red-500" : "hover:bg-muted/50"
                      )}
                    >
                      <p className="text-3xl font-bold">{stats.refused}</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-destructive">
                        <XCircle className="h-3 w-3" />
                        Recusados
                      </div>
                    </button>
                    <button
                      onClick={() => handleStatClick("signed")}
                      className={cn(
                        "text-center rounded-lg p-3 transition-all hover:scale-105",
                        statusFilter === "signed" ? "bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-500" : "hover:bg-muted/50"
                      )}
                    >
                      <p className="text-3xl font-bold">{stats.finalized}</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-emerald-600">
                        <CheckCircle className="h-3 w-3" />
                        Finalizados
                      </div>
                    </button>
                    <button
                      onClick={() => handleStatClick("draft")}
                      className={cn(
                        "text-center rounded-lg p-3 transition-all hover:scale-105",
                        statusFilter === "draft" ? "bg-gray-200 dark:bg-gray-700 ring-2 ring-gray-500" : "hover:bg-muted/50"
                      )}
                    >
                      <p className="text-3xl font-bold">{stats.drafts}</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        Rascunhos
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Plan Usage */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Plano IPROMED</span>
                      <span className="text-sm text-muted-foreground">
                        {planUsage.used}/{planUsage.total} documentos
                      </span>
                    </div>
                    <Progress value={planUsage.percentage} className="h-2" />
                  </div>
                  <div className="text-center px-4 border-l">
                    <p className="text-xl font-bold">{Math.max(0, planUsage.total - planUsage.used)}</p>
                    <p className="text-xs text-muted-foreground">restantes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            {stats.inProcess > 0 && (
              <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-amber-500" />
                    <div className="flex-1">
                      <p className="font-medium">Documentos aguardando assinatura</p>
                      <p className="text-sm text-muted-foreground">
                        Você tem {stats.inProcess} documento{stats.inProcess > 1 ? "s" : ""} em processo
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleStatClick("pending_signature")}>
                      Ver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents List - Always visible */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Documentos</CardTitle>
                    <CardDescription>
                      {statusFilter === "all"
                        ? `${contracts.length} documento${contracts.length !== 1 ? "s" : ""} no total`
                        : `Filtro ativo: ${documentsNav.find((n) => n.id === statusFilter)?.label || statusFilter}`}
                    </CardDescription>
                  </div>
                  {statusFilter !== "all" && (
                    <Button variant="ghost" size="sm" onClick={() => handleStatClick("all")}>
                      Ver todos
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ContractsTable
                  contracts={contracts}
                  isLoading={isLoading}
                  onSendForSignature={(contract) => setSendSignatureDialog({ open: true, contract })}
                  onLinkClient={(contractId, contractTitle) =>
                    setLinkClientDialog({ open: true, contractId, contractTitle })
                  }
                  sendingId={sendingId}
                />
              </CardContent>
            </Card>

            {/* Help Section */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Precisa de ajuda?</span>
                  <Button variant="link" className="p-0 h-auto" onClick={() => setShowFaqDialog(true)}>
                    Perguntas frequentes
                  </Button>
                  <Button variant="link" className="p-0 h-auto" onClick={handleOpenSupport}>
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Suporte via WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>

      {/* Dialogs */}
      <NewContractDialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen} />

      <LinkClientDialog
        open={linkClientDialog.open}
        onOpenChange={(open) => setLinkClientDialog((prev) => ({ ...prev, open }))}
        contractId={linkClientDialog.contractId}
        contractTitle={linkClientDialog.contractTitle}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["ipromed-contracts"] })}
      />

      <SendForSignatureDialog
        open={sendSignatureDialog.open}
        onOpenChange={(open) => setSendSignatureDialog((prev) => ({ ...prev, open }))}
        contractTitle={sendSignatureDialog.contract?.title || ""}
        clientName={sendSignatureDialog.contract?.client?.name}
        clientEmail={sendSignatureDialog.contract?.client?.email}
        documents={contractDocuments}
        onSend={handleSendForSignature}
        isPending={false}
      />

      {/* FAQ Dialog */}
      <Dialog open={showFaqDialog} onOpenChange={setShowFaqDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Perguntas Frequentes</DialogTitle>
            <DialogDescription>Dúvidas comuns sobre o sistema de contratos</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">Como enviar um documento para assinatura?</h4>
                <p className="text-sm text-muted-foreground">
                  Faça upload do arquivo, vincule um cliente e clique no botão "Enviar p/ Assinatura" nas ações do documento.
                </p>
              </div>
              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">Quais formatos são aceitos?</h4>
                <p className="text-sm text-muted-foreground">PDF, DOC e DOCX. Recomendamos PDF para melhor compatibilidade.</p>
              </div>
              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">Como vincular um cliente ao documento?</h4>
                <p className="text-sm text-muted-foreground">
                  Após o upload, você será automaticamente convidado a vincular um cliente. Também pode fazer depois pelo menu de ações.
                </p>
              </div>
              <div className="pb-4">
                <h4 className="font-medium mb-2">Como baixar um documento assinado?</h4>
                <p className="text-sm text-muted-foreground">
                  Clique no ícone de visualizar PDF ou no menu de ações e selecione "Download".
                </p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
