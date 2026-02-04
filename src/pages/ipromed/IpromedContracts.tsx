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
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
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
  const [uploading, setUploading] = useState(false);
  const [showFaqDialog, setShowFaqDialog] = useState(false);
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

      if (statusFilter !== 'all' && statusFilter !== 'trash' && statusFilter !== 'downloaded') {
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

    setUploading(true);
    try {
      // For each file, upload to storage and create contract
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `contracts/${fileName}`;

        // Upload file
        const { error: uploadError } = await supabase.storage
          .from('ipromed-documents')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Erro ao enviar ${file.name}`);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('ipromed-documents')
          .getPublicUrl(filePath);

        // Create contract record
        const { data: lastContract } = await supabase
          .from('ipromed_contracts')
          .select('contract_number')
          .like('contract_number', 'DOC_%')
          .order('contract_number', { ascending: false })
          .limit(1);

        let nextNumber = 1;
        if (lastContract && lastContract.length > 0) {
          const match = lastContract[0].contract_number.match(/DOC_(\d+)/);
          if (match) nextNumber = parseInt(match[1], 10) + 1;
        }
        const contractNumber = `DOC_${nextNumber.toString().padStart(4, '0')}`;

        const { error: insertError } = await supabase
          .from('ipromed_contracts')
          .insert({
            title: file.name.replace(/\.[^/.]+$/, ''),
            contract_number: contractNumber,
            status: 'draft',
            document_url: urlData.publicUrl,
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          toast.error(`Erro ao criar registro para ${file.name}`);
        } else {
          toast.success(`${file.name} enviado com sucesso!`);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['ipromed-contracts'] });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar documento');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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

  const handleOpenSupport = () => {
    window.open('https://wa.me/5511999999999?text=Olá,%20preciso%20de%20suporte%20com%20o%20sistema%20de%20contratos', '_blank');
  };

  const handleOpenCommercial = () => {
    window.open('https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20informações%20comerciais', '_blank');
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

            {/* Dashboard */}
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 mt-4"
              onClick={() => navigate('/ipromed/dashboard')}
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Button>

            {/* Clientes */}
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate('/ipromed/clients')}
            >
              <FolderOpen className="h-4 w-4" />
              Clientes
            </Button>

            {/* Agenda */}
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => navigate('/ipromed/agenda')}
            >
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
                placeholder="Busque por um documento"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setStatusFilter('all')}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar filtros
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
                <Button variant="outline" onClick={() => navigate('/ipromed/legal')}>
                  <FileSignature className="h-4 w-4 mr-2" />
                  Hub Jurídico
                </Button>
              </div>
            </div>

            {/* Documents Section Header */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Documentos</span>
              </div>
              <Button 
                variant="link" 
                className="text-primary p-0 h-auto"
                onClick={() => setStatusFilter('all')}
              >
                Ver todos documentos
              </Button>
              <Button 
                variant="link" 
                className="text-primary p-0 h-auto"
                onClick={() => navigate('/ipromed/dashboard')}
              >
                Ver relatório
              </Button>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload Area */}
              <Card className="lg:col-span-2">
                <CardContent className="pt-6">
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer",
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
                          {uploading ? 'Enviando documentos...' : 'Adicionar documentos'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {uploading ? 'Aguarde o upload finalizar' : 'Clique aqui ou arraste documentos PDF'}
                        </p>
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
                    <div 
                      className="text-center cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors"
                      onClick={() => setStatusFilter('pending_signature')}
                    >
                      <p className="text-3xl font-bold">{stats.inProcess}</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-amber-600">
                        <Clock className="h-3 w-3" />
                        Em processo
                      </div>
                    </div>
                    <div 
                      className="text-center cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors"
                      onClick={() => setStatusFilter('cancelled')}
                    >
                      <p className="text-3xl font-bold">{stats.refused}</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-destructive">
                        <XCircle className="h-3 w-3" />
                        Recusas
                      </div>
                    </div>
                    <div 
                      className="text-center cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors"
                      onClick={() => setStatusFilter('signed')}
                    >
                      <p className="text-3xl font-bold">{stats.finalized}</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-emerald-600">
                        <CheckCircle className="h-3 w-3" />
                        Finalizados
                      </div>
                    </div>
                    <div 
                      className="text-center cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors"
                      onClick={() => setStatusFilter('draft')}
                    >
                      <p className="text-3xl font-bold">{stats.drafts}</p>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        Rascunhos
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
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{stats.finalized}</p>
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
                  <Button 
                    variant="link" 
                    className="text-primary p-0 h-auto justify-start w-full"
                    onClick={() => setShowFaqDialog(true)}
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Perguntas frequentes
                  </Button>
                  <Button 
                    variant="link" 
                    className="text-primary p-0 h-auto justify-start w-full"
                    onClick={handleOpenSupport}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contato com o suporte
                  </Button>
                  <Button 
                    variant="link" 
                    className="text-primary p-0 h-auto justify-start w-full"
                    onClick={handleOpenCommercial}
                  >
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
                {stats.inProcess > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                      <Clock className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium">Documentos aguardando assinatura</p>
                        <p className="text-xs text-muted-foreground">
                          Você tem {stats.inProcess} documento{stats.inProcess > 1 ? 's' : ''} em processo
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-auto"
                        onClick={() => setStatusFilter('pending_signature')}
                      >
                        Ver
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">👍</div>
                    <p className="text-muted-foreground">Sem novidades por aqui hoje.</p>
                  </div>
                )}
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
                      <Button onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Enviar Documento
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
                                <Badge variant="outline">{contract.contract_type || 'Documento'}</Badge>
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
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    title="Ver" 
                                    onClick={() => navigate(`/ipromed/contracts/${contract.id}`)}
                                  >
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

      {/* FAQ Dialog */}
      <Dialog open={showFaqDialog} onOpenChange={setShowFaqDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Perguntas Frequentes</DialogTitle>
            <DialogDescription>
              Dúvidas comuns sobre o sistema de contratos
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">Como enviar um documento para assinatura?</h4>
                <p className="text-sm text-muted-foreground">
                  Clique em "Adicionar documentos" ou arraste um arquivo PDF para a área de upload. 
                  Depois, acesse o documento e clique no botão "Enviar para assinatura".
                </p>
              </div>
              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">Quais formatos de arquivo são aceitos?</h4>
                <p className="text-sm text-muted-foreground">
                  Aceitamos arquivos PDF, DOC e DOCX. Recomendamos PDF para melhor compatibilidade.
                </p>
              </div>
              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">Como vincular um documento a um cliente?</h4>
                <p className="text-sm text-muted-foreground">
                  Ao criar um novo contrato pelo botão "+ Adicionar documentos", você pode selecionar 
                  o cliente na lista. Também é possível editar o documento depois e adicionar o cliente.
                </p>
              </div>
              <div className="border-b pb-4">
                <h4 className="font-medium mb-2">Como cancelar um documento em processo?</h4>
                <p className="text-sm text-muted-foreground">
                  Acesse o documento clicando nele na lista, e use a opção "Cancelar" disponível na 
                  página de detalhes.
                </p>
              </div>
              <div className="pb-4">
                <h4 className="font-medium mb-2">Como fazer download de um documento assinado?</h4>
                <p className="text-sm text-muted-foreground">
                  Clique no ícone de download na lista de documentos ou acesse os detalhes do 
                  documento e use o botão "Baixar documento".
                </p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
