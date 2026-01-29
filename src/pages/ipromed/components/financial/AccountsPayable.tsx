/**
 * IPROMED Financial - Contas a Pagar
 * Gestão de despesas do escritório jurídico
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Users,
  Building,
  Briefcase,
  FileText,
  Percent,
} from "lucide-react";
import { format, isPast, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Payable {
  id: string;
  description: string;
  supplier: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  category: string;
  paidAt?: string;
}

const categories = [
  { value: 'prolabore', label: 'Pró-labore', icon: Users },
  { value: 'folha', label: 'Folha de Pagamento', icon: Users },
  { value: 'estagiarios', label: 'Estagiários', icon: Briefcase },
  { value: 'correspondente', label: 'Correspondente Jurídico', icon: Building },
  { value: 'perito', label: 'Peritos', icon: FileText },
  { value: 'custas', label: 'Custas Processuais', icon: FileText },
  { value: 'diligencias', label: 'Diligências', icon: Briefcase },
  { value: 'marketing', label: 'Marketing', icon: Percent },
  { value: 'software', label: 'Softwares Jurídicos', icon: FileText },
  { value: 'aluguel', label: 'Aluguel', icon: Building },
  { value: 'impostos', label: 'Impostos', icon: FileText },
  { value: 'outros', label: 'Outros', icon: FileText },
];

const mockPayables: Payable[] = [
  { id: '1', description: 'Pró-labore - Janeiro', supplier: 'Sócio 1', amount: 15000, dueDate: '2026-01-30', status: 'pending', category: 'prolabore' },
  { id: '2', description: 'Perito - Processo 001', supplier: 'Dr. Carlos Mendes', amount: 3500, dueDate: '2026-02-05', status: 'pending', category: 'perito' },
  { id: '3', description: 'Custas - TRT', supplier: 'TRT-15', amount: 850, dueDate: '2026-01-25', status: 'overdue', category: 'custas' },
  { id: '4', description: 'Software Jurídico - Mensal', supplier: 'Astrea', amount: 450, dueDate: '2026-01-15', status: 'paid', paidAt: '2026-01-14', category: 'software' },
  { id: '5', description: 'Correspondente - Audiência SP', supplier: 'Adv. José Silva', amount: 1200, dueDate: '2026-02-10', status: 'pending', category: 'correspondente' },
  { id: '6', description: 'Aluguel - Fevereiro', supplier: 'Imobiliária XYZ', amount: 4500, dueDate: '2026-02-01', status: 'pending', category: 'aluguel' },
];

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  paid: { label: 'Pago', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  overdue: { label: 'Vencido', color: 'bg-rose-100 text-rose-700', icon: AlertCircle },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function AccountsPayable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Apply status updates for overdue items
  const payables = mockPayables.map(p => ({
    ...p,
    status: p.status === 'pending' && isPast(new Date(p.dueDate)) ? 'overdue' as const : p.status,
  }));

  const filteredPayables = payables.filter(p => {
    const matchesSearch = p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: payables.reduce((sum, p) => sum + p.amount, 0),
    pending: payables.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    overdue: payables.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
    paid: payables.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-rose-600" />
            Contas a Pagar
          </h2>
          <p className="text-sm text-muted-foreground">
            Pró-labore, folha, estagiários, correspondentes, peritos e custas
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Despesa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Despesa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Input placeholder="Ex: Custas processuais - Processo 001" />
              </div>
              <div className="space-y-2">
                <Label>Fornecedor / Beneficiário</Label>
                <Input placeholder="Nome do fornecedor" />
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
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <p className="text-sm text-rose-700">Vencido</p>
            <p className="text-xl font-bold text-rose-800">{formatCurrency(stats.overdue)}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <p className="text-sm text-emerald-700">Pago</p>
            <p className="text-xl font-bold text-emerald-800">{formatCurrency(stats.paid)}</p>
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
                placeholder="Buscar despesas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
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
                <SelectItem value="overdue">Vencidos</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
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
                <TableHead className="font-semibold">Descrição</TableHead>
                <TableHead className="font-semibold">Fornecedor</TableHead>
                <TableHead className="font-semibold">Categoria</TableHead>
                <TableHead className="font-semibold">Valor</TableHead>
                <TableHead className="font-semibold">Vencimento</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayables.map(payable => {
                const status = statusConfig[payable.status];
                const StatusIcon = status.icon;
                const category = categories.find(c => c.value === payable.category);
                
                return (
                  <TableRow key={payable.id}>
                    <TableCell className="font-medium">{payable.description}</TableCell>
                    <TableCell>{payable.supplier}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {category?.label || payable.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(payable.amount)}</TableCell>
                    <TableCell>
                      {format(new Date(payable.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge className={`gap-1 ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payable.status !== 'paid' && (
                        <Button size="sm" variant="outline">
                          Pagar
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
