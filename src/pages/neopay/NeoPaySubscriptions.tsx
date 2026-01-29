import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreHorizontal,
  RefreshCw,
  Play,
  Pause,
  XCircle,
  Users,
  TrendingUp,
  Calendar,
  CreditCard,
  Eye,
} from 'lucide-react';

// Mock data
const mockSubscriptions = [
  { id: 'SUB-001', customer: 'Dr. João Silva', product: 'Plano Premium Mensal', amount: 299, status: 'active', currentPeriodEnd: '2025-02-28', createdAt: '2024-10-15' },
  { id: 'SUB-002', customer: 'Clínica Vida Nova', product: 'Licença ByNeoFolic', amount: 2500, status: 'active', currentPeriodEnd: '2025-02-15', createdAt: '2024-08-20' },
  { id: 'SUB-003', customer: 'Maria Santos', product: 'Plano Premium Mensal', amount: 299, status: 'past_due', currentPeriodEnd: '2025-01-15', createdAt: '2024-11-10' },
  { id: 'SUB-004', customer: 'Dr. Pedro Costa', product: 'Licença ByNeoFolic', amount: 2500, status: 'cancelled', currentPeriodEnd: '2025-01-30', createdAt: '2024-06-01' },
  { id: 'SUB-005', customer: 'Ana Ferreira', product: 'Plano Premium Mensal', amount: 299, status: 'active', currentPeriodEnd: '2025-02-20', createdAt: '2024-12-20' },
  { id: 'SUB-006', customer: 'Instituto Hair', product: 'Licença ByNeoFolic', amount: 2500, status: 'paused', currentPeriodEnd: '2025-01-25', createdAt: '2024-09-15' },
];

const statusConfig = {
  active: { label: 'Ativa', variant: 'default' as const, color: 'text-emerald-600' },
  paused: { label: 'Pausada', variant: 'secondary' as const, color: 'text-amber-600' },
  past_due: { label: 'Em Atraso', variant: 'destructive' as const, color: 'text-red-600' },
  cancelled: { label: 'Cancelada', variant: 'outline' as const, color: 'text-muted-foreground' },
};

export default function NeoPaySubscriptions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredSubscriptions = mockSubscriptions.filter((sub) => {
    const matchesSearch = sub.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    active: mockSubscriptions.filter(s => s.status === 'active').length,
    mrr: mockSubscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0),
    pastDue: mockSubscriptions.filter(s => s.status === 'past_due').length,
    churnRate: 8.5,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Assinaturas</h1>
          <p className="text-muted-foreground">Gerencie assinaturas e planos recorrentes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Assinaturas Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.mrr)}</p>
                <p className="text-xs text-muted-foreground">MRR</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pastDue}</p>
                <p className="text-xs text-muted-foreground">Em Atraso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.churnRate}%</p>
                <p className="text-xs text-muted-foreground">Churn Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar assinaturas..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="paused">Pausadas</SelectItem>
                <SelectItem value="past_due">Em Atraso</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Próxima Cobrança</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((sub) => {
                const status = statusConfig[sub.status as keyof typeof statusConfig];
                return (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono text-sm">{sub.id}</TableCell>
                    <TableCell className="font-medium">{sub.customer}</TableCell>
                    <TableCell>{sub.product}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(sub.amount)}/mês</TableCell>
                    <TableCell>
                      <Badge variant={status?.variant}>{status?.label}</Badge>
                    </TableCell>
                    <TableCell>{sub.currentPeriodEnd}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Atualizar Pagamento
                          </DropdownMenuItem>
                          {sub.status === 'active' && (
                            <DropdownMenuItem>
                              <Pause className="h-4 w-4 mr-2" />
                              Pausar
                            </DropdownMenuItem>
                          )}
                          {sub.status === 'paused' && (
                            <DropdownMenuItem>
                              <Play className="h-4 w-4 mr-2" />
                              Reativar
                            </DropdownMenuItem>
                          )}
                          {sub.status !== 'cancelled' && (
                            <DropdownMenuItem className="text-destructive">
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
