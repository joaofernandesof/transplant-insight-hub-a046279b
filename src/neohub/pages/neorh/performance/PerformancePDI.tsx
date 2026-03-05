import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClipboardList, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';

interface PDI {
  id: string; colaborador_id: string; grade: string; objective: string;
  deadline: string; status: string; actions: string; cycle_id: string | null;
  created_at: string;
}

interface PDIAction { text: string; done: boolean; }

const STATUS_MAP: Record<string, { label: string; icon: any; color: string }> = {
  open: { label: 'Aberto', icon: AlertTriangle, color: 'text-amber-600' },
  in_progress: { label: 'Em Andamento', icon: Clock, color: 'text-blue-600' },
  completed: { label: 'Concluído', icon: CheckCircle, color: 'text-emerald-600' },
  expired: { label: 'Expirado', icon: AlertTriangle, color: 'text-red-600' },
};

export default function PerformancePDI() {
  const [pdis, setPdis] = useState<PDI[]>([]);
  const [colaboradores, setColaboradores] = useState<Map<string, string>>(new Map());
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPDI, setSelectedPDI] = useState<PDI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [p, c] = await Promise.all([
      supabase.from('rh_performance_pdis').select('*').order('created_at', { ascending: false }),
      supabase.from('rh_colaboradores').select('id, nome'),
    ]);
    setPdis((p.data || []) as PDI[]);
    setColaboradores(new Map((c.data || []).map(x => [x.id, x.nome])));
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return pdis.filter(p => filterStatus === 'all' || p.status === filterStatus);
  }, [pdis, filterStatus]);

  const parseActions = (actionsStr: string): PDIAction[] => {
    try {
      const parsed = typeof actionsStr === 'string' ? JSON.parse(actionsStr) : actionsStr;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  };

  const toggleAction = async (pdi: PDI, index: number) => {
    const actions = parseActions(pdi.actions);
    actions[index].done = !actions[index].done;

    const allDone = actions.every(a => a.done);
    const anyDone = actions.some(a => a.done);
    const newStatus = allDone ? 'completed' : anyDone ? 'in_progress' : 'open';

    await supabase.from('rh_performance_pdis').update({
      actions: JSON.stringify(actions),
      status: newStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', pdi.id);

    toast.success(allDone ? 'PDI concluído!' : 'Ação atualizada');
    load();
    if (selectedPDI?.id === pdi.id) {
      setSelectedPDI({ ...pdi, actions: JSON.stringify(actions), status: newStatus });
    }
  };

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Planos de Melhoria (PDI)</h1>
          <p className="text-muted-foreground">Acompanhe os planos de desenvolvimento individual</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="expired">Expirado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['open', 'in_progress', 'completed', 'expired'] as const).map(st => {
          const info = STATUS_MAP[st];
          const count = pdis.filter(p => p.status === st).length;
          return (
            <Card key={st} className="cursor-pointer hover:shadow-md" onClick={() => setFilterStatus(st)}>
              <CardContent className="p-3 flex items-center gap-3">
                <info.icon className={`h-5 w-5 ${info.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{info.label}</p>
                  <p className="text-lg font-bold">{count}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Objetivo</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum PDI encontrado</TableCell></TableRow>
              ) : filtered.map(p => {
                const actions = parseActions(p.actions);
                const done = actions.filter(a => a.done).length;
                const total = actions.length;
                const daysLeft = differenceInDays(new Date(p.deadline), new Date());
                const isOverdue = daysLeft < 0 && p.status !== 'completed';

                return (
                  <TableRow key={p.id} className={isOverdue ? 'bg-red-50/50 dark:bg-red-950/20' : ''}>
                    <TableCell className="font-medium">{colaboradores.get(p.colaborador_id) || '—'}</TableCell>
                    <TableCell><Badge className={p.grade === 'D' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}>{p.grade}</Badge></TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{p.objective}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(p.deadline), 'dd/MM/yyyy')}
                      {isOverdue && <span className="text-red-600 text-xs ml-1">(vencido)</span>}
                      {!isOverdue && daysLeft <= 3 && p.status !== 'completed' && <span className="text-amber-600 text-xs ml-1">({daysLeft}d)</span>}
                    </TableCell>
                    <TableCell className="text-sm">{done}/{total}</TableCell>
                    <TableCell>
                      {(() => { const info = STATUS_MAP[p.status] || STATUS_MAP.open; return <Badge variant="outline" className={info.color}>{info.label}</Badge>; })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedPDI(p)}><ClipboardList className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedPDI} onOpenChange={() => setSelectedPDI(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>PDI — {colaboradores.get(selectedPDI?.colaborador_id || '') || ''}</DialogTitle>
          </DialogHeader>
          {selectedPDI && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={selectedPDI.grade === 'D' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}>Nível {selectedPDI.grade}</Badge>
                <span className="text-sm text-muted-foreground">Prazo: {format(new Date(selectedPDI.deadline), 'dd/MM/yyyy')}</span>
              </div>
              <p className="text-sm">{selectedPDI.objective}</p>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Checklist de Ações</h4>
                {parseActions(selectedPDI.actions).map((action, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                    <Checkbox checked={action.done} onCheckedChange={() => toggleAction(selectedPDI, i)} />
                    <span className={`text-sm ${action.done ? 'line-through text-muted-foreground' : ''}`}>{action.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
