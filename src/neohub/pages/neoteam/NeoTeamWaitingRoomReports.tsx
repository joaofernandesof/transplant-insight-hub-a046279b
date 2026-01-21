import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, Clock, Users, Calendar as CalendarIcon, 
  TrendingUp, TrendingDown, Download, RefreshCw,
  Building2, Timer, AlertTriangle
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, differenceInMinutes, parseISO, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useNeoTeamBranches } from '@/neohub/hooks/useNeoTeamBranches';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

type DateRange = {
  from: Date;
  to: Date;
};

interface WaitingRoomRecord {
  id: string;
  patient_name: string;
  arrival_time: string;
  called_at: string | null;
  service_started_at: string | null;
  service_ended_at: string | null;
  status: string;
  branch: string;
  type: string;
  priority: string;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function NeoTeamWaitingRoomReports() {
  const { branches } = useNeoTeamBranches();
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Fetch historical waiting room data
  const { data: records = [], isLoading, refetch } = useQuery({
    queryKey: ['waiting-room-reports', selectedBranch, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('neoteam_waiting_room')
        .select('*')
        .gte('arrival_time', startOfDay(dateRange.from).toISOString())
        .lte('arrival_time', endOfDay(dateRange.to).toISOString())
        .order('arrival_time', { ascending: false });

      if (selectedBranch !== 'all') {
        query = query.eq('branch', selectedBranch);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as WaitingRoomRecord[];
    },
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const completedRecords = records.filter(r => r.status === 'completed' && r.service_started_at);
    
    // Average wait time (arrival to called/started service)
    const waitTimes = completedRecords.map(r => {
      const arrival = parseISO(r.arrival_time);
      const serviceStart = parseISO(r.service_started_at!);
      return differenceInMinutes(serviceStart, arrival);
    }).filter(t => t >= 0 && t < 480); // Filter reasonable times (less than 8 hours)

    const avgWaitTime = waitTimes.length > 0
      ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : 0;

    const maxWaitTime = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;
    const minWaitTime = waitTimes.length > 0 ? Math.min(...waitTimes) : 0;

    // Count by status
    const totalPatients = records.length;
    const completedPatients = records.filter(r => r.status === 'completed').length;
    const waitingOver15 = waitTimes.filter(t => t > 15).length;

    // Group by branch
    const byBranch = branches.map(branch => {
      const branchRecords = records.filter(r => r.branch === branch.code);
      const branchWaitTimes = branchRecords
        .filter(r => r.status === 'completed' && r.service_started_at)
        .map(r => {
          const arrival = parseISO(r.arrival_time);
          const serviceStart = parseISO(r.service_started_at!);
          return differenceInMinutes(serviceStart, arrival);
        })
        .filter(t => t >= 0 && t < 480);

      return {
        name: branch.name,
        code: branch.code,
        totalPatients: branchRecords.length,
        avgWaitTime: branchWaitTimes.length > 0
          ? Math.round(branchWaitTimes.reduce((a, b) => a + b, 0) / branchWaitTimes.length)
          : 0,
      };
    });

    // Group by day
    const byDay: Record<string, { date: string; count: number; avgWait: number }> = {};
    records.forEach(r => {
      const day = format(parseISO(r.arrival_time), 'yyyy-MM-dd');
      if (!byDay[day]) {
        byDay[day] = { date: day, count: 0, avgWait: 0 };
      }
      byDay[day].count++;
    });

    // Calculate daily averages
    Object.keys(byDay).forEach(day => {
      const dayRecords = records.filter(r => 
        format(parseISO(r.arrival_time), 'yyyy-MM-dd') === day &&
        r.status === 'completed' && r.service_started_at
      );
      const dayWaitTimes = dayRecords.map(r => {
        const arrival = parseISO(r.arrival_time);
        const serviceStart = parseISO(r.service_started_at!);
        return differenceInMinutes(serviceStart, arrival);
      }).filter(t => t >= 0 && t < 480);
      
      byDay[day].avgWait = dayWaitTimes.length > 0
        ? Math.round(dayWaitTimes.reduce((a, b) => a + b, 0) / dayWaitTimes.length)
        : 0;
    });

    const dailyData = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));

    // Group by type
    const byType: Record<string, number> = {};
    records.forEach(r => {
      byType[r.type] = (byType[r.type] || 0) + 1;
    });

    const typeData = Object.entries(byType).map(([name, value]) => ({ name, value }));

    return {
      avgWaitTime,
      maxWaitTime,
      minWaitTime,
      totalPatients,
      completedPatients,
      waitingOver15,
      byBranch,
      dailyData,
      typeData,
    };
  }, [records, branches]);

