/**
 * IPROMED Financial - Contas a Receber
 * Gestão de honorários e recebíveis do escritório
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Plus,
  Search,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Scale,
  Briefcase,
  FileText,
} from "lucide-react";
import { format, isPast, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Receivable {
  id: string;
  client: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  type: string;
  area: string;
  paidAt?: string;
}

const types = [
  { value: 'honorario', label: 'Honorários Contratuais' },
  { value: 'exito', label: 'Honorários de Êxito' },
  { value: 'consulta', label: 'Consulta' },
  { value: 'parecer', label: 'Parecer' },
  { value: 'mensalidade', label: 'Mensalidade' },
  { value: 'recorrencia', label: 'Recorrência (PJ)' },
];

const areas = [
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'civel', label: 'Cível' },
  { value: 'previdenciario', label: 'Previdenciário' },
  { value: 'empresarial', label: 'Empresarial' },
  { value: 'tributario', label: 'Tributário' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'medico', label: 'Direito Médico' },
];

const mockReceivables: Receivable[] = [
  { id: '1', client: 'Dr. João Silva', description: 'Honorários - Defesa Administrativa', amount: 5000, dueDate: '2026-02-05', status: 'pending', type: 'honorario', area: 'administrativo' },
  { id: '2', client: 'Dra. Maria Santos', description: 'Consulta jurídica preventiva', amount: 500, dueDate: '2026-01-20', status: 'paid', paidAt: '2026-01-19', type: 'consulta', area: 'medico' },
  { id: '3', client: 'Clínica ABC', description: 'Mensalidade - Consultivo', amount: 3500, dueDate: '2026-01-15', status: 'overdue', type: 'mensalidade', area: 'empresarial' },
  { id: '4', client: 'Dr. Carlos Oliveira', description: 'Parecer jurídico', amount: 2500, dueDate: '2026-02-10', status: 'pending', type: 'parecer', area: 'medico' },
  { id: '5', client: 'Hospital XYZ', description: 'Honorários de êxito - Proc. 001', amount: 25000, dueDate: '2026-03-01', status: 'pending', type: 'exito', area: 'civel' },
  { id: '6', client: 'Dra. Ana Costa', description: 'Recorrência PJ - Janeiro', amount: 4500, dueDate: '2026-01-10', status: 'paid', paidAt: '2026-01-10', type: 'recorrencia', area: 'empresarial' },
];

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  paid: { label: 'Recebido', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  overdue: { label: 'Atrasado', color: 'bg-rose-100 text-rose-700', icon: AlertCircle },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function AccountsReceivable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const receivables = mockReceivables.map(r => ({
    ...r,
    status: r.status === 'pending' && isPast(new Date(r.dueDate)) ? 'overdue' as const : r.status,
  }));

  const filteredReceivables = receivables.filter(r => {
    const matchesSearch = r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = areaFilter === 'all' || r.area === areaFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesArea && matchesStatus;
  });

  const stats = {
    total: receivables.reduce((sum, r) => sum + r.amount, 0),
    pending: receivables.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0),
    overdue: receivables.filter(r => r.status === 'overdue').reduce((sum, r) => sum + r.amount, 0),
    received: receivables.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
            Contas a Receber
          </h2>
          <p className="text-sm text-muted-foreground">
            Honorários, consultas, pareceres e mensalidades por cliente e área
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Recebível
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Recebível</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Input placeholder="Nome do cliente" />
              </div>
              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Input placeholder="Ex: Honorários - Processo 001" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$) *</Label>
                  <Input type="number" step="0.01" placeholder="0,00" />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento *</Label>
                  <Input type="date" defaultValue={addDays(new Date(), 30).toISOString().split('T')[0]} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Área do Direito</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map(a => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsFormOpen(false)}>
                  Cadastrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{formatCurrency(stats.total)}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-sm text-amber-700">Pendente</p>
            <p className="text-xl font-bold text-amber-800">{formatCurrency(stats.pending)}</p>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="p-4">
            <p className="text-sm text-rose-700">Atrasado</p>
            <p className="text-xl font-bold text-rose-800">{formatCurrency(stats.overdue)}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <p className="text-sm text-emerald-700">Recebido</p>
            <p className="text-xl font-bold text-emerald-800">{formatCurrency(stats.received)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Área do Direito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas áreas</SelectItem>
                {areas.map(a => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="overdue">Atrasados</SelectItem>
                <SelectItem value="paid">Recebidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Cliente</TableHead>
                <TableHead className="font-semibold">Descrição</TableHead>
                <TableHead className="font-semibold">Área</TableHead>
                <TableHead className="font-semibold">Valor</TableHead>
                <TableHead className="font-semibold">Vencimento</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceivables.map(receivable => {
                const status = statusConfig[receivable.status];
                const StatusIcon = status.icon;
                const area = areas.find(a => a.value === receivable.area);
                
                return (
                  <TableRow key={receivable.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{receivable.client}</span>
                      </div>
                    </TableCell>
                    <TableCell>{receivable.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {area?.label || receivable.area}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(receivable.amount)}</TableCell>
                    <TableCell>
                      {format(new Date(receivable.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge className={`gap-1 ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {receivable.status !== 'paid' && (
                        <Button size="sm" variant="outline">
                          Receber
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
