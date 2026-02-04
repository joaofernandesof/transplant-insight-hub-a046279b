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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClientFormModal } from "./components/ClientFormModal";
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

const journeyStages = [
  { key: 'prospect', label: 'Prospecto', color: 'bg-blue-500' },
  { key: 'onboarding', label: 'Onboarding', color: 'bg-purple-500' },
  { key: 'retention', label: 'Retenção', color: 'bg-emerald-500' },
  { key: 'expansion', label: 'Expansão', color: 'bg-amber-500' },
  { key: 'advocacy', label: 'Advocacia', color: 'bg-rose-500' },
];

export default function IpromedClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);

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

  // Fetch activity log
  const { data: activities = [] } = useQuery({
    queryKey: ['ipromed-client-activities', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_activity_log')
        .select('*')
        .eq('entity_id', id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

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
  const currentStageIndex = journeyStages.findIndex(s => s.key === client.journey_stage);

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
                <div className="flex items-center gap-2">
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

          {/* Journey Progress */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-medium mb-3">Jornada do Cliente</p>
            <div className="flex items-center gap-2">
              {journeyStages.map((stage, index) => (
                <div key={stage.key} className="flex items-center">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                    index <= currentStageIndex 
                      ? `${stage.color} text-white` 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <span className="text-xs font-medium">{stage.label}</span>
                  </div>
                  {index < journeyStages.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 ${
                      index < currentStageIndex ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="contracts">Contratos ({contracts.length})</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
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
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
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
                    <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
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

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma atividade registrada</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {activities.map((activity: any) => (
                      <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-0">
                        <div className="p-2 bg-muted rounded-full h-fit">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
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
    </div>
  );
}
