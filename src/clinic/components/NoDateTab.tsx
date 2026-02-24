import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertTriangle,
  CalendarIcon,
  Clock,
  Search,
  User,
  Stethoscope,
  MapPin,
  ShoppingBag,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNoDatePatients, NoDatePatient } from '../hooks/useNoDatePatients';
import { useClinicSurgeries } from '../hooks/useClinicSurgeries';
import { useBranches } from '../hooks/useBranches';
import { useClinicAuth } from '../contexts/ClinicAuthContext';

interface DayGroup {
  label: string;
  state: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
  min: number;
  max: number;
}

const DAY_GROUPS: DayGroup[] = [
  {
    label: '🟢 Até 30 dias',
    state: 'Monitoramento',
    colorClass: 'text-emerald-700 dark:text-emerald-400',
    bgClass: 'bg-emerald-50/50 dark:bg-emerald-950/10',
    borderClass: 'border-emerald-200 dark:border-emerald-800/30',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    min: 0,
    max: 30,
  },
  {
    label: '🟡 31–60 dias',
    state: 'Atenção',
    colorClass: 'text-amber-700 dark:text-amber-400',
    bgClass: 'bg-amber-50/50 dark:bg-amber-950/10',
    borderClass: 'border-amber-200 dark:border-amber-800/30',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    min: 31,
    max: 60,
  },
  {
    label: '🟠 61–90 dias',
    state: 'Alerta',
    colorClass: 'text-orange-700 dark:text-orange-400',
    bgClass: 'bg-orange-50/50 dark:bg-orange-950/10',
    borderClass: 'border-orange-200 dark:border-orange-800/30',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    min: 61,
    max: 90,
  },
  {
    label: '🔴 90+ dias',
    state: 'Crítico',
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/5',
    borderClass: 'border-destructive/20',
    badgeClass: 'bg-destructive/10 text-destructive',
    min: 91,
    max: Infinity,
  },
];

