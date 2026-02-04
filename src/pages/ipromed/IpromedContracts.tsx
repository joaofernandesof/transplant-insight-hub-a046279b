/**
 * IPROMED - Sistema Gerenciador de Contratos e Documentos
 * Inspirado no ClickSign/Neofolic
 */

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  FileSignature,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Send,
  Download,
  Filter,
  Loader2,
  FileText,
  Upload,
  ChevronDown,
  Home,
  FolderOpen,
  Trash2,
  Settings,
  Bell,
  HelpCircle,
  BarChart3,
  Calendar,
  MessageCircle,
  Zap,
  CreditCard,
  ChevronRight,
  MoreVertical,
  File,
  FileImage,
  FileSpreadsheet,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import NewContractDialog from "./components/contracts/NewContractDialog";
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
  { label: "Baixados", id: "downloaded", icon: Download },
  { label: "Rascunhos", id: "draft", icon: FileText },
  { label: "Lixeira", id: "trash", icon: Trash2 },
];

const managementNav = [
  { label: "Relatórios", id: "reports", icon: BarChart3 },
  { label: "Prazos", id: "deadlines", icon: Calendar },
  { label: "E-mails enviados", id: "emails", icon: MessageCircle },
  { label: "Agenda de contatos", id: "contacts", icon: FolderOpen },
];

