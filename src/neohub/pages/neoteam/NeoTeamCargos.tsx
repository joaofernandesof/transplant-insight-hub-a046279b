import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Building2, Users, LayoutGrid, List, Plus, Pencil, Trash2, Search,
  UserCircle, CircleDot, Briefcase, AlertTriangle, Loader2, Shield, BarChart3,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';

const OrgAccessMatrix = lazy(() => import('./components/OrgAccessMatrix'));
const OrgDashboard = lazy(() => import('./components/OrgDashboard'));
const OrgChart = lazy(() => import('./components/OrgChart'));

interface OrgPosition {
  id: string;
  unit: string;
  department: string;
  level: string;
  role_title: string;
  person_name: string | null;
  is_vacant: boolean;
  sort_order: number;
}

const UNITS = ['Fortaleza', 'IBRAMEC', 'Juazeiro'];
const DEPARTMENTS = ['Marketing', 'Operacional', 'Processos', 'Comercial', 'Pós-Vendas', 'Financeiro', 'Técnico', 'Jurídico', 'TI'];
const LEVELS = ['Diretoria', 'Gerência', 'Coordenação', 'Supervisão', 'Operação', 'Externos'];

const LEVEL_COLORS: Record<string, string> = {
  'Diretoria': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Gerência': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Coordenação': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  'Supervisão': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'Operação': 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300',
  'Externos': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const DEPT_COLORS: Record<string, string> = {
  'Marketing': 'border-l-pink-500',
  'Operacional': 'border-l-orange-500',
  'Processos': 'border-l-violet-500',
  'Comercial': 'border-l-blue-500',
  'Pós-Vendas': 'border-l-green-500',
  'Financeiro': 'border-l-yellow-500',
  'Técnico': 'border-l-red-500',
  'Jurídico': 'border-l-gray-500',
  'TI': 'border-l-cyan-500',
};

const emptyForm = {
  unit: 'Fortaleza',
  department: 'Marketing',
  level: 'Operação',
  role_title: '',
  person_name: '',
  is_vacant: false,
};

type SortKey = 'unit' | 'department' | 'level' | 'role_title' | 'person_name' | 'is_vacant';
type SortDir = 'asc' | 'desc';
type MainTab = 'tabela' | 'matriz' | 'acessos' | 'dashboard';

export default function NeoTeamCargos() {
  const [mainTab, setMainTab] = useState<MainTab>('tabela');
  const [positions, setPositions] = useState<OrgPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showVacantOnly, setShowVacantOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OrgPosition | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('org_positions')
      .select('*')
      .order('sort_order');
    setPositions((data ?? []) as OrgPosition[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = positions;
    if (filterUnit !== 'all') result = result.filter(p => p.unit === filterUnit);
    if (filterDept !== 'all') result = result.filter(p => p.department === filterDept);
    if (filterLevel !== 'all') result = result.filter(p => p.level === filterLevel);
    if (showVacantOnly) result = result.filter(p => p.is_vacant);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.role_title.toLowerCase().includes(q) ||
        p.person_name?.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.unit.toLowerCase().includes(q)
      );
    }
    return result;
  }, [positions, filterUnit, filterDept, filterLevel, showVacantOnly, search]);

  // Sorting
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const levelOrder = Object.fromEntries(LEVELS.map((l, i) => [l, i]));
    return [...filtered].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      if (sortKey === 'is_vacant') {
        aVal = a.is_vacant ? 1 : 0;
        bVal = b.is_vacant ? 1 : 0;
      } else if (sortKey === 'level') {
        aVal = levelOrder[a.level] ?? 99;
        bVal = levelOrder[b.level] ?? 99;
      } else {
        aVal = (a[sortKey] ?? '').toString().toLowerCase();
        bVal = (b[sortKey] ?? '').toString().toLowerCase();
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(null); setSortDir('asc'); }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 text-primary" />
      : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  const groupedByDept = useMemo(() => {
    const map: Record<string, OrgPosition[]> = {};
    for (const dept of DEPARTMENTS) {
      const items = filtered.filter(p => p.department === dept);
      if (items.length > 0) map[dept] = items;
    }
    return map;
  }, [filtered]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (pos: OrgPosition) => {
    setEditing(pos);
    setForm({
      unit: pos.unit,
      department: pos.department,
      level: pos.level,
      role_title: pos.role_title,
      person_name: pos.person_name ?? '',
      is_vacant: pos.is_vacant,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.role_title.trim()) { toast.error('Cargo é obrigatório'); return; }
    const payload = {
      unit: form.unit,
      department: form.department,
      level: form.level,
      role_title: form.role_title,
      person_name: form.is_vacant ? null : (form.person_name || null),
      is_vacant: form.is_vacant,
    };

    if (editing) {
      const { error } = await supabase.from('org_positions').update(payload).eq('id', editing.id);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Posição atualizada');
    } else {
      const { error } = await supabase.from('org_positions').insert(payload);
      if (error) { toast.error('Erro ao criar'); return; }
      toast.success('Posição criada');
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir esta posição?')) return;
    const { error } = await supabase.from('org_positions').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Excluído');
    load();
  };

  const NAV_ITEMS: { key: MainTab; icon: typeof Users; label: string }[] = [
    { key: 'tabela', icon: List, label: 'Tabela' },
    { key: 'matriz', icon: LayoutGrid, label: 'Organograma' },
    { key: 'acessos', icon: Shield, label: 'Matriz de Acessos' },
    { key: 'dashboard', icon: BarChart3, label: 'Dashboard' },
  ];

  return (
    <div className="space-y-5 p-4 lg:p-6 pt-14 lg:pt-6">
      <NeoTeamBreadcrumb />

      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          Estrutura Organizacional
        </h1>
        <p className="text-muted-foreground text-sm">
          Matriz de cargos, funções e vagas por unidade e departamento
        </p>
      </div>

      {/* Centered Navigation */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {NAV_ITEMS.map(item => (
          <Button
            key={item.key}
            variant={mainTab === item.key ? 'default' : 'outline'}
            onClick={() => setMainTab(item.key)}
            className="gap-2 px-5 h-10 min-w-[120px]"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Button>
        ))}
        {(mainTab === 'tabela' || mainTab === 'matriz') && (
          <Button onClick={openNew} className="gap-2 px-5 h-10 ml-2">
            <Plus className="h-4 w-4" /> Nova Posição
          </Button>
        )}
      </div>

      {/* Tab Content */}
      {mainTab === 'acessos' ? (
        <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
          <OrgAccessMatrix />
        </Suspense>
      ) : mainTab === 'dashboard' ? (
        <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
          <OrgDashboard positions={positions} />
        </Suspense>
      ) : (
      <>
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cargo ou colaborador..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterUnit} onValueChange={setFilterUnit}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Unidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Unidades</SelectItem>
                {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Departamento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Deptos</SelectItem>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Nível" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Níveis</SelectItem>
                {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              variant={showVacantOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowVacantOnly(!showVacantOnly)}
              className="gap-1.5"
            >
              <CircleDot className="h-3.5 w-3.5" />
              Vagas
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : mainTab === 'matriz' ? (
        <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
          <OrgChart positions={filtered} onEdit={openEdit} />
        </Suspense>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {([
                    ['unit', 'Unidade'],
                    ['department', 'Departamento'],
                    ['level', 'Nível'],
                    ['role_title', 'Cargo'],
                    ['person_name', 'Colaborador'],
                    ['is_vacant', 'Status'],
                  ] as [SortKey, string][]).map(([key, label]) => (
                    <TableHead
                      key={key}
                      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                      onClick={() => toggleSort(key)}
                    >
                      <div className="flex items-center gap-1.5">
                        {label}
                        <SortIcon col={key} />
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-[90px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map(pos => (
                  <TableRow key={pos.id} className={pos.is_vacant ? 'bg-destructive/5' : ''}>
                    <TableCell>{pos.unit}</TableCell>
                    <TableCell>{pos.department}</TableCell>
                    <TableCell>
                      <Badge className={`text-[11px] ${LEVEL_COLORS[pos.level] || ''}`}>
                        {pos.level}
                      </Badge>
                    </TableCell>
                    <TableCell>{pos.role_title}</TableCell>
                    <TableCell className="font-medium">
                      {pos.is_vacant ? (
                        <span className="text-destructive italic">Vaga aberta</span>
                      ) : pos.person_name}
                    </TableCell>
                    <TableCell>
                      {pos.is_vacant ? (
                        <Badge variant="destructive" className="text-[11px]">Vaga</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[11px]">Ocupado</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(pos)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(pos.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      Nenhuma posição encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Posição' : 'Nova Posição'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Unidade</Label>
                <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Departamento</Label>
                <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Nível Hierárquico</Label>
              <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Cargo / Função *</Label>
              <Input
                value={form.role_title}
                onChange={e => setForm(f => ({ ...f, role_title: e.target.value }))}
                placeholder="Ex: Coordenador de Marketing"
              />
            </div>
            <div className="grid gap-2">
              <Label>Vaga aberta?</Label>
              <Select
                value={form.is_vacant ? 'sim' : 'nao'}
                onValueChange={v => setForm(f => ({ ...f, is_vacant: v === 'sim', person_name: v === 'sim' ? '' : f.person_name }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Não — Ocupado</SelectItem>
                  <SelectItem value="sim">Sim — Vaga em aberto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!form.is_vacant && (
              <div className="grid gap-2">
                <Label>Nome do Colaborador</Label>
                <Input
                  value={form.person_name}
                  onChange={e => setForm(f => ({ ...f, person_name: e.target.value }))}
                  placeholder="Ex: João Silva"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  );
}