export function NoDateTab() {
  const { isAdmin, isGestao } = useClinicAuth();
  const { allPatients, isLoading } = useNoDatePatients();
  const { createSurgery, updateSurgery } = useClinicSurgeries();
  const { branches: allowedBranches } = useBranches();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [settingDateFor, setSettingDateFor] = useState<NoDatePatient | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const canFilterBranch = isAdmin || isGestao;

  // Filter patients
  const filtered = useMemo(() => {
    let items = allPatients;

    if (selectedBranch !== 'all') {
      items = items.filter(p => p.branch === selectedBranch);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(p =>
        p.patientName.toLowerCase().includes(term) ||
        p.procedure?.toLowerCase().includes(term) ||
        p.seller?.toLowerCase().includes(term)
      );
    }

    return items;
  }, [allPatients, selectedBranch, searchTerm]);

  // KPIs (always from allPatients filtered by branch only, not search)
  const branchFiltered = useMemo(() => {
    if (selectedBranch === 'all') return allPatients;
    return allPatients.filter(p => p.branch === selectedBranch);
  }, [allPatients, selectedBranch]);

  const kpis = useMemo(() => {
    const total = branchFiltered.length;
    const upto30 = branchFiltered.filter(p => p.daysSinceSale <= 30).length;
    const d31to60 = branchFiltered.filter(p => p.daysSinceSale >= 31 && p.daysSinceSale <= 60).length;
    const d61to90 = branchFiltered.filter(p => p.daysSinceSale >= 61 && p.daysSinceSale <= 90).length;
    const d90plus = branchFiltered.filter(p => p.daysSinceSale > 90).length;
    const avgDays = total > 0 ? Math.round(branchFiltered.reduce((s, p) => s + p.daysSinceSale, 0) / total) : 0;

    return { total, upto30, d31to60, d61to90, d90plus, avgDays };
  }, [branchFiltered]);

  // Group patients
  const grouped = useMemo(() => {
    return DAY_GROUPS.map(group => ({
      ...group,
      patients: filtered
        .filter(p => p.daysSinceSale >= group.min && p.daysSinceSale <= group.max)
        .sort((a, b) => b.daysSinceSale - a.daysSinceSale),
    }));
  }, [filtered]);

  const handleConfirmDate = () => {
    if (settingDateFor && selectedDate) {
      // We need to find the surgery ID or create one
      // The NoDatePatient has saleId and patientId - we use updateSurgery via the hook
      // But since NoDatePatients come from sales without surgeries, we need to create a surgery
      createSurgery.mutate({
        patientId: settingDateFor.patientId,
        saleId: settingDateFor.saleId,
        branch: settingDateFor.branch,
        procedure: settingDateFor.procedure,
        category: settingDateFor.category || undefined,
        surgeryDate: format(selectedDate, 'yyyy-MM-dd'),
        scheduleStatus: 'agendado',
      });
      setSettingDateFor(null);
      setSelectedDate(undefined);
    }
  };

  const branchOptions = useMemo(() => {
    return [...new Set(allPatients.map(p => p.branch))].filter(Boolean).sort();
  }, [allPatients]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground font-medium">Total sem data</p>
            <p className="text-2xl font-bold">{kpis.total}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground font-medium">Até 30 dias</p>
            <p className="text-2xl font-bold text-emerald-600">{kpis.upto30}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground font-medium">31–60 dias</p>
            <p className="text-2xl font-bold text-amber-600">{kpis.d31to60}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground font-medium">61–90 dias</p>
            <p className="text-2xl font-bold text-orange-600">{kpis.d61to90}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground font-medium">90+ dias</p>
            <p className="text-2xl font-bold text-destructive">{kpis.d90plus}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground font-medium">Tempo médio</p>
            <p className="text-2xl font-bold">{kpis.avgDays}<span className="text-sm font-normal text-muted-foreground ml-1">dias</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente, procedimento, médico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      {/* Branch filter */}
      {branchOptions.length > 1 && (
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
      )}

      {/* Grouped Sections */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">
              Sem pacientes aguardando definição de data.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => {
            if (group.patients.length === 0) return null;
            return (
              <div key={group.label} className="space-y-2">
                {/* Group Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className={cn('text-sm font-semibold', group.colorClass)}>
                      {group.label}
                    </h3>
                    <Badge className={cn('text-[10px]', group.badgeClass)}>
                      {group.state}
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {group.patients.length}
                  </Badge>
                </div>

                {/* Patient Cards */}
                <div className="space-y-2">
                  {group.patients.map((patient) => (
                    <PatientCard
                      key={patient.saleId}
                      patient={patient}
                      group={group}
                      onDefineDate={() => {
                        setSettingDateFor(patient);
                        setSelectedDate(undefined);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Define Date Dialog */}
      <Dialog open={!!settingDateFor} onOpenChange={(open) => !open && setSettingDateFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Definir data da cirurgia</DialogTitle>
          </DialogHeader>
          {settingDateFor && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm">
                  <span className="text-muted-foreground">Paciente:</span>{' '}
                  <span className="font-medium">{settingDateFor.patientName}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Procedimento:</span>{' '}
                  <span className="font-medium">{settingDateFor.procedure}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Dias desde compra:</span>{' '}
                  <Badge variant="secondary" className="text-xs">{settingDateFor.daysSinceSale} dias</Badge>
                </div>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                disabled={(date) => date < new Date()}
                className={cn('p-3 pointer-events-auto mx-auto')}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingDateFor(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmDate} disabled={!selectedDate}>
              Confirmar data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PatientCard({
  patient,
  group,
  onDefineDate,
}: {
  patient: NoDatePatient;
  group: DayGroup;
  onDefineDate: () => void;
}) {
  const isCritical = patient.daysSinceSale > 90;
  const isRisk = patient.daysSinceSale > 60;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors',
        group.borderClass,
        group.bgClass
      )}
    >
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{patient.patientName}</span>
          {isCritical && (
            <Badge variant="destructive" className="text-[10px] font-bold">
              CRÍTICO
            </Badge>
          )}
          {!isCritical && isRisk && (
            <Badge className="text-[10px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
              Risco elevado
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {patient.procedure && (
            <span className="flex items-center gap-1">
              <Stethoscope className="h-3 w-3" />
              {patient.procedure}
            </span>
          )}
          {patient.seller && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {patient.seller}
            </span>
          )}
          {patient.saleDate && (
            <span className="flex items-center gap-1">
              <ShoppingBag className="h-3 w-3" />
              Compra: {format(new Date(patient.saleDate), 'dd/MM/yyyy')}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {patient.branch}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Badge
          variant="outline"
          className={cn(
            'text-xs font-bold whitespace-nowrap px-3 py-1',
            group.badgeClass
          )}
        >
          <Clock className="h-3 w-3 mr-1" />
          {patient.daysSinceSale} dias desde a compra
        </Badge>
        <Button
          size="sm"
          className="gap-1.5 text-xs shrink-0"
          onClick={onDefineDate}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          Definir data
        </Button>
      </div>
    </div>
  );
}