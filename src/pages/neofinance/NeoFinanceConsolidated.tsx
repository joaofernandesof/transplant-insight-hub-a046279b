/**
 * NeoFinance Consolidated - Resumo consolidado de todas as operações
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from 'lucide-react';

// Mock data
const allTransactions = [
  { id: 'TX001', date: '2024-01-29 14:32', portal: 'NeoPay', category: 'Assinatura', description: 'Premium - Dr. João Silva', amount: 2500, type: 'income', status: 'completed' },
  { id: 'TX002', date: '2024-01-29 13:15', portal: 'NeoTeam', category: 'Procedimento', description: 'FUE - Clínica Vida', amount: 8500, type: 'income', status: 'completed' },
  { id: 'TX003', date: '2024-01-29 12:48', portal: 'IPROMED', category: 'Honorários', description: 'Processo #12345', amount: -3200, type: 'expense', status: 'pending' },
  { id: 'TX004', date: '2024-01-29 11:22', portal: 'Academy', category: 'Curso', description: 'Tricologia Avançada', amount: 1800, type: 'income', status: 'completed' },
  { id: 'TX005', date: '2024-01-29 10:55', portal: 'NeoLicense', category: 'Licença', description: 'Mensal - SP Centro', amount: 4500, type: 'income', status: 'completed' },
  { id: 'TX006', date: '2024-01-28 16:20', portal: 'NeoPay', category: 'Transação', description: 'PIX - Clínica Derma', amount: 12000, type: 'income', status: 'completed' },
  { id: 'TX007', date: '2024-01-28 15:45', portal: 'NeoTeam', category: 'Material', description: 'Compra estoque Minoxidil', amount: -4500, type: 'expense', status: 'completed' },
  { id: 'TX008', date: '2024-01-28 14:30', portal: 'NeoPay', category: 'Reembolso', description: 'Cancelamento assinatura', amount: -850, type: 'expense', status: 'completed' },
  { id: 'TX009', date: '2024-01-28 11:00', portal: 'IPROMED', category: 'Fatura', description: 'Consultoria mensal', amount: 8500, type: 'income', status: 'completed' },
  { id: 'TX010', date: '2024-01-27 09:15', portal: 'Academy', category: 'Curso', description: 'Workshop Transplante', amount: 3200, type: 'income', status: 'completed' },
];

const summaryByPortal = [
  { portal: 'NeoPay', income: 215000, expense: 12500, net: 202500, transactions: 847 },
  { portal: 'NeoTeam', income: 72000, expense: 18500, net: 53500, transactions: 156 },
  { portal: 'IPROMED', income: 52000, expense: 8200, net: 43800, transactions: 48 },
  { portal: 'NeoLicense', income: 45000, expense: 2500, net: 42500, transactions: 32 },
  { portal: 'Academy', income: 35000, expense: 5800, net: 29200, transactions: 124 },
];

export default function NeoFinanceConsolidated() {
  const [search, setSearch] = useState('');
  const [portalFilter, setPortalFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredTransactions = allTransactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(search.toLowerCase()) ||
                         tx.id.toLowerCase().includes(search.toLowerCase());
    const matchesPortal = portalFilter === 'all' || tx.portal === portalFilter;
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    return matchesSearch && matchesPortal && matchesType;
  });

  const totalIncome = summaryByPortal.reduce((sum, p) => sum + p.income, 0);
  const totalExpense = summaryByPortal.reduce((sum, p) => sum + p.expense, 0);
  const totalNet = totalIncome - totalExpense;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Resumo Consolidado</h1>
          <p className="text-muted-foreground">Todas as transações de todos os portais</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Jan 2024
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Total de Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(totalIncome)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
              Total de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {formatCurrency(totalExpense)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Resultado Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {formatCurrency(totalNet)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="summary">Resumo por Portal</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar transações..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={portalFilter} onValueChange={setPortalFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Portal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Portais</SelectItem>
                    <SelectItem value="NeoPay">NeoPay</SelectItem>
                    <SelectItem value="NeoTeam">NeoTeam</SelectItem>
                    <SelectItem value="IPROMED">IPROMED</SelectItem>
                    <SelectItem value="Academy">Academy</SelectItem>
                    <SelectItem value="NeoLicense">NeoLicense</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="income">Receitas</SelectItem>
                    <SelectItem value="expense">Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Portal</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-sm">{tx.id}</TableCell>
                      <TableCell className="text-sm">{tx.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{tx.portal}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{tx.category}</TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell>
                        <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                          {tx.status === 'completed' ? 'Concluído' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Resumo por Portal</CardTitle>
              <CardDescription>Visão consolidada de receitas e despesas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Portal</TableHead>
                    <TableHead className="text-right">Receitas</TableHead>
                    <TableHead className="text-right">Despesas</TableHead>
                    <TableHead className="text-right">Resultado</TableHead>
                    <TableHead className="text-right">Transações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryByPortal.map((row) => (
                    <TableRow key={row.portal}>
                      <TableCell className="font-medium">{row.portal}</TableCell>
                      <TableCell className="text-right text-emerald-600">{formatCurrency(row.income)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(row.expense)}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(row.net)}</TableCell>
                      <TableCell className="text-right">{row.transactions}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-right text-emerald-600">{formatCurrency(totalIncome)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(totalExpense)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalNet)}</TableCell>
                    <TableCell className="text-right">{summaryByPortal.reduce((s, p) => s + p.transactions, 0)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
