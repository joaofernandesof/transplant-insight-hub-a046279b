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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreHorizontal,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Upload,
  Eye,
  FileText,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data
const mockChargebacks = [
  { id: 'CB-001', chargeId: 'CHG-015', customer: 'João Pereira', amount: 1500, status: 'pending', reasonCode: '4837', reasonDescription: 'Transação não reconhecida', disputeDeadline: '2025-02-15', evidenceSubmitted: false, createdAt: '2025-01-25' },
  { id: 'CB-002', chargeId: 'CHG-016', customer: 'Maria Oliveira', amount: 850, status: 'under_review', reasonCode: '4853', reasonDescription: 'Mercadoria não recebida', disputeDeadline: '2025-02-10', evidenceSubmitted: true, createdAt: '2025-01-20' },
  { id: 'CB-003', chargeId: 'CHG-017', customer: 'Carlos Silva', amount: 2200, status: 'won', reasonCode: '4837', reasonDescription: 'Transação não reconhecida', disputeDeadline: '2025-01-30', evidenceSubmitted: true, createdAt: '2025-01-10' },
  { id: 'CB-004', chargeId: 'CHG-018', customer: 'Ana Costa', amount: 450, status: 'lost', reasonCode: '4855', reasonDescription: 'Cancelamento não processado', disputeDeadline: '2025-01-25', evidenceSubmitted: true, createdAt: '2025-01-05' },
];

const statusConfig = {
  pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock, color: 'text-amber-600' },
  under_review: { label: 'Em Análise', variant: 'outline' as const, icon: AlertTriangle, color: 'text-blue-600' },
  won: { label: 'Ganho', variant: 'default' as const, icon: CheckCircle2, color: 'text-emerald-600' },
  lost: { label: 'Perdido', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
};

export default function NeoPayChargebacks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedChargeback, setSelectedChargeback] = useState<typeof mockChargebacks[0] | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredChargebacks = mockChargebacks.filter((cb) => {
    const matchesSearch = cb.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cb.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || cb.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: mockChargebacks.length,
    pending: mockChargebacks.filter(cb => cb.status === 'pending' || cb.status === 'under_review').length,
    totalAmount: mockChargebacks.filter(cb => cb.status === 'pending' || cb.status === 'under_review').reduce((sum, cb) => sum + cb.amount, 0),
    winRate: Math.round((mockChargebacks.filter(cb => cb.status === 'won').length / mockChargebacks.filter(cb => ['won', 'lost'].includes(cb.status)).length) * 100) || 0,
  };

  const getDaysRemaining = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Chargebacks</h1>
          <p className="text-muted-foreground">Gerencie disputas e contestações</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total de Chargebacks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Em Aberto</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
                <p className="text-xs text-muted-foreground">Valor em Disputa</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{stats.winRate}%</p>
                <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
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
                placeholder="Buscar chargebacks..."
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
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="under_review">Em Análise</SelectItem>
                <SelectItem value="won">Ganhos</SelectItem>
                <SelectItem value="lost">Perdidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Chargebacks Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Evidências</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChargebacks.map((cb) => {
                const status = statusConfig[cb.status as keyof typeof statusConfig];
                const StatusIcon = status?.icon || Clock;
                const daysRemaining = getDaysRemaining(cb.disputeDeadline);
                const isUrgent = daysRemaining <= 5 && ['pending', 'under_review'].includes(cb.status);
                
                return (
                  <TableRow key={cb.id}>
                    <TableCell className="font-mono text-sm">{cb.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{cb.customer}</p>
                        <p className="text-xs text-muted-foreground">{cb.chargeId}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-red-600">{formatCurrency(cb.amount)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{cb.reasonDescription}</p>
                        <p className="text-xs text-muted-foreground">Código: {cb.reasonCode}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status?.variant}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {['pending', 'under_review'].includes(cb.status) ? (
                        <div className="space-y-1">
                          <p className={`text-sm font-medium ${isUrgent ? 'text-red-600' : ''}`}>
                            {daysRemaining} dias
                          </p>
                          <Progress 
                            value={Math.max(0, Math.min(100, (daysRemaining / 30) * 100))} 
                            className="h-1.5" 
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {cb.evidenceSubmitted ? (
                        <Badge variant="outline" className="text-emerald-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Enviadas
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedChargeback(cb)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Detalhes
                          </DropdownMenuItem>
                          {!cb.evidenceSubmitted && ['pending', 'under_review'].includes(cb.status) && (
                            <DropdownMenuItem>
                              <Upload className="h-4 w-4 mr-2" />
                              Enviar Evidências
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Documentos
                          </DropdownMenuItem>
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedChargeback} onOpenChange={() => setSelectedChargeback(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Chargeback</DialogTitle>
            <DialogDescription>{selectedChargeback?.id}</DialogDescription>
          </DialogHeader>
          {selectedChargeback && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedChargeback.customer}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-medium text-red-600">{formatCurrency(selectedChargeback.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Código do Motivo</p>
                  <p className="font-mono">{selectedChargeback.reasonCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={statusConfig[selectedChargeback.status as keyof typeof statusConfig]?.variant}>
                    {statusConfig[selectedChargeback.status as keyof typeof statusConfig]?.label}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Descrição do Motivo</p>
                <p>{selectedChargeback.reasonDescription}</p>
              </div>
              {['pending', 'under_review'].includes(selectedChargeback.status) && (
                <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
                  <p className="text-sm font-medium text-amber-800">Ação Necessária</p>
                  <p className="text-sm text-amber-700">
                    Envie evidências antes de {selectedChargeback.disputeDeadline} para contestar esta disputa.
                  </p>
                  <Button className="mt-3 bg-amber-600 hover:bg-amber-700" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Evidências
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
