/**
 * CPG Advocacia Médica - Sistema Gerenciador de Contratos e Documentos
 * Layout limpo com filtros em abas no topo
 */

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Trash2,
  HelpCircle,
  MessageCircle,
  Bell,
  FolderOpen,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import NewContractDialog from "./components/contracts/NewContractDialog";
import { LinkClientDialog } from "./components/contracts/LinkClientDialog";
import { ContractsTable } from "./components/contracts/ContractsTable";
import { SendForSignatureDialog } from "./components/contracts/SendForSignatureDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Filter options com cores e ícones
const filterOptions = [
  { label: "Todos", id: "all", icon: FolderOpen, color: "text-primary", bgActive: "bg-primary/10" },
  { label: "Em processo", id: "pending_signature", icon: Clock, color: "text-amber-600", bgActive: "bg-amber-100 dark:bg-amber-900/30" },
  { label: "Finalizados", id: "signed", icon: CheckCircle, color: "text-emerald-600", bgActive: "bg-emerald-100 dark:bg-emerald-900/30" },
  { label: "Rascunhos", id: "draft", icon: FileText, color: "text-muted-foreground", bgActive: "bg-muted" },
  { label: "Cancelados", id: "cancelled", icon: XCircle, color: "text-destructive", bgActive: "bg-red-100 dark:bg-red-900/30" },
  { label: "Lixeira", id: "trash", icon: Trash2, color: "text-muted-foreground", bgActive: "bg-muted" },
];

