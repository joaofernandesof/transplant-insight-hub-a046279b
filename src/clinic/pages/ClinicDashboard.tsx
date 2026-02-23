import React, { useState, useMemo } from 'react';
import { useClinicAuth } from '../contexts/ClinicAuthContext';
import { useClinicSales } from '../hooks/useClinicSales';
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
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Filter,
  Search,
  Stethoscope,
  MapPin,
  FileCheck,
  DollarSign,
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SurgeryWeekTable } from '../components/SurgeryWeekTable';
import { SurgeryDetailDialog } from '../components/SurgeryDetailDialog';
import type { DateRange } from 'react-day-picker';

export default function ClinicDashboard() {
  const { user, currentBranch, isAdmin, isGestao } = useClinicAuth();
  const { sales } = useClinicSales();
  const { pendingChecklist, surgeries, scheduledSurgeries, updateSurgery } = useClinicSurgeries();
  const { allPatients: noDatePatients } = useNoDatePatients();
  const { branches: allowedBranches } = useBranches();

  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this-week');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedPendingSurgery, setSelectedPendingSurgery] = useState<ClinicSurgery | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    // Search filter
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
    return items;
  }, [scheduledSurgeries, selectedBranch, periodRange, searchTerm]);

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

  // Compute KPI stats
  const kpiStats = useMemo(() => {
    const allFiltered = filterByBranch(scheduledSurgeries);
    const confirmed = allFiltered.filter(s => s.surgeryConfirmed).length;
    const pendingExams = allFiltered.filter(s => !s.examsSent).length;
    const contractsSigned = allFiltered.filter(s => s.contractSigned).length;
    const confirmationRate = allFiltered.length > 0 ? Math.round((confirmed / allFiltered.length) * 100) : 0;
    const contractRate = allFiltered.length > 0 ? Math.round((contractsSigned / allFiltered.length) * 100) : 0;
    const totalVgv = allFiltered.reduce((sum, s) => sum + (s.vgv || 0), 0);

    return {
      total: allFiltered.length,
      thisMonth: currentMonthSales.length,
      confirmed,
      confirmationRate,
      pendingExams,
      contractsSigned,
      contractRate,
      totalVgv,
    };
  }, [scheduledSurgeries, selectedBranch, currentMonthSales]);

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
      {/* Sticky Header */}
      <div className="shrink-0 bg-background px-4 pt-3 md:px-6 pb-4 border-b border-border space-y-4">
        {/* Title + Period Select */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-primary" />
              Agenda Cirúrgica
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Tudo pronto para a cirurgia. Gerencie com confiança.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={(v) => { setSelectedPeriod(v); if (v !== 'custom') setDateRange(undefined); }}>
              <SelectTrigger className="w-[160px]">
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
                      'w-[220px] justify-start text-left font-normal',
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

        {/* KPI Cards - Row 1: Main metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Agendadas</p>
                  <p className="text-2xl font-bold mt-0.5">{kpiStats.total}</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{kpiStats.thisMonth} este mês</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Confirmadas</p>
                  <p className="text-2xl font-bold mt-0.5 text-emerald-600">{kpiStats.confirmed}</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <div className="mt-1">
                <Progress value={kpiStats.confirmationRate} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-0.5">{kpiStats.confirmationRate}% taxa de confirmação</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Exames Pendentes</p>
                  <p className="text-2xl font-bold mt-0.5 text-amber-600">{kpiStats.pendingExams}</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <p className="text-xs text-amber-600 mt-1 font-medium">
                {kpiStats.pendingExams > 0 ? '⚠️ Ação necessária' : '✓ Tudo em dia'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Termos Assinados</p>
                  <p className="text-2xl font-bold mt-0.5 text-blue-600">{kpiStats.contractsSigned}</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <FileCheck className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="mt-1">
                <Progress value={kpiStats.contractRate} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-0.5">{kpiStats.contractRate}% assinados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPI Cards - Row 2: Financial */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-0.5">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs text-muted-foreground font-medium">VGV Total</span>
              </div>
              <p className="text-base font-bold text-emerald-600">{formatCurrency(kpiStats.totalVgv)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-0.5">
                <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
                <span className="text-xs text-muted-foreground font-medium">Upgrades</span>
              </div>
              <p className="text-base font-bold text-purple-600">{formatCurrency(0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-0.5">
                <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs text-muted-foreground font-medium">Upsells</span>
              </div>
              <p className="text-base font-bold text-blue-600">{formatCurrency(0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-0.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs text-muted-foreground font-medium">Recebido</span>
              </div>
              <p className="text-base font-bold text-emerald-600">{formatCurrency(0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-0.5">
                <Clock className="h-3.5 w-3.5 text-destructive" />
                <span className="text-xs text-muted-foreground font-medium">Saldo Devedor</span>
              </div>
              <p className="text-base font-bold text-destructive">{formatCurrency(0)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search + Quick Date Filters */}
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por paciente, telefone ou acompanhante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
                {[
                  { value: 'today', label: 'Hoje' },
                  { value: 'this-week', label: 'Semana' },
                  { value: 'this-month', label: 'Mês' },
                  { value: 'next-month', label: 'Próximo' },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={selectedPeriod === option.value ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => { setSelectedPeriod(option.value); setDateRange(undefined); }}
                    className={cn(
                      'text-xs h-8',
                      selectedPeriod === option.value && 'bg-background shadow-sm'
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branch Filter Buttons */}
        <div className="flex justify-center gap-2 flex-wrap">
          <Button
            variant={selectedBranch === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedBranch('all')}
            className="gap-1.5"
          >
            <MapPin className="h-3.5 w-3.5" />
            Todas
          </Button>
          {branchOptions.map((b) => (
            <Button
              key={b}
              variant={selectedBranch === b ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedBranch(b)}
              className="gap-1.5"
            >
              <MapPin className="h-3.5 w-3.5" />
              {b}
            </Button>
          ))}
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
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-4 pb-6">
        <SurgeryWeekTable
          surgeries={filteredSurgeries}
          onUpdate={(id, updates) => updateSurgery.mutate({ id, ...updates })}
          title={`Cirurgias — ${periodLabel}`}
        />

        <SurgeryDetailDialog
          surgery={selectedPendingSurgery}
          open={!!selectedPendingSurgery}
          onOpenChange={(open) => !open && setSelectedPendingSurgery(null)}
          onUpdate={(id, updates) => updateSurgery.mutate({ id, ...updates })}
        />
      </div>
    </div>
  );
}
