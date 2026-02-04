/**
 * CPG Advocacia Médica - Página de Detalhes do Cliente Jurídico
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash2,
  FileSignature,
  Scale,
  Calendar,
  TrendingUp,
  Building2,
  Loader2,
  Plus,
  MessageSquare,
  History,
  Video,
  RefreshCw,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ClientActivityTimeline, logClientActivity } from "./components/ClientActivityTimeline";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClientFormModal } from "./components/ClientFormModal";
import { MeetingScheduleDialog } from "./components/MeetingScheduleDialog";
import { MeetingDetailSheet } from "./components/MeetingDetailSheet";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativo', color: 'bg-emerald-500' },
  prospect: { label: 'Prospecto', color: 'bg-blue-500' },
  churned: { label: 'Cancelado', color: 'bg-gray-500' },
};

const riskConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  low: { label: 'Baixo', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  medium: { label: 'Médio', color: 'bg-amber-100 text-amber-700', icon: Clock },
  high: { label: 'Alto', color: 'bg-rose-100 text-rose-700', icon: AlertTriangle },
};


export default function IpromedClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMeetingOpen, setIsMeetingOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [meetingToDelete, setMeetingToDelete] = useState<any>(null);

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['ipromed-client', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_legal_clients')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch contracts for this client
  const { data: contracts = [] } = useQuery({
    queryKey: ['ipromed-client-contracts', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_contracts')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch upcoming meetings
  const { data: meetings = [] } = useQuery({
    queryKey: ['ipromed-client-meetings', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_client_meetings' as any)
        .select('*')
        .eq('client_id', id)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Delete meeting handler
  const handleDeleteMeeting = async (meeting: any) => {
    try {
      const { error } = await supabase
        .from('ipromed_client_meetings' as any)
        .delete()
        .eq('id', meeting.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['ipromed-client-meetings', id] });
      toast.success('Reunião excluída com sucesso!');
      setMeetingToDelete(null);
    } catch (error: any) {
      toast.error('Erro ao excluir reunião: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Cliente não encontrado</h2>
            <p className="text-muted-foreground mb-4">O cliente solicitado não existe ou foi removido.</p>
            <Button onClick={() => navigate('/ipromed/clients')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Clientes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const status = statusConfig[client.status] || statusConfig.prospect;
  const risk = riskConfig[client.risk_level] || riskConfig.low;
  const RiskIcon = risk.icon;

  const address = client.address as {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  } | null;

  const metadata = client.metadata as {
    payment_status?: string;
    payment_amount?: number;
    contract_status?: string;
    partner?: string;
  } | null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/ipromed/clients')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Clientes
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium truncate max-w-[200px]">{client.name}</span>
      </div>

      {/* Header Card */}
      <Card className="bg-gradient-to-br from-[#00629B]/5 to-[#004d7a]/10 border-none">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-[#00629B] text-white text-2xl">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{client.name}</h1>
                  <Badge className={`${status.color} text-white`}>{status.label}</Badge>
                  {metadata?.partner && (
                    <Badge variant="outline">
                      <Building2 className="h-3 w-3 mr-1" />
                      Sócio
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {client.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {client.email}
                    </span>
                  )}
                  {client.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {client.phone}
                    </span>
                  )}
                  {client.cpf_cnpj && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {client.cpf_cnpj}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {client.onboarding_completed ? (
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Onboarding Concluído
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Onboarding Pendente
                    </Badge>
                  )}
                  <Badge variant="outline" className={risk.color}>
                    <RiskIcon className="h-3 w-3 mr-1" />
                    Risco {risk.label}
                  </Badge>
                  {metadata?.payment_status && (
                    <Badge variant="outline" className={metadata.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                      <DollarSign className="h-3 w-3 mr-1" />
                      {metadata.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                      {metadata.payment_amount && ` - R$ ${metadata.payment_amount.toLocaleString('pt-BR')}`}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button>
                <FileSignature className="h-4 w-4 mr-2" />
                Novo Contrato
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="meetings">Reuniões ({meetings.length})</TabsTrigger>
          <TabsTrigger value="contracts">Contratos ({contracts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Info Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="font-medium">{client.client_type === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física'}</p>
                </div>
                {client.cpf_cnpj && (
                  <div>
                    <p className="text-xs text-muted-foreground">CPF/CNPJ</p>
                    <p className="font-medium">{client.cpf_cnpj}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Cadastrado em</p>
                  <p className="font-medium">
                    {format(new Date(client.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent>
                {address?.street ? (
                  <div className="space-y-1">
                    <p className="font-medium">{address.street}, {address.number}</p>
                    {address.complement && <p className="text-sm text-muted-foreground">{address.complement}</p>}
                    <p className="text-sm text-muted-foreground">
                      {address.neighborhood && `${address.neighborhood} - `}
                      {address.city}/{address.state}
                    </p>
                    {address.zip_code && <p className="text-sm text-muted-foreground">CEP: {address.zip_code}</p>}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Endereço não cadastrado</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {client.notes || "Nenhuma observação registrada"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Email
                </Button>
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Ligar
                </Button>
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsMeetingOpen(true)}>
                  <Video className="h-4 w-4 mr-2" />
                  Agendar Reunião
                </Button>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Tarefa
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <ClientActivityTimeline clientId={id!} />
        </TabsContent>

        {/* Meetings Tab */}
        <TabsContent value="meetings" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Reuniões</CardTitle>
                <CardDescription>Histórico e agendamentos de reuniões</CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsMeetingOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agendar Reunião
              </Button>
            </CardHeader>
            <CardContent>
              {meetings.length === 0 ? (
                <div className="text-center py-8">
                  <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma reunião agendada</p>
                  <Button variant="link" className="mt-2" onClick={() => setIsMeetingOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agendar primeira reunião
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {meetings.map((meeting: any) => (
                    <div 
                      key={meeting.id} 
                      className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                          <Video className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{meeting.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(meeting.scheduled_date), "dd/MM/yyyy", { locale: ptBR })} às {meeting.scheduled_time}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={meeting.status === 'completed' ? 'default' : 'outline'}>
                          {meeting.status === 'scheduled' ? 'Agendada' : 
                           meeting.status === 'completed' ? 'Realizada' : 
                           meeting.status === 'in_progress' ? 'Em andamento' :
                           meeting.status === 'cancelled' ? 'Cancelada' : meeting.status}
                        </Badge>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMeeting(meeting);
                            }}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedMeeting(meeting)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedMeeting(meeting)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => setMeetingToDelete(meeting)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contratos</CardTitle>
                <CardDescription>Contratos vinculados a este cliente</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Contrato
              </Button>
            </CardHeader>
            <CardContent>
              {contracts.length === 0 ? (
                <div className="text-center py-8">
                  <FileSignature className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum contrato cadastrado</p>
                  <Button variant="link" className="mt-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Criar primeiro contrato
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {contracts.map((contract: any) => (
                    <div 
                      key={contract.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/ipromed/contracts/${contract.id}`)}
                    >
                      <div>
                        <p className="font-medium">{contract.title}</p>
                        <p className="text-sm text-muted-foreground">{contract.contract_type}</p>
                      </div>
                      <Badge variant="outline">{contract.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <ClientFormModal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['ipromed-client', id] })}
        client={{
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          cpf_cnpj: client.cpf_cnpj,
          client_type: client.client_type,
          status: client.status,
          risk_level: client.risk_level,
          journey_stage: client.journey_stage,
          notes: client.notes,
          address: address,
          metadata: metadata,
        }}
      />

      {/* Meeting Schedule Dialog */}
      <MeetingScheduleDialog
        open={isMeetingOpen}
        onOpenChange={setIsMeetingOpen}
        clientId={client.id}
        clientName={client.name}
        onSchedule={(data) => {
          console.log('Meeting scheduled:', data);
          toast.success('Reunião agendada com sucesso!');
        }}
      />

      {/* Meeting Detail Sheet */}
      <MeetingDetailSheet
        meeting={selectedMeeting}
        open={!!selectedMeeting}
        onOpenChange={(open) => !open && setSelectedMeeting(null)}
        clientName={client.name}
      />

      {/* Delete Meeting Confirmation */}
      <AlertDialog open={!!meetingToDelete} onOpenChange={(open) => !open && setMeetingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir reunião?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a reunião "{meetingToDelete?.title}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => handleDeleteMeeting(meetingToDelete)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
