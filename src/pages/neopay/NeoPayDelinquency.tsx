import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
  AlertTriangle,
  Clock,
  Ban,
  CheckCircle2,
  Send,
  Phone,
  Mail,
  RefreshCw,
  Eye,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data
const mockDelinquency = [
  { id: 'DEL-001', customer: 'Maria Santos', email: 'maria@email.com', chargeId: 'CHG-003', amount: 450, daysOverdue: 14, status: 'late', retryCount: 2, lastNotification: '2025-01-27', accessBlocked: false },
  { id: 'DEL-002', customer: 'Dr. Pedro Costa', email: 'pedro@medico.com', chargeId: 'CHG-004', amount: 1200, daysOverdue: 2, status: 'late', retryCount: 1, lastNotification: '2025-01-28', accessBlocked: false },
  { id: 'DEL-003', customer: 'Instituto Hair', email: 'financeiro@hair.com', chargeId: 'CHG-007', amount: 2500, daysOverdue: 35, status: 'delinquent', retryCount: 5, lastNotification: '2025-01-20', accessBlocked: true },
];

const statusConfig = {
  current: { label: 'Em dia', variant: 'default' as const, icon: CheckCircle2 },
  late: { label: 'Atrasado', variant: 'secondary' as const, icon: Clock },
  delinquent: { label: 'Inadimplente', variant: 'destructive' as const, icon: AlertTriangle },
  blocked: { label: 'Bloqueado', variant: 'destructive' as const, icon: Ban },
  recovered: { label: 'Recuperado', variant: 'outline' as const, icon: CheckCircle2 },
};

export default function NeoPayDelinquency() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredData = mockDelinquency.filter((item) => {
    const matchesSearch = item.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalOverdue = mockDelinquency.reduce((sum, d) => sum + d.amount, 0);
  const blockedCount = mockDelinquency.filter(d => d.accessBlocked).length;
  const avgDaysOverdue = Math.round(mockDelinquency.reduce((sum, d) => sum + d.daysOverdue, 0) / mockDelinquency.length);

  const handleRetry = (id: string) => {
    toast.info('Tentando nova cobrança...');
  };

  const handleNotify = (id: string) => {
    toast.success('Notificação enviada!');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Inadimplência</h1>
          <p className="text-muted-foreground">Monitore e recupere cobranças em atraso</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p>
                <p className="text-xs text-muted-foreground">Total em Atraso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{mockDelinquency.length}</p>
                <p className="text-xs text-muted-foreground">Cobranças Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{avgDaysOverdue} dias</p>
                <p className="text-xs text-muted-foreground">Média de Atraso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gray-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Ban className="h-8 w-8 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{blockedCount}</p>
                <p className="text-xs text-muted-foreground">Acessos Bloqueados</p>
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
                placeholder="Buscar por cliente..."
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
                <SelectItem value="late">Atrasados</SelectItem>
                <SelectItem value="delinquent">Inadimplentes</SelectItem>
                <SelectItem value="blocked">Bloqueados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Delinquency Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Cobrança</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Dias em Atraso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tentativas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => {
                const status = statusConfig[item.status as keyof typeof statusConfig];
                const StatusIcon = status?.icon || AlertTriangle;
                const urgencyLevel = item.daysOverdue > 30 ? 100 : item.daysOverdue > 14 ? 66 : 33;
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.customer}</p>
                        <p className="text-xs text-muted-foreground">{item.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.chargeId}</TableCell>
                    <TableCell className="font-medium text-red-600">{formatCurrency(item.amount)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{item.daysOverdue} dias</p>
                        <Progress value={urgencyLevel} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={status?.variant}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status?.label}
                        </Badge>
                        {item.accessBlocked && (
                          <Badge variant="outline" className="text-red-600">
                            <Ban className="h-3 w-3 mr-1" />
                            Bloqueado
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{item.retryCount} tentativas</p>
                        <p className="text-xs text-muted-foreground">Última: {item.lastNotification}</p>
                      </div>
                    </TableCell>
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
                            Ver Histórico
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRetry(item.id)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Tentar Novamente
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleNotify(item.id)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Lembrete
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="h-4 w-4 mr-2" />
                            Contato Direto
                          </DropdownMenuItem>
                          {!item.accessBlocked && (
                            <DropdownMenuItem className="text-destructive">
                              <Ban className="h-4 w-4 mr-2" />
                              Bloquear Acesso
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
