import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Search, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNoDatePatients, type NoDatePatient } from '../hooks/useNoDatePatients';
import { useBranches } from '../hooks/useBranches';
import { ScheduleSurgeryDialog } from '../components/ScheduleSurgeryDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

function DaysBadge({ days }: { days: number }) {
  if (days >= 60) {
    return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">{days}d</Badge>;
  }
  if (days >= 30) {
    return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">{days}d</Badge>;
  }
  return <Badge variant="secondary">{days}d</Badge>;
}

export default function NoDateQueue() {
  const {
    patients,
    isLoading,
    filters,
    updateFilter,
    resetFilters,
    filterOptions,
    stats,
  } = useNoDatePatients();

  const { branches: allowedBranches } = useBranches();
  const [selectedPatient, setSelectedPatient] = useState<NoDatePatient | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const hasActiveFilters =
    filters.search ||
    filters.branch !== 'all' ||
    filters.category !== 'all' ||
    filters.procedure !== 'all' ||
    filters.seller !== 'all' ||
    filters.delayFilter !== 'all' ||
    filters.saleDateFrom ||
    filters.saleDateTo;

  const getRowClass = (days: number) => {
    if (days >= 60) return 'bg-red-50/50 dark:bg-red-950/10';
    if (days >= 30) return 'bg-yellow-50/50 dark:bg-yellow-950/10';
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pacientes Vendidos (Sem Data)</h1>
          <p className="text-muted-foreground">
            {stats.filtered} de {stats.total} pacientes
            {stats.over30 > 0 && (
              <span className="ml-2 text-yellow-600">• {stats.over30} acima de 30 dias</span>
            )}
            {stats.over60 > 0 && (
              <span className="ml-2 text-red-600">• {stats.over60} acima de 60 dias</span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Branch - respects user permissions */}
            <Select value={filters.branch} onValueChange={(v) => updateFilter('branch', v)}>
              <SelectTrigger><SelectValue placeholder="Unidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas unidades</SelectItem>
                {(allowedBranches.length > 0 ? allowedBranches : filterOptions.branches).map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category */}
            <Select value={filters.category} onValueChange={(v) => updateFilter('category', v)}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {filterOptions.categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Delay filter */}
            <Select value={filters.delayFilter} onValueChange={(v: 'all' | '30' | '60') => updateFilter('delayFilter', v)}>
              <SelectTrigger><SelectValue placeholder="Tempo sem agendar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="30">+30 dias</SelectItem>
                <SelectItem value="60">+60 dias</SelectItem>
              </SelectContent>
            </Select>

            {/* Seller */}
            <Select value={filters.seller} onValueChange={(v) => updateFilter('seller', v)}>
              <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos responsáveis</SelectItem>
                {filterOptions.sellers.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Procedure */}
            <Select value={filters.procedure} onValueChange={(v) => updateFilter('procedure', v)}>
              <SelectTrigger><SelectValue placeholder="Procedimento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos procedimentos</SelectItem>
                {filterOptions.procedures.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sale date from */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !filters.saleDateFrom && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.saleDateFrom
                    ? format(filters.saleDateFrom, 'dd/MM/yyyy')
                    : 'Data venda (de)'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.saleDateFrom}
                  onSelect={(d) => updateFilter('saleDateFrom', d)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Sale date to */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !filters.saleDateTo && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.saleDateTo
                    ? format(filters.saleDateTo, 'dd/MM/yyyy')
                    : 'Data venda (até)'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.saleDateTo}
                  onSelect={(d) => updateFilter('saleDateTo', d)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex items-center">
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="h-4 w-4 mr-1" /> Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">
                {hasActiveFilters ? 'Nenhum paciente encontrado com os filtros aplicados.' : 'Nenhum paciente vendido sem data de cirurgia.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>VGV</TableHead>
                  <TableHead>Data da Venda</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.saleId} className={getRowClass(patient.daysSinceSale)}>
                    <TableCell className="font-medium">{patient.patientName}</TableCell>
                    <TableCell>{patient.branch}</TableCell>
                    <TableCell>{patient.procedure}</TableCell>
                    <TableCell>{patient.category || '-'}</TableCell>
                    <TableCell>{formatCurrency(patient.vgv)}</TableCell>
                    <TableCell>{format(new Date(patient.saleDate), 'dd/MM/yyyy')}</TableCell>
                    <TableCell><DaysBadge days={patient.daysSinceSale} /></TableCell>
                    <TableCell>{patient.seller || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {patient.contractStatus || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setDialogOpen(true);
                        }}
                      >
                        Agendar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ScheduleSurgeryDialog
        patient={selectedPatient}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