  const exportToCSV = () => {
    const headers = ['Paciente', 'Filial', 'Tipo', 'Chegada', 'Início Atendimento', 'Tempo Espera (min)', 'Status'];
    const rows = records.map(r => {
      const waitTime = r.service_started_at
        ? differenceInMinutes(parseISO(r.service_started_at), parseISO(r.arrival_time))
        : '-';
      return [
        r.patient_name,
        r.branch,
        r.type,
        format(parseISO(r.arrival_time), 'dd/MM/yyyy HH:mm'),
        r.service_started_at ? format(parseISO(r.service_started_at), 'dd/MM/yyyy HH:mm') : '-',
        waitTime,
        r.status,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-sala-espera-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Relatórios de Tempo de Espera
          </h1>
          <p className="text-muted-foreground">
            Análise do tempo de espera por filial e período
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Filial</label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todas as filiais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as filiais</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.code} value={branch.code}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Período</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[130px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateRange.from, 'dd/MM/yy', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <span className="self-center text-muted-foreground">até</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[130px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateRange.to, 'dd/MM/yy', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Timer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgWaitTime} min</p>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPatients}</p>
                <p className="text-sm text-muted-foreground">Total Pacientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedPatients}</p>
                <p className="text-sm text-muted-foreground">Atendidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.waitingOver15}</p>
                <p className="text-sm text-muted-foreground">Espera &gt; 15min</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução Diária
            </CardTitle>
            <CardDescription>Tempo médio de espera por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(v) => format(parseISO(v), 'dd/MM')}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    labelFormatter={(v) => format(parseISO(v as string), 'dd/MM/yyyy')}
                    formatter={(value: number) => [`${value} min`, 'Tempo Médio']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgWait" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Type Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Distribuição por Tipo
            </CardTitle>
            <CardDescription>Atendimentos por tipo de procedimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.typeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branch Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Comparativo por Filial
          </CardTitle>
          <CardDescription>Tempo médio de espera e volume por filial</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byBranch} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgWaitTime" name="Tempo Médio (min)" fill="hsl(var(--primary))" radius={4} />
                <Bar dataKey="totalPatients" name="Total Pacientes" fill="hsl(var(--chart-2))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento</CardTitle>
          <CardDescription>Últimos registros da sala de espera</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Filial</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Chegada</TableHead>
                  <TableHead>Tempo Espera</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  records.slice(0, 50).map((record) => {
                    const waitTime = record.service_started_at
                      ? differenceInMinutes(parseISO(record.service_started_at), parseISO(record.arrival_time))
                      : null;
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.patient_name}</TableCell>
                        <TableCell>{record.branch}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.type}</Badge>
                        </TableCell>
                        <TableCell>{format(parseISO(record.arrival_time), 'dd/MM HH:mm')}</TableCell>
                        <TableCell>
                          {waitTime !== null ? (
                            <span className={waitTime > 15 ? 'text-amber-600 font-medium' : ''}>
                              {waitTime} min
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={record.status === 'completed' ? 'default' : 'secondary'}>
                            {record.status === 'completed' ? 'Concluído' : record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
