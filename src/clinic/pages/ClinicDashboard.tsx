import React, { useState, useMemo, useCallback } from 'react';
import { useClinicAuth } from '../contexts/ClinicAuthContext';
import { useClinicSurgeries, ClinicSurgery } from '../hooks/useClinicSurgeries';
import { useNoDatePatients } from '../hooks/useNoDatePatients';
import { useBranches } from '../hooks/useBranches';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Calendar,
  CalendarIcon,
  Clock,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Search,
  Stethoscope,
  MapPin,
  FileCheck,
  DollarSign,
  TrendingUp,
  X,
  Plus,
} from 'lucide-react';
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, addMonths, startOfWeek, endOfWeek, subDays, isToday as dateIsToday, isTomorrow as dateIsTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SurgeryWeekTable } from '../components/SurgeryWeekTable';
import { SurgeryDetailDialog } from '../components/SurgeryDetailDialog';
import { NoDateRiskQueue } from '../components/NoDateRiskQueue';
import { NoDateTab } from '../components/NoDateTab';
import { AddSurgeryDialog } from '../components/AddSurgeryDialog';
import type { DateRange } from 'react-day-picker';

// D-XX filter definitions
const D_FILTERS = [
  { value: 'd-20', label: 'D-20', days: 20 },
  { value: 'd-15', label: 'D-15', days: 15 },
  { value: 'd-10', label: 'D-10', days: 10 },
  { value: 'd-2', label: 'D-2', days: 2 },
  { value: 'd-0', label: 'Hoje', days: 0 },
  { value: 'd+1', label: 'Amanhã', days: -1 },
] as const;

type DFilter = typeof D_FILTERS[number]['value'];

