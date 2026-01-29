/**
 * IPROMED Legal Hub - Gestão de Processos (Contencioso)
 * Integrado com banco de dados real
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Gavel,
  Search,
  Plus,
  Clock,
  ChevronRight,
  Sparkles,
  Loader2,
  AlertCircle,
  Eye,
  FileText,
  Calendar,
  DollarSign,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface LegalCase {
  id: string;
  case_number: string | null;
  title: string;
  description: string | null;
  client_id: string | null;
  status: 'active' | 'pending' | 'closed' | 'archived' | 'suspended';
  case_type: string | null;
  court: string | null;
  risk_level: 'low' | 'medium' | 'high' | 'critical' | null;
  estimated_value: number | null;
  next_deadline: string | null;
  responsible_lawyer_id: string | null;
  created_at: string | null;
  ipromed_legal_clients?: { name: string } | null;
}

const getStatusBadge = (status: LegalCase['status']) => {
  const config = {
    active: { label: 'Ativo', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    pending: { label: 'Pendente', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    closed: { label: 'Encerrado', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
    archived: { label: 'Arquivado', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
    suspended: { label: 'Suspenso', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  };
  return <Badge className={config[status]?.className || 'bg-gray-100'}>{config[status]?.label || status}</Badge>;
};

const getRiskBadge = (risk: LegalCase['risk_level']) => {
  if (!risk) return <span className="text-muted-foreground">-</span>;
  const config = {
    low: { label: 'Baixo', className: 'bg-emerald-100 text-emerald-700' },
    medium: { label: 'Médio', className: 'bg-amber-100 text-amber-700' },
    high: { label: 'Alto', className: 'bg-orange-100 text-orange-700' },
    critical: { label: 'Crítico', className: 'bg-rose-100 text-rose-700' },
  };
  return <Badge className={config[risk]?.className}>{config[risk]?.label}</Badge>;
};

export default function LegalCasesManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [viewCase, setViewCase] = useState<LegalCase | null>(null);
  const [newCase, setNewCase] = useState({
    case_number: '',
    title: '',
    case_type: '',
    client_id: '',
    court: '',
    estimated_value: '',
    risk_level: '',
    description: '',
  });

  // Update case status
  const updateCaseStatus = useMutation({
    mutationFn: async ({ caseId, newStatus }: { caseId: string; newStatus: 'active' | 'pending' | 'closed' | 'archived' | 'suspended' }) => {
      const { error } = await supabase
        .from('ipromed_legal_cases')
        .update({ status: newStatus })
        .eq('id', caseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-legal-cases'] });
      toast.success('Status atualizado!');
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  // Handle view case
  const handleViewCase = (caseItem: LegalCase) => {
    setViewCase(caseItem);
  };

  const queryClient = useQueryClient();

  // Fetch cases from database
  const { data: cases = [], isLoading, error } = useQuery({
    queryKey: ['ipromed-legal-cases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_legal_cases')
        .select(`
          *,
          ipromed_legal_clients!client_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LegalCase[];
    },
  });

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['ipromed-clients-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_legal_clients')
        .select('id, name')
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });

  // Create case mutation
  const createCase = useMutation({
    mutationFn: async (caseData: typeof newCase) => {
      const { data, error } = await supabase
        .from('ipromed_legal_cases')
        .insert([{
          case_number: caseData.case_number || null,
          title: caseData.title,
          case_type: caseData.case_type || null,
          client_id: caseData.client_id || null,
          court: caseData.court || null,
          estimated_value: caseData.estimated_value ? parseFloat(caseData.estimated_value) : null,
          risk_level: caseData.risk_level as 'low' | 'medium' | 'high' | 'critical' | null || null,
          description: caseData.description || null,
          status: 'active' as const,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-legal-cases'] });
      toast.success('Processo cadastrado com sucesso!');
      setIsNewCaseOpen(false);
      setNewCase({
        case_number: '',
        title: '',
        case_type: '',
        client_id: '',
        court: '',
        estimated_value: '',
        risk_level: '',
        description: '',
      });
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar processo: ' + error.message);
    },
  });

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.case_number?.includes(searchTerm) ?? false) ||
      (c.ipromed_legal_clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = () => {
    if (!newCase.title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }
    createCase.mutate(newCase);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-rose-600 gap-2">
        <AlertCircle className="h-5 w-5" />
        Erro ao carregar processos: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gavel className="h-6 w-6 text-blue-600" />
            Gestão de Processos
          </h2>
          <p className="text-muted-foreground">Contencioso e andamentos processuais</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => {
            toast.info('IA Jurídica', {
              description: 'A geração de peças com IA será ativada em breve. Configure a integração na aba de IA.',
            });
          }}>
            <Sparkles className="h-4 w-4" />
            Gerar Peça com IA
          </Button>
          <Dialog open={isNewCaseOpen} onOpenChange={setIsNewCaseOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Processo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Processo</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número do Processo</Label>
                    <Input 
                      placeholder="0000000-00.0000.0.00.0000" 
                      value={newCase.case_number}
                      onChange={(e) => setNewCase({ ...newCase, case_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo do Processo</Label>
                    <Select 
                      value={newCase.case_type}
                      onValueChange={(value) => setNewCase({ ...newCase, case_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="erro_medico">Erro Médico</SelectItem>
                        <SelectItem value="contratual">Contratual</SelectItem>
                        <SelectItem value="trabalhista">Trabalhista</SelectItem>
                        <SelectItem value="cobranca">Cobrança</SelectItem>
                        <SelectItem value="etico">Processo Ético</SelectItem>
                        <SelectItem value="administrativo">Administrativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Título / Descrição *</Label>
                  <Input 
                    placeholder="Título do processo" 
                    value={newCase.title}
                    onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select 
                      value={newCase.client_id}
                      onValueChange={(value) => setNewCase({ ...newCase, client_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                      {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tribunal</Label>
                    <Input 
                      placeholder="Ex: TJ-SP" 
                      value={newCase.court}
                      onChange={(e) => setNewCase({ ...newCase, court: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor Estimado (R$)</Label>
                    <Input 
                      type="number" 
                      placeholder="0,00" 
                      value={newCase.estimated_value}
                      onChange={(e) => setNewCase({ ...newCase, estimated_value: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nível de Risco</Label>
                    <Select 
                      value={newCase.risk_level}
                      onValueChange={(value) => setNewCase({ ...newCase, risk_level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixo</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="high">Alto</SelectItem>
                        <SelectItem value="critical">Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea 
                    placeholder="Detalhes adicionais..." 
                    value={newCase.description}
                    onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNewCaseOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={createCase.isPending}>
                  {createCase.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar Processo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, título ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="closed">Encerrados</SelectItem>
                <SelectItem value="archived">Arquivados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <Gavel className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhum processo encontrado</p>
              <p className="text-sm">Clique em "Novo Processo" para cadastrar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Processo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risco</TableHead>
                  <TableHead>Valor Est.</TableHead>
                  <TableHead>Próx. Prazo</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem) => (
                  <TableRow key={caseItem.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{caseItem.case_number || 'Sem número'}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {caseItem.title}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {caseItem.ipromed_legal_clients?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {caseItem.case_type ? (
                        <Badge variant="outline">{caseItem.case_type}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                    <TableCell>{getRiskBadge(caseItem.risk_level)}</TableCell>
                    <TableCell className="font-medium">
                      {caseItem.estimated_value ? (
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(caseItem.estimated_value)
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {caseItem.next_deadline ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-amber-600" />
                          {format(new Date(caseItem.next_deadline), 'dd/MM/yy', { locale: ptBR })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleViewCase(caseItem)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Case Details Dialog */}
      <Dialog open={!!viewCase} onOpenChange={(open) => !open && setViewCase(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Detalhes do Processo
            </DialogTitle>
          </DialogHeader>
          {viewCase && (
            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="timeline">Andamentos</TabsTrigger>
                <TabsTrigger value="actions">Ações</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Número</p>
                    <p className="font-mono">{viewCase.case_number || 'Sem número'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(viewCase.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Título</p>
                    <p className="font-medium">{viewCase.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p>{viewCase.case_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tribunal</p>
                    <p>{viewCase.court || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p>{viewCase.ipromed_legal_clients?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Estimado</p>
                    <p className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {viewCase.estimated_value 
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(viewCase.estimated_value)
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nível de Risco</p>
                    {getRiskBadge(viewCase.risk_level)}
                  </div>
                </div>
                {viewCase.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                    <p className="text-sm p-3 bg-muted rounded-lg">{viewCase.description}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="timeline" className="mt-4">
                <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">Histórico de Andamentos</p>
                  <p className="text-sm">A integração com TJ/PJe para acompanhamento automático será ativada em breve.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="actions" className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      updateCaseStatus.mutate({ caseId: viewCase.id, newStatus: 'pending' });
                      setViewCase(null);
                    }}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Marcar como Pendente
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      updateCaseStatus.mutate({ caseId: viewCase.id, newStatus: 'active' });
                      setViewCase(null);
                    }}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Marcar como Ativo
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      updateCaseStatus.mutate({ caseId: viewCase.id, newStatus: 'closed' });
                      setViewCase(null);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Encerrar Processo
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      updateCaseStatus.mutate({ caseId: viewCase.id, newStatus: 'archived' });
                      setViewCase(null);
                    }}
                  >
                    <Gavel className="h-4 w-4 mr-2" />
                    Arquivar
                  </Button>
                </div>
                
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">🚧 Em desenvolvimento</p>
                  <p className="text-amber-700 dark:text-amber-400">
                    A integração automática com TJ, e-SAJ e PJe para acompanhamento de andamentos será ativada em breve.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
