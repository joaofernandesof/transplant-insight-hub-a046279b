import React, { useState, useMemo } from 'react';
import { useClinicSurgeries, ClinicSurgery } from '../hooks/useClinicSurgeries';
import { useClinicAuth } from '../contexts/ClinicAuthContext';
import { useBranches } from '../hooks/useBranches';
import { ScheduleSurgeryDialog } from '../components/ScheduleSurgeryDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Search, Filter, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NoDateQueue() {
  const { noDateSurgeries, isLoading, updateSurgery, stats } = useClinicSurgeries();
  const { isAdmin, isGestao } = useClinicAuth();
  const { branches } = useBranches();

  // Filters
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSeller, setFilterSeller] = useState('all');
  const [filterDelay, setFilterDelay] = useState('all');

  // Schedule dialog
  const [selectedSurgery, setSelectedSurgery] = useState<ClinicSurgery | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Derive unique values for filters
  const sellers = useMemo(() => {
    const s = new Set(noDateSurgeries.map(x => x.seller).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [noDateSurgeries]);

  const categories = useMemo(() => {
    const c = new Set(noDateSurgeries.map(x => x.category).filter(Boolean) as string[]);
    return Array.from(c).sort();
  }, [noDateSurgeries]);

  // Apply filters
  const filtered = useMemo(() => {
    return noDateSurgeries.filter(s => {
      if (search && !s.patientName?.toLowerCase().includes(search.toLowerCase()) &&
          !s.procedure?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterBranch !== 'all' && s.branch !== filterBranch) return false;
      if (filterCategory !== 'all' && s.category !== filterCategory) return false;
      if (filterSeller !== 'all' && s.seller !== filterSeller) return false;
      if (filterDelay === '30' && (s.daysSinceSale ?? 0) < 30) return false;
      if (filterDelay === '60' && (s.daysSinceSale ?? 0) < 60) return false;
      return true;
    });
  }, [noDateSurgeries, search, filterBranch, filterCategory, filterSeller, filterDelay]);

  const handleSchedule = (id: string, date: string, time: string, doctor?: string) => {
    updateSurgery.mutate({
      id,
      surgeryDate: date,
      surgeryTime: time,
      scheduleStatus: 'agendado',
      doctorOnDuty: doctor || null,
    }, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  const getDaysBadge = (days: number | null) => {
    if (days === null) return <span className="text-muted-foreground text-xs">—</span>;
    if (days >= 60) return <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20">{days}d</Badge>;
    if (days >= 30) return <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">{days}d</Badge>;
    return <Badge variant="secondary">{days}d</Badge>;
  };

  const getRowClass = (days: number | null) => {
    if (days === null) return '';
    if (days >= 60) return 'bg-red-500/5';
    if (days >= 30) return 'bg-yellow-500/5';
    return '';
  };

  const formatCurrency = (v: number | null) => {
    if (!v) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pacientes Vendidos (Sem Data)</h1>
          <p className="text-muted-foreground">{filtered.length} de {noDateSurgeries.length} pacientes</p>
        </div>
        <div className="flex gap-2">
          {stats.noDateOver30 > 0 && (
            <Badge variant="outline" className="border-yellow-500/40 text-yellow-700 dark:text-yellow-400 gap-1">
              <AlertTriangle className="h-3 w-3" /> {stats.noDateOver30} +30d
            </Badge>
          )}
          {stats.noDateOver60 > 0 && (
            <Badge variant="outline" className="border-red-500/40 text-red-700 dark:text-red-400 gap-1">
              <AlertTriangle className="h-3 w-3" /> {stats.noDateOver60} +60d
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente ou procedimento..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {(isAdmin || isGestao) && branches.length > 1 && (
              <Select value={filterBranch} onValueChange={setFilterBranch}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Unidade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Unidades</SelectItem>
                  {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {categories.length > 0 && (
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {sellers.length > 0 && (
              <Select value={filterSeller} onValueChange={setFilterSeller}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {sellers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <Select value={filterDelay} onValueChange={setFilterDelay}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Tempo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="30">+30 dias</SelectItem>
                <SelectItem value="60">+60 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Grau</TableHead>
                  <TableHead>VGV</TableHead>
                  <TableHead>Data Venda</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground py-12">
                      Nenhum paciente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(surgery => (
                    <TableRow key={surgery.id} className={getRowClass(surgery.daysSinceSale)}>
                      <TableCell className="font-medium">{surgery.patientName}</TableCell>
                      <TableCell>{surgery.category || '—'}</TableCell>
                      <TableCell className="max-w-[160px] truncate">{surgery.procedure}</TableCell>
                      <TableCell>{surgery.grade ?? '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatCurrency(surgery.vgv)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {surgery.saleDate ? format(new Date(surgery.saleDate), 'dd/MM/yyyy') : '—'}
                      </TableCell>
                      <TableCell>{surgery.branch}</TableCell>
                      <TableCell>
                        {surgery.contractStatus ? (
                          <Badge variant="outline" className="text-xs capitalize">{surgery.contractStatus}</Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{getDaysBadge(surgery.daysSinceSale)}</TableCell>
                      <TableCell>{surgery.seller || '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => { setSelectedSurgery(surgery); setDialogOpen(true); }}
                        >
                          <Calendar className="h-3.5 w-3.5 mr-1.5" /> Agendar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ScheduleSurgeryDialog
        surgery={selectedSurgery}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSchedule={handleSchedule}
        isLoading={updateSurgery.isPending}
      />
    </div>
  );
}
