/**
 * IPROMED Legal Hub - Atendimento Jurídico Interno
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Building2,
  FileText,
  HelpCircle,
  Scale,
  Sparkles,
  Send,
  Timer,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LegalRequest {
  id: string;
  requestNumber: string;
  requestType: 'contract' | 'opinion' | 'question' | 'follow_up' | 'complaint' | 'consultation';
  title: string;
  description: string;
  requesterName: string;
  requesterDepartment: string;
  priority: 1 | 2 | 3 | 4 | 5;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  createdAt: Date;
  dueDate?: Date;
  slaHours: number;
  isWithinSla: boolean;
}

const mockRequests: LegalRequest[] = [
  {
    id: '1',
    requestNumber: 'REQ-20240125-0001',
    requestType: 'contract',
    title: 'Revisão de contrato de fornecedor',
    description: 'Precisamos revisar o contrato do novo fornecedor de materiais antes de assinar.',
    requesterName: 'Ana Silva',
    requesterDepartment: 'Compras',
    priority: 2,
    status: 'pending',
    createdAt: new Date('2024-01-25T10:30:00'),
    dueDate: new Date('2024-01-27T10:30:00'),
    slaHours: 48,
    isWithinSla: true,
  },
  {
    id: '2',
    requestNumber: 'REQ-20240124-0003',
    requestType: 'opinion',
    title: 'Parecer sobre demissão de funcionário',
    description: 'Necessário parecer jurídico sobre processo de desligamento.',
    requesterName: 'Carlos Mendes',
    requesterDepartment: 'RH',
    priority: 1,
    status: 'in_progress',
    assignedTo: 'Dra. Marina Costa',
    createdAt: new Date('2024-01-24T14:00:00'),
    dueDate: new Date('2024-01-25T14:00:00'),
    slaHours: 24,
    isWithinSla: false,
  },
  {
    id: '3',
    requestNumber: 'REQ-20240124-0002',
    requestType: 'question',
    title: 'Dúvida sobre LGPD',
    description: 'Podemos compartilhar dados de pacientes com a seguradora?',
    requesterName: 'Paula Rodrigues',
    requesterDepartment: 'Atendimento',
    priority: 3,
    status: 'completed',
    assignedTo: 'Dr. Roberto Alves',
    createdAt: new Date('2024-01-24T09:00:00'),
    slaHours: 48,
    isWithinSla: true,
  },
  {
    id: '4',
    requestNumber: 'REQ-20240123-0001',
    requestType: 'consultation',
    title: 'Consulta sobre tributação de novos serviços',
    description: 'Dúvidas sobre a tributação correta para os novos serviços que vamos oferecer.',
    requesterName: 'Fernando Costa',
    requesterDepartment: 'Financeiro',
    priority: 3,
    status: 'pending',
    createdAt: new Date('2024-01-23T16:00:00'),
    dueDate: new Date('2024-01-25T16:00:00'),
    slaHours: 48,
    isWithinSla: true,
  },
];

const getTypeConfig = (type: LegalRequest['requestType']) => {
  const config = {
    contract: { label: 'Contrato', icon: FileText, color: 'text-blue-600 bg-blue-100' },
    opinion: { label: 'Parecer', icon: Scale, color: 'text-purple-600 bg-purple-100' },
    question: { label: 'Dúvida', icon: HelpCircle, color: 'text-amber-600 bg-amber-100' },
    follow_up: { label: 'Acompanhamento', icon: Clock, color: 'text-cyan-600 bg-cyan-100' },
    complaint: { label: 'Reclamação', icon: AlertTriangle, color: 'text-rose-600 bg-rose-100' },
    consultation: { label: 'Consulta', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-100' },
  };
  return config[type];
};

const getStatusConfig = (status: LegalRequest['status']) => {
  const config = {
    pending: { label: 'Pendente', className: 'bg-amber-100 text-amber-700' },
    in_progress: { label: 'Em Andamento', className: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Concluído', className: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-700' },
  };
  return config[status];
};

const getPriorityConfig = (priority: number) => {
  const config: Record<number, { label: string; className: string }> = {
    1: { label: 'Crítica', className: 'bg-rose-100 text-rose-700' },
    2: { label: 'Alta', className: 'bg-orange-100 text-orange-700' },
    3: { label: 'Média', className: 'bg-amber-100 text-amber-700' },
    4: { label: 'Baixa', className: 'bg-blue-100 text-blue-700' },
    5: { label: 'Mínima', className: 'bg-gray-100 text-gray-700' },
  };
  return config[priority];
};

export default function LegalRequestsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);

  const filteredRequests = mockRequests.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requestNumber.includes(searchTerm) ||
      r.requesterName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === 'all' || r.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const pendingCount = mockRequests.filter(r => r.status === 'pending').length;
  const inProgressCount = mockRequests.filter(r => r.status === 'in_progress').length;
  const overdueCount = mockRequests.filter(r => !r.isWithinSla && r.status !== 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-amber-600" />
            Atendimento Jurídico
          </h2>
          <p className="text-muted-foreground">Solicitações internas e histórico</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Resposta IA
          </Button>
          <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Solicitação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Solicitação Jurídica</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Solicitação</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contract">Contrato</SelectItem>
                        <SelectItem value="opinion">Parecer</SelectItem>
                        <SelectItem value="question">Dúvida</SelectItem>
                        <SelectItem value="consultation">Consulta</SelectItem>
                        <SelectItem value="follow_up">Acompanhamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Crítica</SelectItem>
                        <SelectItem value="2">Alta</SelectItem>
                        <SelectItem value="3">Média</SelectItem>
                        <SelectItem value="4">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Assunto</Label>
                  <Input placeholder="Título da solicitação" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição Detalhada</Label>
                  <Textarea placeholder="Descreva sua solicitação em detalhes..." rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Seu Departamento</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rh">RH</SelectItem>
                        <SelectItem value="financeiro">Financeiro</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                        <SelectItem value="operacoes">Operações</SelectItem>
                        <SelectItem value="atendimento">Atendimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prazo Desejado</Label>
                    <Input type="date" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNewRequestOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsNewRequestOpen(false)}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Solicitação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Timer className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-xs text-muted-foreground">Em Andamento</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueCount}</p>
                <p className="text-xs text-muted-foreground">Fora do SLA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="in_progress">Em Andamento</TabsTrigger>
            <TabsTrigger value="completed">Concluídas</TabsTrigger>
          </TabsList>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar solicitações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const typeConfig = getTypeConfig(request.requestType);
            const statusConfig = getStatusConfig(request.status);
            const priorityConfig = getPriorityConfig(request.priority);
            const TypeIcon = typeConfig.icon;
            
            return (
              <Card key={request.id} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${typeConfig.color}`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{request.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {request.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
                          {!request.isWithinSla && request.status !== 'completed' && (
                            <Badge className="bg-rose-100 text-rose-700 text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              SLA Excedido
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {request.requesterName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {request.requesterDepartment}
                        </span>
                        <Badge className={priorityConfig.className} variant="outline">
                          {priorityConfig.label}
                        </Badge>
                        <span className="text-xs">
                          {formatDistanceToNow(request.createdAt, { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Tabs>
    </div>
  );
}
