import React, { useState, useMemo } from 'react';
import { useClinicAuth } from '../contexts/ClinicAuthContext';
import { useClinicSales } from '../hooks/useClinicSales';
import { useClinicSurgeries } from '../hooks/useClinicSurgeries';
import { useNoDatePatients } from '../hooks/useNoDatePatients';
import { useBranches } from '../hooks/useBranches';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NoDateQueue from './NoDateQueue';

export default function ClinicDashboard() {
  const { user, currentBranch, isAdmin, isGestao } = useClinicAuth();
  const { sales, stats: salesStats } = useClinicSales();
  const { thisWeekSurgeries, noDateSurgeries, pendingChecklist, stats: surgeryStats, surgeries } = useClinicSurgeries();
  const { stats: noDateStats, allPatients: noDatePatients } = useNoDatePatients();
  const { branches: allowedBranches } = useBranches();
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedDelay, setSelectedDelay] = useState<string>('all');

  const canFilterBranch = isAdmin || isGestao;

  // Derive unique branches from surgeries data for filter options
  const branchOptions = useMemo(() => {
    if (canFilterBranch) {
      const fromSurgeries = surgeries.map(s => s.branch);
      const fromNoDate = noDatePatients.map(p => p.branch);
      return [...new Set([...allowedBranches, ...fromSurgeries, ...fromNoDate])].filter(Boolean).sort();
    }
    return allowedBranches;
  }, [canFilterBranch, surgeries, noDatePatients, allowedBranches]);

  // Apply branch filter to all data
  const filterByBranch = <T extends { branch: string }>(items: T[]) => {
    if (selectedBranch === 'all') return items;
    return items.filter(i => i.branch === selectedBranch);
  };

  const filteredWeekSurgeries = useMemo(() => filterByBranch(thisWeekSurgeries), [thisWeekSurgeries, selectedBranch]);
  const filteredPendingChecklist = useMemo(() => filterByBranch(pendingChecklist), [pendingChecklist, selectedBranch]);
  const filteredNoDatePatients = useMemo(() => {
    let result = filterByBranch(noDatePatients);
    if (selectedDelay === '30') result = result.filter(p => p.daysSinceSale >= 30);
    if (selectedDelay === '60') result = result.filter(p => p.daysSinceSale >= 60);
    return result;
  }, [noDatePatients, selectedBranch, selectedDelay]);

  const filteredNoDateStats = useMemo(() => ({
    total: filteredNoDatePatients.length,
    over30: filteredNoDatePatients.filter(p => p.daysSinceSale >= 30).length,
    over60: filteredNoDatePatients.filter(p => p.daysSinceSale >= 60).length,
  }), [filteredNoDatePatients]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  };

  // Current month sales (filtered by branch)
  const currentMonthSales = useMemo(() => {
    const now = new Date();
    return sales.filter(s => {
      const saleDate = new Date(s.saleDate);
      const matchMonth = saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      if (selectedBranch !== 'all' && s.branch !== selectedBranch) return false;
      return matchMonth;
    });
  }, [sales, selectedBranch]);

  return (
    <div className="space-y-6">
      {/* Header with Branch Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agenda Cirúrgica</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {user?.name}
            {currentBranch && !canFilterBranch && allowedBranches.length <= 1 && (
              <span> • {currentBranch}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Branch filter - visible for all users */}
          {(canFilterBranch ? branchOptions.length > 0 : allowedBranches.length > 1) && (
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas unidades</SelectItem>
                {(canFilterBranch ? branchOptions : allowedBranches).map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Days/delay filter */}
          <Select value={selectedDelay} onValueChange={setSelectedDelay}>
            <SelectTrigger className="w-[160px]">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tempo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="30">+30 dias</SelectItem>
              <SelectItem value="60">+60 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="vendidos-sem-data">
            Vendidos Sem Data
            {filteredNoDateStats.total > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {filteredNoDateStats.total}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral">
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Cirurgias da Semana</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredWeekSurgeries.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {filteredWeekSurgeries.filter(s => s.surgeryConfirmed).length} confirmadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pendências Pré-Op</CardTitle>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredPendingChecklist.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Exames, contratos ou prontuários
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Vendidos Sem Data</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredNoDateStats.total}</div>
                  <div className="flex gap-3 text-xs mt-1">
                    {filteredNoDateStats.over30 > 0 && (
                      <span className="text-yellow-600">{filteredNoDateStats.over30} +30d</span>
                    )}
                    {filteredNoDateStats.over60 > 0 && (
                      <span className="text-red-600">{filteredNoDateStats.over60} +60d</span>
                    )}
                    {filteredNoDateStats.over30 === 0 && filteredNoDateStats.over60 === 0 && (
                      <span className="text-muted-foreground">Sem alertas</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentMonthSales.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(currentMonthSales.reduce((sum, s) => sum + s.vgv, 0))} VGV
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* This Week Surgeries */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Cirurgias da Semana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {filteredWeekSurgeries.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhuma cirurgia agendada para esta semana
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {filteredWeekSurgeries.map(surgery => (
                          <div
                            key={surgery.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{surgery.patientName}</p>
                              <p className="text-sm text-muted-foreground">
                                {surgery.procedure} • Grau {surgery.grade || '-'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {surgery.surgeryDate && formatDateLabel(surgery.surgeryDate)}
                                {surgery.surgeryTime && ` às ${surgery.surgeryTime.substring(0, 5)}`}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {surgery.surgeryConfirmed ? (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Confirmada
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Pendente</Badge>
                              )}
                              {surgery.category && (
                                <Badge variant="outline" className="text-xs">
                                  {surgery.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Pending Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Pendências Pré-Operatórias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {filteredPendingChecklist.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhuma pendência encontrada
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {filteredPendingChecklist.slice(0, 10).map(surgery => (
                          <div
                            key={surgery.id}
                            className="p-3 rounded-lg border bg-card"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium truncate">{surgery.patientName}</p>
                              {surgery.surgeryDate && (
                                <span className="text-xs text-muted-foreground">
                                  {format(parseISO(surgery.surgeryDate), 'dd/MM')}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {!surgery.examsSent && (
                                <Badge variant="destructive" className="text-xs">
                                  Exames
                                </Badge>
                              )}
                              {!surgery.contractSigned && (
                                <Badge variant="destructive" className="text-xs">
                                  Contrato
                                </Badge>
                              )}
                              {!surgery.chartReady && (
                                <Badge variant="destructive" className="text-xs">
                                  Prontuário
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vendidos-sem-data">
          <NoDateQueue />
        </TabsContent>
      </Tabs>
    </div>
  );
}
