/**
 * Push Jurídico - Monitoramento
 * Configuração de termos e processos a monitorar
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  User,
  FileText,
  Building,
  Trash2,
  Edit2,
  Bell,
  AlertCircle,
  CheckCircle2,
  Pause,
  Play,
  Users,
} from "lucide-react";
import { format } from "date-fns";

interface MonitorItem {
  id: string;
  type: 'name' | 'cpf' | 'cnpj' | 'process';
  value: string;
  label: string;
  client?: string;
  status: 'active' | 'paused';
  alertsCount: number;
  lastAlert?: string;
  createdAt: string;
}

const mockMonitors: MonitorItem[] = [
  { id: '1', type: 'name', value: 'JOÃO DA SILVA', label: 'Nome Completo', client: 'Dr. João Silva', status: 'active', alertsCount: 15, lastAlert: '2026-01-29', createdAt: '2025-06-01' },
  { id: '2', type: 'cpf', value: '123.456.789-00', label: 'CPF', client: 'Dr. João Silva', status: 'active', alertsCount: 8, lastAlert: '2026-01-28', createdAt: '2025-06-01' },
  { id: '3', type: 'cnpj', value: '12.345.678/0001-90', label: 'CNPJ', client: 'Hospital XYZ', status: 'active', alertsCount: 23, lastAlert: '2026-01-29', createdAt: '2025-07-15' },
  { id: '4', type: 'process', value: '0001234-56.2024.8.26.0100', label: 'Processo', client: 'Dr. João Silva', status: 'active', alertsCount: 5, lastAlert: '2026-01-25', createdAt: '2025-08-10' },
  { id: '5', type: 'name', value: 'CLÍNICA ABC LTDA', label: 'Razão Social', client: 'Clínica ABC', status: 'paused', alertsCount: 12, lastAlert: '2026-01-20', createdAt: '2025-09-01' },
  { id: '6', type: 'name', value: 'MARIA SANTOS OLIVEIRA', label: 'Nome Completo', client: 'Dra. Maria Santos', status: 'active', alertsCount: 7, lastAlert: '2026-01-28', createdAt: '2025-10-05' },
];

const typeConfig = {
  name: { label: 'Nome', icon: User, color: 'bg-blue-100 text-blue-700' },
  cpf: { label: 'CPF', icon: User, color: 'bg-emerald-100 text-emerald-700' },
  cnpj: { label: 'CNPJ', icon: Building, color: 'bg-purple-100 text-purple-700' },
  process: { label: 'Processo', icon: FileText, color: 'bg-amber-100 text-amber-700' },
};

export default function PushMonitoring() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMonitors = mockMonitors.filter(m => {
    const matchesSearch = m.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.client?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                       (activeTab === 'active' && m.status === 'active') ||
                       (activeTab === 'paused' && m.status === 'paused') ||
                       activeTab === m.type;
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: mockMonitors.length,
    active: mockMonitors.filter(m => m.status === 'active').length,
    paused: mockMonitors.filter(m => m.status === 'paused').length,
    totalAlerts: mockMonitors.reduce((sum, m) => sum + m.alertsCount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Monitoramento Ativo
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie nomes, CPFs, CNPJs e processos monitorados
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Monitoramento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Monitoramento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Monitoramento *</Label>
                <Select defaultValue="name">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nome Completo</SelectItem>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="process">Número de Processo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Valor a Monitorar *</Label>
                <Input placeholder="Digite o nome, CPF, CNPJ ou número do processo" />
                <p className="text-xs text-muted-foreground">
                  O sistema buscará correspondências exatas e aproximadas
                </p>
              </div>

              <div className="space-y-2">
                <Label>Vincular a Cliente</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="joao">Dr. João Silva</SelectItem>
                    <SelectItem value="hospital">Hospital XYZ</SelectItem>
                    <SelectItem value="clinica">Clínica ABC</SelectItem>
                    <SelectItem value="maria">Dra. Maria Santos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rótulo / Descrição</Label>
                <Input placeholder="Ex: Nome do sócio, CPF do cliente" />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">Ativar Notificações Push</p>
                  <p className="text-xs text-muted-foreground">Receber alertas em tempo real</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsFormOpen(false)}>
                  Adicionar Monitoramento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total de Monitoramentos</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
            <p className="text-xs text-emerald-600">Ativos</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.paused}</p>
            <p className="text-xs text-amber-600">Pausados</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.totalAlerts}</p>
            <p className="text-xs text-blue-600">Alertas Gerados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar monitoramentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Ativos</TabsTrigger>
            <TabsTrigger value="paused">Pausados</TabsTrigger>
            <TabsTrigger value="name">Nomes</TabsTrigger>
            <TabsTrigger value="process">Processos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Valor Monitorado</TableHead>
                <TableHead className="font-semibold">Cliente</TableHead>
                <TableHead className="font-semibold">Alertas</TableHead>
                <TableHead className="font-semibold">Último Alerta</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMonitors.map(monitor => {
                const type = typeConfig[monitor.type];
                const TypeIcon = type.icon;

                return (
                  <TableRow key={monitor.id}>
                    <TableCell>
                      <Badge className={`gap-1 ${type.color}`}>
                        <TypeIcon className="h-3 w-3" />
                        {type.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{monitor.value}</TableCell>
                    <TableCell>
                      {monitor.client && (
                        <span className="flex items-center gap-1 text-sm">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {monitor.client}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{monitor.alertsCount}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {monitor.lastAlert ? format(new Date(monitor.lastAlert), "dd/MM/yyyy") : '-'}
                    </TableCell>
                    <TableCell>
                      {monitor.status === 'active' ? (
                        <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 gap-1">
                          <Pause className="h-3 w-3" />
                          Pausado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          {monitor.status === 'active' ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Como funciona o monitoramento</p>
              <p className="text-sm text-blue-700">
                O sistema realiza varreduras automáticas a cada 6 horas em aproximadamente 100 tribunais e 
                diários oficiais brasileiros. Quando encontramos uma correspondência exata ou aproximada 
                dos termos configurados, você recebe uma notificação push imediatamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
