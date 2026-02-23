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
import { format, isToday, isTomorrow, parseISO, subDays, startOfMonth, endOfMonth, addMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NoDateQueue from './NoDateQueue';
import { SurgeryWeekTable } from '../components/SurgeryWeekTable';
import { SurgeryDetailDialog } from '../components/SurgeryDetailDialog';
import type { DateRange } from 'react-day-picker';

export default function ClinicDashboard() {
  const { user, currentBranch, isAdmin, isGestao } = useClinicAuth();
  const { sales, stats: salesStats } = useClinicSales();
  const { thisWeekSurgeries, noDateSurgeries, pendingChecklist, stats: surgeryStats, surgeries, scheduledSurgeries, updateSurgery } = useClinicSurgeries();
  const { stats: noDateStats, allPatients: noDatePatients } = useNoDatePatients();
  const { branches: allowedBranches } = useBranches();
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this-week');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedPendingSurgery, setSelectedPendingSurgery] = useState<ClinicSurgery | null>(null);

  const canFilterBranch = isAdmin || isGestao;

  const branchOptions = useMemo(() => {
    if (!canFilterBranch && allowedBranches.length > 0) {
      return allowedBranches.filter(Boolean).sort();
    }
    return allowedBranches.filter(Boolean);
  }, [canFilterBranch, allowedBranches]);

  const filterByBranch = <T extends { branch: string }>(items: T[]) => {
    if (selectedBranch === 'all') return items;
    return items.filter(i => i.branch === selectedBranch);
  };

  const periodRange = useMemo(() => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'today':
        return { start: now, end: now };
      case 'this-week': {
        const ws = startOfWeek(now, { weekStartsOn: 1 });
        const we = endOfWeek(now, { weekStartsOn: 1 });
        return { start: ws, end: we };
      }
      case 'this-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-month': {
        const lm = addMonths(now, -1);
        return { start: startOfMonth(lm), end: endOfMonth(lm) };
      }
      case 'next-month': {
        const nm = addMonths(now, 1);
        return { start: startOfMonth(nm), end: endOfMonth(nm) };
      }
      case 'custom':
        if (dateRange?.from) {
          return { start: dateRange.from, end: dateRange.to || dateRange.from };
        }
        return null;
      default:
        return null;
    }
  }, [selectedPeriod, dateRange]);

  const filteredSurgeries = useMemo(() => {
    let items = filterByBranch(scheduledSurgeries);
    if (periodRange) {
      const startStr = format(periodRange.start, 'yyyy-MM-dd');
      const endStr = format(periodRange.end, 'yyyy-MM-dd');
      items = items.filter(s => {
        if (!s.surgeryDate) return false;
        return s.surgeryDate >= startStr && s.surgeryDate <= endStr;
      });
    }
    return items;
  }, [scheduledSurgeries, selectedBranch, periodRange]);

  const filteredPendingChecklist = useMemo(() => filterByBranch(pendingChecklist), [pendingChecklist, selectedBranch]);

  const filteredNoDateStats = useMemo(() => {
    const filtered = filterByBranch(noDatePatients);
    return {
      total: filtered.length,
      over30: filtered.filter(p => p.daysSinceSale >= 30).length,
      over60: filtered.filter(p => p.daysSinceSale >= 60).length,
    };
  }, [noDatePatients, selectedBranch]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const currentMonthSales = useMemo(() => {
    const now = new Date();
    return sales.filter(s => {
      const saleDate = new Date(s.saleDate);
      const matchMonth = saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
      if (selectedBranch !== 'all' && s.branch !== selectedBranch) return false;
      return matchMonth;
    });
  }, [sales, selectedBranch]);

  const periodLabel = useMemo(() => {
    switch (selectedPeriod) {
      case 'today': return 'Hoje';
      case 'this-week': return 'Esta Semana';
      case 'this-month': return 'Este Mês';
      case 'last-month': return 'Mês Anterior';
      case 'next-month': return 'Próximo Mês';
      case 'custom': return 'Personalizado';
      default: return 'Período';
    }
  }, [selectedPeriod]);

  return (
    <div className="h-[calc(100vh-56px)] lg:h-screen flex flex-col overflow-hidden">
      {/* Sticky Header: Filters + Tabs + KPIs */}
      <div className="shrink-0 bg-background px-4 pt-2 md:px-6 pb-4 border-b border-border space-y-4">
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

            <Select value={selectedPeriod} onValueChange={(v) => { setSelectedPeriod(v); if (v !== 'custom') setDateRange(undefined); }}>
              <SelectTrigger className="w-[180px]">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="this-week">Esta Semana</SelectItem>
                <SelectItem value="this-month">Este Mês</SelectItem>
                <SelectItem value="last-month">Mês Anterior</SelectItem>
                <SelectItem value="next-month">Próximo Mês</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {selectedPeriod === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-[240px] justify-start text-left font-normal',
                      !dateRange?.from && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, 'dd/MM/yy')} — ${format(dateRange.to, 'dd/MM/yy')}`
                      ) : (
                        format(dateRange.from, 'dd/MM/yyyy')
                      )
                    ) : (
                      'Selecionar intervalo'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cirurgias ({periodLabel})</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredSurgeries.length}</div>
              <p className="text-xs text-muted-foreground">
                {filteredSurgeries.filter(s => s.surgeryConfirmed).length} confirmadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendências Pré-Op</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
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
                  <span className="text-amber-600">{filteredNoDateStats.over30} +30d</span>
                )}
                {filteredNoDateStats.over60 > 0 && (
                  <span className="text-destructive">{filteredNoDateStats.over60} +60d</span>
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
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentMonthSales.length}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(currentMonthSales.reduce((sum, s) => sum + s.vgv, 0))} VGV
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pendency alert banner */}
        {filteredNoDateStats.total > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-amber-800 dark:text-amber-300 font-medium">
              {filteredNoDateStats.total} paciente{filteredNoDateStats.total > 1 ? 's' : ''} vendido{filteredNoDateStats.total > 1 ? 's' : ''} sem data de cirurgia
              {filteredNoDateStats.over60 > 0 && <span className="text-destructive ml-1">({filteredNoDateStats.over60} há +60 dias)</span>}
              {filteredNoDateStats.over60 === 0 && filteredNoDateStats.over30 > 0 && <span className="text-amber-600 ml-1">({filteredNoDateStats.over30} há +30 dias)</span>}
            </span>
          </div>
        )}
      </div>

      {/* Content (scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-6 pb-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SurgeryWeekTable
              surgeries={filteredSurgeries}
              onUpdate={(id, updates) => updateSurgery.mutate({ id, ...updates })}
              title={`Cirurgias — ${periodLabel}`}
            />
          </div>

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
                          className="p-3 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedPendingSurgery(surgery)}
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

            <SurgeryDetailDialog
              surgery={selectedPendingSurgery}
              open={!!selectedPendingSurgery}
              onOpenChange={(open) => !open && setSelectedPendingSurgery(null)}
              onUpdate={(id, updates) => updateSurgery.mutate({ id, ...updates })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
