import React, { useState, useMemo } from 'react';
import { useClinicAuth } from '../contexts/ClinicAuthContext';
import { useClinicSales } from '../hooks/useClinicSales';
import { useClinicSurgeries, ClinicSurgery } from '../hooks/useClinicSurgeries';
import { useNoDatePatients } from '../hooks/useNoDatePatients';
import { useBranches } from '../hooks/useBranches';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Calendar,
  CalendarIcon,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NoDateQueue from './NoDateQueue';
import { SurgeryWeekTable } from '../components/SurgeryWeekTable';

export default function ClinicDashboard() {
  const { user, currentBranch, isAdmin, isGestao } = useClinicAuth();
  const { sales, stats: salesStats } = useClinicSales();
  const { thisWeekSurgeries, noDateSurgeries, pendingChecklist, stats: surgeryStats, surgeries, updateSurgery } = useClinicSurgeries();
  const { stats: noDateStats, allPatients: noDatePatients } = useNoDatePatients();
  const { branches: allowedBranches } = useBranches();
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedDelay, setSelectedDelay] = useState<string>('all');
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);

  const canFilterBranch = isAdmin || isGestao;

  // Use branches from neoteam_branches table (configured units)
  const branchOptions = useMemo(() => {
    if (!canFilterBranch && allowedBranches.length > 0) {
      return allowedBranches.filter(Boolean).sort();
    }
    return allowedBranches.filter(Boolean);
  }, [canFilterBranch, allowedBranches]);

  // Apply branch filter to all data
  const filterByBranch = <T extends { branch: string }>(items: T[]) => {
    if (selectedBranch === 'all') return items;
    return items.filter(i => i.branch === selectedBranch);
  };

  const filteredWeekSurgeries = useMemo(() => filterByBranch(thisWeekSurgeries), [thisWeekSurgeries, selectedBranch]);
  const filteredPendingChecklist = useMemo(() => filterByBranch(pendingChecklist), [pendingChecklist, selectedBranch]);
  const filteredNoDatePatients = useMemo(() => {
    let result = filterByBranch(noDatePatients);
    // Apply date/delay filter
    if (selectedDelay === 'custom' && customDate) {
      result = result.filter(p => new Date(p.saleDate) <= customDate);
    } else if (selectedDelay !== 'all') {
      const days = parseInt(selectedDelay);
      if (!isNaN(days)) {
        const cutoff = subDays(new Date(), days);
        result = result.filter(p => new Date(p.saleDate) <= cutoff);
      }
    }
    return result;
  }, [noDatePatients, selectedBranch, selectedDelay, customDate]);

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
        <div className="flex flex-wrap items-center gap-2">
          {/* Branch filter - always visible */}
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas unidades</SelectItem>
              {branchOptions.map(b => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date/delay filter */}
          <Select value={selectedDelay} onValueChange={(v) => { setSelectedDelay(v); if (v !== 'custom') setCustomDate(undefined); }}>
            <SelectTrigger className="w-[160px]">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="0">Hoje</SelectItem>
              <SelectItem value="2">D-2</SelectItem>
              <SelectItem value="7">D-7</SelectItem>
              <SelectItem value="10">D-10</SelectItem>
              <SelectItem value="20">D-20</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom date picker */}
          {selectedDelay === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[180px] justify-start text-left font-normal',
                    !customDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDate ? format(customDate, 'dd/MM/yyyy') : 'Selecionar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker
                  mode="single"
                  selected={customDate}
                  onSelect={setCustomDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          )}
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
                    Exames ou contratos pendentes
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

            <div className="grid gap-6 lg:grid-cols-5">
              {/* This Week Surgeries - Table */}
              <div className="lg:col-span-3">
                <SurgeryWeekTable
                  surgeries={filteredWeekSurgeries}
                  onUpdate={(id, updates) => updateSurgery.mutate({ id, ...updates })}
                />
              </div>

              {/* Pending Checklist */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
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
          </div>
        </TabsContent>

        <TabsContent value="vendidos-sem-data">
          <NoDateQueue />
        </TabsContent>
      </Tabs>
    </div>
  );
}
