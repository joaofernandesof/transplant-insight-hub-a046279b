/**
 * IPROMED Financial - Conciliação Bancária
 * Conciliação automática de lançamentos
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Link2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  RefreshCw,
  Building2,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";

interface BankEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'matched' | 'pending' | 'partial';
  matchedTo?: string;
}

const mockBankEntries: BankEntry[] = [
  { id: '1', date: '2026-01-28', description: 'PIX RECEBIDO - DR JOAO SILVA', amount: 5000, type: 'credit', status: 'matched', matchedTo: 'Honorários - Defesa Administrativa' },
  { id: '2', date: '2026-01-28', description: 'TED RECEBIDO - HOSPITAL XYZ', amount: 8500, type: 'credit', status: 'matched', matchedTo: 'Mensalidade - Consultivo Jan/26' },
  { id: '3', date: '2026-01-27', description: 'PIX RECEBIDO - CLINICA ABC', amount: 2500, type: 'credit', status: 'pending' },
  { id: '4', date: '2026-01-27', description: 'PAG*DR CARLOS PERITO', amount: 3500, type: 'debit', status: 'matched', matchedTo: 'Perito - Processo 001' },
  { id: '5', date: '2026-01-26', description: 'DEBITO AUTO - ALUGUEL', amount: 4500, type: 'debit', status: 'matched', matchedTo: 'Aluguel - Janeiro/26' },
  { id: '6', date: '2026-01-26', description: 'PIX RECEBIDO - DRA MARIA', amount: 500, type: 'credit', status: 'pending' },
  { id: '7', date: '2026-01-25', description: 'TARIFA BANCARIA', amount: 89.90, type: 'debit', status: 'pending' },
];

const statusConfig = {
  matched: { label: 'Conciliado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  partial: { label: 'Parcial', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function BankReconciliation() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const filteredEntries = mockBankEntries.filter(e => 
    statusFilter === 'all' || e.status === statusFilter
  );

  const stats = {
    total: mockBankEntries.length,
    matched: mockBankEntries.filter(e => e.status === 'matched').length,
    pending: mockBankEntries.filter(e => e.status === 'pending').length,
    credits: mockBankEntries.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0),
    debits: mockBankEntries.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0),
  };

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Link2 className="h-5 w-5 text-blue-600" />
            Conciliação Bancária
          </h2>
          <p className="text-sm text-muted-foreground">
            Conciliação automática para "casar" o que entrou no banco com a cobrança do cliente
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Importar Extrato
          </Button>
          <Button className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Lançamentos</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{stats.matched}</p>
            <p className="text-xs text-emerald-600">Conciliados</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
            <p className="text-xs text-amber-600">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.credits)}</p>
            <p className="text-xs text-muted-foreground">Créditos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-rose-600">{formatCurrency(stats.debits)}</p>
            <p className="text-xs text-muted-foreground">Débitos</p>
          </CardContent>
        </Card>
      </div>

      {/* Bank Account */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-base">Conta Principal</CardTitle>
                <CardDescription>Banco do Brasil - Ag 1234 / CC 56789-0</CardDescription>
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="matched">Conciliados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="font-semibold">Descrição Bancária</TableHead>
                <TableHead className="font-semibold">Valor</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Vinculado a</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map(entry => {
                const status = statusConfig[entry.status];
                const StatusIcon = status.icon;
                
                return (
                  <TableRow key={entry.id} className={selectedItems.includes(entry.id) ? 'bg-primary/5' : ''}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedItems.includes(entry.id)}
                        onCheckedChange={() => toggleSelect(entry.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {format(new Date(entry.date), "dd/MM")}
                    </TableCell>
                    <TableCell className="text-sm">{entry.description}</TableCell>
                    <TableCell className={`font-medium ${entry.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {entry.type === 'credit' ? '+' : '-'} {formatCurrency(entry.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`gap-1 ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.matchedTo ? (
                        <span className="text-sm text-muted-foreground">{entry.matchedTo}</span>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          Vincular
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

      {/* Selected Actions */}
      {selectedItems.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedItems.length} item(ns) selecionado(s)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedItems([])}>
                Limpar seleção
              </Button>
              <Button size="sm" className="gap-2">
                <ArrowRight className="h-4 w-4" />
                Conciliar selecionados
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