export default function ClinicDashboard() {
  const { user, currentBranch, isAdmin, isGestao } = useClinicAuth();
  const { scheduledSurgeries, noDateSurgeries, updateSurgery } = useClinicSurgeries();
  const { allPatients: noDatePatients } = useNoDatePatients();
  const { branches: allowedBranches } = useBranches();

  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this-week');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedPendingSurgery, setSelectedPendingSurgery] = useState<ClinicSurgery | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDFilters, setActiveDFilters] = useState<Set<DFilter>>(new Set());
  const [activeTab, setActiveTab] = useState<'agenda' | 'sem-data'>('agenda');
  const [showAddDialog, setShowAddDialog] = useState(false);

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

  // Toggle D filter (multi-select)
  const toggleDFilter = useCallback((filter: DFilter) => {
    setActiveDFilters(prev => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  }, []);

  const clearDFilters = useCallback(() => setActiveDFilters(new Set()), []);

  const periodRange = useMemo(() => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'all':
        return null;
      case 'yesterday': {
        const y = subDays(now, 1);
        return { start: y, end: y };
      }
      case 'today':
        return { start: now, end: now };
      case 'this-week': {
        const ws = startOfWeek(now, { weekStartsOn: 1 });
        const we = endOfWeek(now, { weekStartsOn: 1 });
        return { start: ws, end: we };
      }
      case 'this-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
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

  // Period label with date range
  const periodLabel = useMemo(() => {
    if (periodRange) {
      const from = format(periodRange.start, 'dd MMM', { locale: ptBR });
      const to = format(periodRange.end, 'dd MMM', { locale: ptBR });
      const labels: Record<string, string> = {
        'all': 'Todo o Período',
        'yesterday': 'Ontem',
        'today': 'Hoje',
        'this-week': 'Esta Semana',
        'this-month': 'Este Mês',
        'next-month': 'Próximo Mês',
        'custom': 'Personalizado',
      };
      return `${labels[selectedPeriod] || 'Período'} — ${from} a ${to}`;
    }
    if (selectedPeriod === 'all') return 'Todo o Período';
    return 'Todas';
  }, [selectedPeriod, periodRange]);

  // Main filter pipeline
  const filteredSurgeries = useMemo(() => {
    let items = filterByBranch(scheduledSurgeries);
    const today = new Date();

    // Period filter
    if (periodRange) {
      const startStr = format(periodRange.start, 'yyyy-MM-dd');
      const endStr = format(periodRange.end, 'yyyy-MM-dd');
      items = items.filter(s => {
        if (!s.surgeryDate) return false;
        return s.surgeryDate >= startStr && s.surgeryDate <= endStr;
      });
    }

    // D-XX filter (multi-select: show surgeries that match ANY active D filter)
    if (activeDFilters.size > 0) {
      items = items.filter(s => {
        if (!s.surgeryDate) return false;
        const daysUntil = differenceInDays(parseISO(s.surgeryDate), today);
        return Array.from(activeDFilters).some(filter => {
          const def = D_FILTERS.find(d => d.value === filter);
          if (!def) return false;
          if (def.days === 0) return daysUntil === 0; // Hoje
          if (def.days === -1) return daysUntil === 1; // Amanhã
          // D-XX means surgery is XX days away
          return daysUntil === def.days;
        });
      });
    }

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(s =>
        s.patientName?.toLowerCase().includes(term) ||
        s.companionName?.toLowerCase().includes(term) ||
        s.companionPhone?.includes(term) ||
        s.medicalRecord?.toLowerCase().includes(term) ||
        s.procedure?.toLowerCase().includes(term)
      );
    }

    // Sort: Today first, then tomorrow, then ascending, then past
    items.sort((a, b) => {
      const aDate = a.surgeryDate ? parseISO(a.surgeryDate) : new Date(9999, 0);
      const bDate = b.surgeryDate ? parseISO(b.surgeryDate) : new Date(9999, 0);

      const aIsToday = dateIsToday(aDate) ? 0 : 1;
      const bIsToday = dateIsToday(bDate) ? 0 : 1;
      if (aIsToday !== bIsToday) return aIsToday - bIsToday;

      const aIsTomorrow = dateIsTomorrow(aDate) ? 0 : 1;
      const bIsTomorrow = dateIsTomorrow(bDate) ? 0 : 1;
      if (aIsTomorrow !== bIsTomorrow) return aIsTomorrow - bIsTomorrow;

      // Future dates ascending
      const aFuture = aDate >= today ? 0 : 1;
      const bFuture = bDate >= today ? 0 : 1;
      if (aFuture !== bFuture) return aFuture - bFuture;

      const dateCompare = aDate.getTime() - bDate.getTime();
      if (dateCompare !== 0) return dateCompare;

      return (a.surgeryTime || '').localeCompare(b.surgeryTime || '');
    });

    return items;
  }, [scheduledSurgeries, selectedBranch, periodRange, searchTerm, activeDFilters]);

  // KPIs computed from filteredSurgeries (driven by active filters)
  const kpiStats = useMemo(() => {
    const items = filteredSurgeries;
    const confirmed = items.filter(s => s.surgeryConfirmed).length;
    const pendingExams = items.filter(s => !s.examsSent).length;
    const contractsSigned = items.filter(s => s.contractSigned).length;
    const confirmationRate = items.length > 0 ? Math.round((confirmed / items.length) * 100) : 0;
    const contractRate = items.length > 0 ? Math.round((contractsSigned / items.length) * 100) : 0;
    const totalVgv = items.reduce((sum, s) => sum + (s.vgv || 0), 0);
    const guidesPending = items.filter(s => !s.guidesSent).length;
    const totalUpgrade = items.reduce((sum, s) => sum + s.upgradeValue, 0);
    const totalUpsell = items.reduce((sum, s) => sum + s.upsellValue, 0);
    const totalDeposit = items.reduce((sum, s) => sum + s.depositPaid, 0);
    const totalRemaining = items.reduce((sum, s) => sum + s.remainingPaid, 0);
    const totalBalanceDue = items.reduce((sum, s) => sum + s.balanceDue, 0);
    const totalReceived = totalDeposit + totalRemaining;
    const paymentProgress = totalVgv > 0 ? Math.round((totalReceived / totalVgv) * 100) : 0;

    return {
      total: items.length,
      confirmed,
      confirmationRate,
      pendingExams,
      contractsSigned,
      contractRate,
      totalVgv,
      guidesPending,
      totalUpgrade,
      totalUpsell,
      totalReceived,
      totalBalanceDue,
      paymentProgress,
    };
  }, [filteredSurgeries]);

  const filteredNoDate = useMemo(() => filterByBranch(noDateSurgeries), [noDateSurgeries, selectedBranch]);

  const noDateStats = useMemo(() => {
    const over30 = noDatePatients.filter(p => {
      if (selectedBranch !== 'all' && p.branch !== selectedBranch) return false;
      return p.daysSinceSale >= 30;
    }).length;
    const over60 = noDatePatients.filter(p => {
      if (selectedBranch !== 'all' && p.branch !== selectedBranch) return false;
      return p.daysSinceSale >= 60;
    }).length;
    const total = noDatePatients.filter(p => {
      if (selectedBranch !== 'all' && p.branch !== selectedBranch) return false;
      return true;
    }).length;
    return { total, over30, over60 };
  }, [noDatePatients, selectedBranch]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleSetDate = (id: string, date: string) => {
    updateSurgery.mutate({ id, surgeryDate: date, scheduleStatus: 'agendado' });
  };

  return (
    <div className="h-[calc(100vh-56px)] lg:h-screen flex flex-col overflow-hidden">
      {/* Sticky Header */}
      <div className="shrink-0 bg-background px-4 pt-3 md:px-6 pb-4 border-b border-border space-y-3">
        {/* Title + Period */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Agenda Cirúrgica
            </h1>
            {/* Tabs */}
            <div className="flex gap-1 mt-1.5">
              <button
                onClick={() => setActiveTab('agenda')}
                className={cn(
                  'text-xs font-medium px-3 py-1 rounded-md transition-colors',
                  activeTab === 'agenda'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                Agenda
              </button>
              <button
                onClick={() => setActiveTab('sem-data')}
                className={cn(
                  'text-xs font-medium px-3 py-1 rounded-md transition-colors flex items-center gap-1.5',
                  activeTab === 'sem-data'
                    ? 'bg-destructive text-destructive-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                🔴 Sem Data Definida
                {noDateStats.total > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{noDateStats.total}</Badge>
                )}
              </button>
            </div>
          </div>
           {activeTab === 'agenda' && (
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
              <Select value={selectedPeriod} onValueChange={(v) => { setSelectedPeriod(v); if (v !== 'custom') setDateRange(undefined); }}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo o Período</SelectItem>
                  <SelectItem value="yesterday">Ontem</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="this-week">Esta Semana</SelectItem>
                  <SelectItem value="this-month">Este Mês</SelectItem>
                  <SelectItem value="next-month">Próximo Mês</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              {selectedPeriod === 'custom' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn('h-8 text-xs', !dateRange?.from && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                      {dateRange?.from
                        ? dateRange.to
                          ? `${format(dateRange.from, 'dd/MM')} — ${format(dateRange.to, 'dd/MM')}`
                          : format(dateRange.from, 'dd/MM/yyyy')
                        : 'Intervalo'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarPicker
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={ptBR}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}
          {activeTab === 'sem-data' && (
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </Button>
          )}
        </div>

        {activeTab === 'agenda' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-2.5">
                  <p className="text-[11px] text-muted-foreground font-medium">Total Agendadas</p>
                  <p className="text-xl font-bold mt-0.5">{kpiStats.total}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-2.5">
                  <p className="text-[11px] text-muted-foreground font-medium">Confirmadas</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-bold mt-0.5 text-emerald-600">{kpiStats.confirmed}</p>
                    <span className="text-xs text-muted-foreground">{kpiStats.confirmationRate}%</span>
                  </div>
                  <Progress value={kpiStats.confirmationRate} className="h-1 mt-1" />
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-2.5">
                  <p className="text-[11px] text-muted-foreground font-medium">Exames Pendentes</p>
                  <p className="text-xl font-bold mt-0.5">{kpiStats.pendingExams}</p>
                  {kpiStats.pendingExams > 0 && (
                    <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="h-3 w-3" /> Ação necessária
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-2.5">
                  <p className="text-[11px] text-muted-foreground font-medium">Termos Assinados</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-bold mt-0.5 text-blue-600">{kpiStats.contractsSigned}</p>
                    <span className="text-xs text-muted-foreground">{kpiStats.contractRate}%</span>
                  </div>
                  <Progress value={kpiStats.contractRate} className="h-1 mt-1" />
                </CardContent>
              </Card>
            </div>

            {/* Financial KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Card className="border-l-4 border-l-emerald-600">
                <CardContent className="p-2.5">
                  <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> VGV Total
                  </p>
                  <p className="text-lg font-bold mt-0.5 text-emerald-600">{formatCurrency(kpiStats.totalVgv)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2.5">
                  <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Upgrades
                  </p>
                  <p className="text-lg font-bold mt-0.5">{formatCurrency(kpiStats.totalUpgrade)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2.5">
                  <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Upsells
                  </p>
                  <p className="text-lg font-bold mt-0.5">{formatCurrency(kpiStats.totalUpsell)}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-2.5">
                  <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Recebido
                  </p>
                  <p className="text-lg font-bold mt-0.5 text-emerald-600">{formatCurrency(kpiStats.totalReceived)}</p>
                  <Progress value={kpiStats.paymentProgress} className="h-1 mt-1" />
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-destructive">
                <CardContent className="p-2.5">
                  <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Saldo Devedor
                  </p>
                  <p className="text-lg font-bold mt-0.5 text-destructive">{formatCurrency(kpiStats.totalBalanceDue)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Search + Quick Filters */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar paciente, prontuário, acompanhante..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-8 text-sm"
                  />
                </div>
                {/* Quick period buttons */}
                <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
                  {[
                    { value: 'all', label: 'Todo Período' },
                    { value: 'yesterday', label: 'Ontem' },
                    { value: 'today', label: 'Hoje' },
                    { value: 'this-week', label: 'Semana' },
                    { value: 'this-month', label: 'Mês' },
                    { value: 'next-month', label: 'Próximo' },
                    { value: 'custom', label: 'Personalizado' },
                  ].map((opt) => (
                    <Button
                      key={opt.value}
                      variant={selectedPeriod === opt.value ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => { setSelectedPeriod(opt.value); if (opt.value !== 'custom') setDateRange(undefined); }}
                      className={cn('text-xs h-7 px-2.5', selectedPeriod === opt.value && 'bg-background shadow-sm')}
                    >
                      {opt.label}
                    </Button>
                  ))}
                  {selectedPeriod === 'custom' && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn('h-7 text-xs', !dateRange?.from && 'text-muted-foreground')}>
                          <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                          {dateRange?.from
                            ? dateRange.to
                              ? `${format(dateRange.from, 'dd/MM')} — ${format(dateRange.to, 'dd/MM')}`
                              : format(dateRange.from, 'dd/MM/yyyy')
                            : 'Intervalo'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <CalendarPicker
                          mode="range"
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                          locale={ptBR}
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>

              {/* D-XX Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground font-medium mr-1">Preparo:</span>
                {D_FILTERS.map((d) => (
                  <Button
                    key={d.value}
                    variant={activeDFilters.has(d.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleDFilter(d.value)}
                    className={cn(
                      'h-6 px-2 text-[11px] rounded-full',
                      activeDFilters.has(d.value) && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {d.label}
                  </Button>
                ))}
                {activeDFilters.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDFilters}
                    className="h-6 px-2 text-[11px] gap-1 text-muted-foreground"
                  >
                    <X className="h-3 w-3" />
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            {/* Branch Filter */}
            <div className="flex justify-center gap-1.5 flex-wrap">
              <Button
                variant={selectedBranch === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedBranch('all')}
                className="gap-1 h-7 text-xs"
              >
                <MapPin className="h-3 w-3" />
                Todas
              </Button>
              {branchOptions.map((b) => (
                <Button
                  key={b}
                  variant={selectedBranch === b ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedBranch(b)}
                  className="gap-1 h-7 text-xs"
                >
                  <MapPin className="h-3 w-3" />
                  {b}
                </Button>
              ))}
            </div>

            {/* No-date alert banner */}
            {noDateStats.total > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs cursor-pointer" onClick={() => setActiveTab('sem-data')}>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="text-amber-800 dark:text-amber-300 font-medium">
                  {noDateStats.total} vendido{noDateStats.total > 1 ? 's' : ''} sem data
                  {noDateStats.over60 > 0 && <span className="text-destructive ml-1">({noDateStats.over60} há +60 dias)</span>}
                  {noDateStats.over60 === 0 && noDateStats.over30 > 0 && <span className="text-amber-600 ml-1">({noDateStats.over30} há +30 dias)</span>}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-4 pb-6 space-y-4">
        {activeTab === 'agenda' ? (
          <>
            <NoDateRiskQueue
              surgeries={filteredNoDate}
              onSetDate={handleSetDate}
            />
            <SurgeryWeekTable
              surgeries={filteredSurgeries}
              onUpdate={(id, updates) => updateSurgery.mutate({ id, ...updates })}
              title={`Cirurgias — ${filteredSurgeries.length} agendadas`}
            />
            <SurgeryDetailDialog
              surgery={selectedPendingSurgery}
              open={!!selectedPendingSurgery}
              onOpenChange={(open) => !open && setSelectedPendingSurgery(null)}
              onUpdate={(id, updates) => updateSurgery.mutate({ id, ...updates })}
            />
          </>
        ) : (
          <NoDateTab />
        )}
      </div>

      <AddSurgeryDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        defaultWithDate={activeTab === 'agenda'}
      />
    </div>
  );
}