export default function IpromedContracts() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
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

  // Fetch contracts with document count
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
      
      // Buscar contagem de documentos para cada contrato
      if (data && data.length > 0) {
        const contractIds = data.map(c => c.id);
        const { data: docCounts, error: countError } = await supabase
          .from("ipromed_contract_documents")
          .select("contract_id")
          .in("contract_id", contractIds);
        
        if (!countError && docCounts) {
          const countMap: Record<string, number> = {};
          docCounts.forEach(doc => {
            countMap[doc.contract_id] = (countMap[doc.contract_id] || 0) + 1;
          });
          
          return data.map(contract => ({
            ...contract,
            document_count: countMap[contract.id] || 0
          }));
        }
      }
      
      return data?.map(c => ({ ...c, document_count: 0 })) || [];
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
  const allContracts = useQuery({
    queryKey: ["ipromed-contracts-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ipromed_contracts")
        .select("status");
      if (error) throw error;
      return data || [];
    },
  });

  const stats = {
    all: allContracts.data?.length || 0,
    pending_signature: allContracts.data?.filter((c) => c.status === "pending_signature").length || 0,
    cancelled: allContracts.data?.filter((c) => c.status === "cancelled").length || 0,
    signed: allContracts.data?.filter((c) => c.status === "signed" || c.status === "active").length || 0,
    draft: allContracts.data?.filter((c) => c.status === "draft").length || 0,
    trash: 0,
  };

  // Plan usage
  const planUsage = {
    used: stats.all,
    total: 200,
    percentage: Math.min((stats.all / 200) * 100, 100),
  };

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

        const { error: uploadError } = await supabase.storage
          .from("ipromed-documents")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`Erro ao enviar ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("ipromed-documents")
          .getPublicUrl(filePath);

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
      await queryClient.invalidateQueries({ queryKey: ["ipromed-contracts-stats"] });

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
      queryClient.invalidateQueries({ queryKey: ["ipromed-contracts-stats"] });
      toast.success("Contrato enviado para assinatura!");
      setSendSignatureDialog({ open: false, contract: null });
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar para assinatura");
    }
  };

  const getFilterCount = (filterId: string) => {
    return stats[filterId as keyof typeof stats] || 0;
  };

  const activeFilter = filterOptions.find(f => f.id === statusFilter);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/cpg/legal")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <FileSignature className="h-5 w-5 text-primary" />
                  Documentos & Contratos
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie todos os documentos do escritório
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsNewDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Contrato
              </Button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {(searchTerm || statusFilter !== "all") && (
              <Button variant="outline" size="sm" onClick={() => { setStatusFilter("all"); setSearchTerm(""); }}>
                <Filter className="h-4 w-4 mr-2" />
                Limpar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto pb-3 -mb-px">
            {filterOptions.map((filter) => {
              const count = getFilterCount(filter.id);
              const isActive = statusFilter === filter.id;
              const IconComponent = filter.icon;
              
              return (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                    isActive 
                      ? `${filter.bgActive} ${filter.color} shadow-sm` 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <IconComponent className="h-4 w-4" />
                  {filter.label}
                  {count > 0 && (
                    <Badge 
                      variant={isActive ? "default" : "secondary"} 
                      className={cn(
                        "ml-1 h-5 min-w-[20px] text-xs",
                        isActive && filter.id === "pending_signature" && "bg-amber-600",
                        isActive && filter.id === "signed" && "bg-emerald-600",
                        isActive && filter.id === "cancelled" && "bg-destructive"
                      )}
                    >
                      {count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                statusFilter === "pending_signature" && "ring-2 ring-amber-500"
              )}
              onClick={() => setStatusFilter("pending_signature")}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending_signature}</p>
                  <p className="text-xs text-muted-foreground">Em processo</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                statusFilter === "signed" && "ring-2 ring-emerald-500"
              )}
              onClick={() => setStatusFilter("signed")}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.signed}</p>
                  <p className="text-xs text-muted-foreground">Finalizados</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                statusFilter === "draft" && "ring-2 ring-gray-500"
              )}
              onClick={() => setStatusFilter("draft")}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.draft}</p>
                  <p className="text-xs text-muted-foreground">Rascunhos</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Uso do plano</span>
                  <span className="text-xs text-muted-foreground">{planUsage.used}/{planUsage.total}</span>
                </div>
                <Progress value={planUsage.percentage} className="h-2 mb-1" />
                <p className="text-right text-xs text-muted-foreground">
                  {Math.max(0, planUsage.total - planUsage.used)} restantes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Upload Area */}
          <Card>
            <CardContent className="p-6">
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                  uploading ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
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
                  <div className="p-3 bg-primary/10 rounded-xl">
                    {uploading ? (
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {uploading ? "Enviando..." : "Clique para adicionar documentos"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PDF, DOC ou DOCX • Arraste e solte aqui
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Signature Alert */}
          {stats.pending_signature > 0 && statusFilter === "all" && (
            <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-amber-500" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      {stats.pending_signature} documento{stats.pending_signature > 1 ? "s" : ""} aguardando assinatura
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-amber-300 hover:bg-amber-100"
                    onClick={() => setStatusFilter("pending_signature")}
                  >
                    Ver documentos
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {activeFilter && <activeFilter.icon className={cn("h-5 w-5", activeFilter.color)} />}
                    {activeFilter?.label || "Documentos"}
                  </CardTitle>
                  <CardDescription>
                    {contracts.length} documento{contracts.length !== 1 ? "s" : ""} 
                    {statusFilter !== "all" && " nesta categoria"}
                  </CardDescription>
                </div>
                {statusFilter !== "all" && (
                  <Button variant="ghost" size="sm" onClick={() => setStatusFilter("all")}>
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
          <Card className="bg-muted/30">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-4">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-sm">Precisa de ajuda?</span>
                <Button variant="link" className="p-0 h-auto text-sm" onClick={() => setShowFaqDialog(true)}>
                  Perguntas frequentes
                </Button>
                <Button variant="link" className="p-0 h-auto text-sm" onClick={handleOpenSupport}>
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Suporte via WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Dialogs */}
      <NewContractDialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen} />

      <LinkClientDialog
        open={linkClientDialog.open}
        onOpenChange={(open) => setLinkClientDialog((prev) => ({ ...prev, open }))}
        contractId={linkClientDialog.contractId}
        contractTitle={linkClientDialog.contractTitle}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["ipromed-contracts"] });
          queryClient.invalidateQueries({ queryKey: ["ipromed-contracts-stats"] });
        }}
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
