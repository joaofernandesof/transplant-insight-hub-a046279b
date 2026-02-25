import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ShieldCheck, Lock, Unlock, CalendarDays } from 'lucide-react';
import { useScheduleWeekLocks, BRANCHES, DOCTORS, type ScheduleWeekLock } from '@/hooks/useScheduleWeekLocks';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

export default function ScheduleWeekLocksAdmin() {
  const { locks, weeks, isLoading, updateLock } = useScheduleWeekLocks();
  const [selectedBranch, setSelectedBranch] = useState<string>('Fortaleza');
  const [searchWeek, setSearchWeek] = useState('');

  const filteredWeeks = useMemo(() => {
    if (!searchWeek) return weeks;
    const num = parseInt(searchWeek);
    if (!isNaN(num)) return weeks.filter(w => w.week_number === num);
    return weeks.filter(w => w.month.toLowerCase().includes(searchWeek.toLowerCase()));
  }, [weeks, searchWeek]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getLockForWeekDoctor = (weekNum: number, doctor: string): ScheduleWeekLock | undefined => {
    return locks.find(l => l.week_number === weekNum && l.branch === selectedBranch && l.doctor === doctor);
  };

  // Stats
  const branchLocks = locks.filter(l => l.branch === selectedBranch);
  const totalAllowed = branchLocks.filter(l => l.permitido).length;
  const totalBlocked = branchLocks.filter(l => !l.permitido).length;

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd/MM', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  // Find current week
  const today = new Date();
  const currentWeek = weeks.find(w => {
    const start = parseISO(w.week_start);
    const end = parseISO(w.week_end);
    return today >= start && today <= end;
  });

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="px-4 pt-16 lg:pt-6 pb-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Travas da Agenda
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Controle absoluto de disponibilidade por semana, filial e médico.
            </p>
          </div>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BRANCHES.map(b => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{totalAllowed}</p>
              <p className="text-xs text-muted-foreground">Permitidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{totalBlocked}</p>
              <p className="text-xs text-muted-foreground">Bloqueados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{weeks.length}</p>
              <p className="text-xs text-muted-foreground">Semanas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{currentWeek?.week_number || '—'}</p>
              <p className="text-xs text-muted-foreground">Semana Atual</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-2 items-center">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nº da semana ou mês..."
            value={searchWeek}
            onChange={e => setSearchWeek(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {/* Matrix Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Matriz de Disponibilidade — {selectedBranch}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <div className="min-w-[600px]">
                {/* Table Header */}
                <div className="grid grid-cols-[120px_100px_1fr_1fr_1fr] gap-0 border-b bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground sticky top-0">
                  <div>Semana</div>
                  <div>Período</div>
                  {DOCTORS.map(d => (
                    <div key={d} className="text-center">{d}</div>
                  ))}
                </div>

                {/* Table Rows */}
                <div className="divide-y">
                  {filteredWeeks.map(week => {
                    const isCurrent = currentWeek?.week_number === week.week_number;
                    return (
                      <div
                        key={week.week_number}
                        className={`grid grid-cols-[120px_100px_1fr_1fr_1fr] gap-0 px-4 py-2.5 items-center transition-colors ${
                          isCurrent ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={isCurrent ? 'default' : 'outline'}
                            className="text-xs font-mono"
                          >
                            S{week.week_number}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                            {week.month}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(week.week_start)} — {formatDate(week.week_end)}
                        </div>
                        {DOCTORS.map(doctor => {
                          const lock = getLockForWeekDoctor(week.week_number, doctor);
                          if (!lock) return <div key={doctor} className="text-center text-xs text-muted-foreground">—</div>;
                          return (
                            <div key={doctor} className="flex items-center justify-center gap-2">
                              {lock.permitido ? (
                                <Unlock className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <Lock className="h-3.5 w-3.5 text-destructive" />
                              )}
                              <span className={`text-xs font-semibold ${lock.permitido ? 'text-green-600' : 'text-destructive'}`}>
                                {lock.permitido ? 'SIM' : 'NÃO'}
                              </span>
                              <Switch
                                checked={lock.permitido}
                                onCheckedChange={(checked) => updateLock.mutate({ id: lock.id, permitido: checked })}
                                disabled={updateLock.isPending}
                                className="scale-75"
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
