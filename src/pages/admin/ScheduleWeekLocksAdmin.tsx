import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Lock, Unlock, CalendarDays, LockOpen, LockKeyhole } from 'lucide-react';
import { useScheduleWeekLocks, BRANCHES, AGENDAS, getColumnsForAgenda, type ScheduleWeekLock } from '@/hooks/useScheduleWeekLocks';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ScheduleWeekLocksAdmin() {
  const [selectedAgenda, setSelectedAgenda] = useState<string>('Agenda Cirúrgica');
  const { locks, weeks, isLoading, updateLock, bulkUpdateLocks } = useScheduleWeekLocks(selectedAgenda);
  const [selectedBranch, setSelectedBranch] = useState<string>('Fortaleza');
  const [searchWeek, setSearchWeek] = useState('');
  const columns = getColumnsForAgenda(selectedAgenda);

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
              Controle de disponibilidade por semana, filial, médico e agenda.
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

        {/* Agenda Tabs */}
        <Tabs value={selectedAgenda} onValueChange={setSelectedAgenda}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            {AGENDAS.map(a => (
              <TabsTrigger key={a} value={a}>{a}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

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

        {/* Bulk Actions per Doctor */}
        <div className="flex flex-wrap gap-4 items-start">
          {columns.map(doctor => {
            const doctorLocks = locks.filter(l => l.branch === selectedBranch && l.doctor === doctor);
            const allAllowed = doctorLocks.length > 0 && doctorLocks.every(l => l.permitido);
            const allBlocked = doctorLocks.length > 0 && doctorLocks.every(l => !l.permitido);
            return (
              <Card key={doctor} className="flex-1 min-w-[160px]">
                <CardContent className="p-3 space-y-2">
                  <p className="text-sm font-semibold text-center">{doctor}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1 text-xs border-green-500/50 text-green-600 hover:bg-green-50 hover:text-green-700"
                      disabled={bulkUpdateLocks.isPending || allAllowed}
                      onClick={() => {
                        const ids = doctorLocks.filter(l => !l.permitido).map(l => l.id);
                        if (ids.length) bulkUpdateLocks.mutate({ ids, permitido: true });
                      }}
                    >
                      <LockOpen className="h-3.5 w-3.5" />
                      Liberar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1 text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
                      disabled={bulkUpdateLocks.isPending || allBlocked}
                      onClick={() => {
                        const ids = doctorLocks.filter(l => l.permitido).map(l => l.id);
                        if (ids.length) bulkUpdateLocks.mutate({ ids, permitido: false });
                      }}
                    >
                      <LockKeyhole className="h-3.5 w-3.5" />
                      Travar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Matrix Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Matriz de Disponibilidade — {selectedBranch} — {selectedAgenda}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <div className="min-w-[750px]">
                {/* Table Header */}
                <div className={`grid gap-0 border-b bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground sticky top-0`} style={{ gridTemplateColumns: `120px 100px ${columns.map(() => '1fr').join(' ')}` }}>
                  <div>Semana</div>
                  <div>Período</div>
                  {columns.map(d => (
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
                        className={`grid gap-0 px-4 py-2.5 items-center transition-colors ${
                          isCurrent ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/30'
                        }`}
                        style={{ gridTemplateColumns: `120px 100px ${columns.map(() => '1fr').join(' ')}` }}
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
                        {columns.map(doctor => {
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