const automationNav = [
  { label: "Visão geral", id: "automation", icon: Zap },
  { label: "Modelos", id: "templates", icon: FileText },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-500', icon: FileSignature },
  pending_signature: { label: 'Em processo', color: 'bg-amber-500', icon: Clock },
  signed: { label: 'Finalizado', color: 'bg-emerald-500', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-rose-500', icon: XCircle },
  active: { label: 'Ativo', color: 'bg-emerald-500', icon: CheckCircle },
};

export default function IpromedContracts() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<string>('30');
  const [documentsOpen, setDocumentsOpen] = useState(true);
  const [managementOpen, setManagementOpen] = useState(false);
  const [automationOpen, setAutomationOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch contracts
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['ipromed-contracts', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('ipromed_contracts')
        .select(`
          *,
          client:ipromed_legal_clients!ipromed_contracts_client_id_fkey(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'draft' | 'pending_signature' | 'signed' | 'cancelled' | 'pending_approval' | 'pending_review' | 'expired' | 'terminated' | 'active');
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,contract_number.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Stats calculations
  const stats = {
    inProcess: contracts.filter(c => c.status === 'pending_signature').length,
    refused: contracts.filter(c => c.status === 'cancelled').length,
    finalized: contracts.filter(c => c.status === 'signed' || c.status === 'active').length,
    cancelled: contracts.filter(c => c.status === 'cancelled').length,
    total: contracts.length,
    drafts: contracts.filter(c => c.status === 'draft').length,
  };

  // Plan usage (mock for now - can be connected to real data)
  const planUsage = {
    used: contracts.length,
    total: 200,
    percentage: Math.min((contracts.length / 200) * 100, 100),
    additionals: 0,
  };

  // Send contract for signature
  const sendForSignature = useMutation({
    mutationFn: async (contractId: string) => {
      const { error } = await supabase
        .from('ipromed_contracts')
        .update({ status: 'pending_signature', sent_at: new Date().toISOString() })
        .eq('id', contractId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-contracts'] });
      toast.success('Contrato enviado para assinatura!');
    },
  });

  // Handle file upload for new document
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // For now, open the new contract dialog
    // In a real implementation, this would upload and create a document
    setIsNewDialogOpen(true);
    toast.info('Selecione um cliente para vincular o documento.');
  };

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    if (['all', 'pending_signature', 'signed', 'cancelled', 'downloaded', 'draft', 'trash'].includes(id)) {
      setStatusFilter(id === 'all' ? 'all' : id);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card flex flex-col">
        {/* Logo/Brand */}
        <div className="p-4 border-b">
          <Button 
            onClick={() => setIsNewDialogOpen(true)}
            className="w-full gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Adicionar documentos
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* Main nav */}
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

            {/* Documents section */}
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
                    variant={statusFilter === item.id || (item.id === 'all' && statusFilter === 'all') ? "secondary" : "ghost"}
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

            {/* Plano e cobrança */}
            <Button variant="ghost" className="w-full justify-start gap-2 mt-2">
              <CreditCard className="h-4 w-4" />
              Plano e cobrança
            </Button>

            {/* Management section */}
            <Collapsible open={managementOpen} onOpenChange={setManagementOpen} className="mt-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Gestão
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", managementOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-1 mt-1">
                {managementNav.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
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

            {/* Automation section */}
            <Collapsible open={automationOpen} onOpenChange={setAutomationOpen} className="mt-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Automação
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", automationOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 space-y-1 mt-1">
                {automationNav.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
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

            {/* Settings */}
            <Button variant="ghost" className="w-full justify-start gap-2 mt-4">
              <Settings className="h-4 w-4" />
              Configurações
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
                placeholder="Busque por um documento"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Greeting Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">{getGreeting()}, IPROMED!</h1>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Automatizar documentos
                </Button>
                <Button variant="outline">
                  <FileSignature className="h-4 w-4 mr-2" />
                  Área de assinatura
                </Button>
              </div>
            </div>

            {/* Documents Section Header */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Documentos</span>
              </div>
              <Button variant="link" className="text-primary p-0 h-auto">
                Ver todos documentos
              </Button>
              <Button variant="link" className="text-primary p-0 h-auto">
                Ver relatório
              </Button>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload Area */}
              <Card className="lg:col-span-2">
                <CardContent className="pt-6">
                  <div 
                    className="border-2 border-dashed rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      multiple
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-primary/10 rounded-xl">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Adicionar documentos</p>
                        <p className="text-sm text-muted-foreground">Clique aqui ou arraste documentos</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Neste momento</CardTitle>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
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
                    <div className="text-center">
                      <p className="text-3xl font-bold">{stats.inProcess}</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-warning">
                        <Clock className="h-3 w-3" />
                        Em processo
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold">{stats.refused}</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-destructive">
                        <XCircle className="h-3 w-3" />
                        Recusas
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold">{stats.finalized}</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-success">
                        <CheckCircle className="h-3 w-3" />
                        Finalizados
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold">{stats.cancelled}</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <XCircle className="h-3 w-3" />
                        Cancelados
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Plan Usage */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Plano IPROMED</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="space-y-2">
                      <Progress value={planUsage.percentage} className="h-3" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {planUsage.used}/{planUsage.total} documentos utilizados
                        </span>
                        {planUsage.percentage >= 100 && (
                          <Button size="sm" className="bg-primary">
                            Fazer upgrade
                          </Button>
                        )}
                      </div>
                      {planUsage.percentage >= 100 && (
                        <p className="text-sm text-muted-foreground">
                          Você já usou todo o seu pacote
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{planUsage.used}</p>
                      <p className="text-xs text-muted-foreground">finalizados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{Math.max(0, planUsage.total - planUsage.used)}</p>
                      <p className="text-xs text-muted-foreground">restantes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{planUsage.additionals}</p>
                      <p className="text-xs text-muted-foreground">Adicionais</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    {format(startOfMonth(new Date()), "dd/MM/yyyy")} a {format(endOfMonth(new Date()), "dd/MM/yyyy")}
                  </p>
                  <Button variant="link" className="text-primary p-0 h-auto text-xs">
                    Ir para Plano e cobrança
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Help Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Precisa de ajuda?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="link" className="text-primary p-0 h-auto justify-start w-full">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Perguntas frequentes
                  </Button>
                  <Button variant="link" className="text-primary p-0 h-auto justify-start w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contato com o suporte
                  </Button>
                  <Button variant="link" className="text-primary p-0 h-auto justify-start w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Contato com o comercial
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notificações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">👍</div>
                  <p className="text-muted-foreground">Sem novidades por aqui hoje.</p>
                </div>
              </CardContent>
            </Card>

            {/* Documents List */}
            {statusFilter !== 'home' && (
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Documentos</CardTitle>
                  <CardDescription>
                    {statusFilter === 'all' 
                      ? 'Todos os documentos e contratos' 
                      : `Documentos com status: ${statusConfig[statusFilter]?.label || statusFilter}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : contracts.length === 0 ? (
                    <div className="text-center py-12">
                      <FileSignature className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhum documento encontrado</h3>
                      <p className="text-muted-foreground mb-4">Comece adicionando o primeiro documento</p>
                      <Button onClick={() => setIsNewDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Documento
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contracts.map((contract: any) => {
                          const status = statusConfig[contract.status] || statusConfig.draft;
                          const StatusIcon = status.icon;
                          return (
                            <TableRow 
                              key={contract.id} 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => navigate(`/ipromed/contracts/${contract.id}`)}
                            >
                              <TableCell className="font-mono text-sm">
                                {contract.contract_number || '-'}
                              </TableCell>
                              <TableCell className="font-medium">{contract.title}</TableCell>
                              <TableCell>
                                {contract.client?.name || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{contract.contract_type || 'Contrato'}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${status.color} text-white`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(contract.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" title="Ver" onClick={() => navigate(`/ipromed/contracts/${contract.id}`)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {contract.status === 'draft' && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      title="Enviar para assinatura"
                                      onClick={() => sendForSignature.mutate(contract.id)}
                                      disabled={sendForSignature.isPending}
                                    >
                                      {sendForSignature.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Send className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    title="Download"
                                    onClick={() => {
                                      if (contract.document_url) {
                                        // Abrir documento em nova aba
                                        window.open(contract.document_url, '_blank');
                                      } else {
                                        toast.info('Este contrato ainda não possui arquivo anexado.');
                                      }
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>

      <NewContractDialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen} />
    </div>
  );
}
