import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Play, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Cycle {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  cycle_type: string;
  auto_eval_weight: number;
  manager_eval_weight: number;
  rh_eval_weight: number;
  created_at: string;
}

const emptyForm = {
  name: '',
  start_date: '',
  end_date: '',
  cycle_type: 'trimestral',
  auto_eval_weight: 20,
  manager_eval_weight: 50,
  rh_eval_weight: 30,
};

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Aberto', variant: 'outline' },
  in_progress: { label: 'Em Andamento', variant: 'default' },
  closed: { label: 'Encerrado', variant: 'secondary' },
};

export default function PerformanceCycles() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('rh_performance_cycles').select('*').order('start_date', { ascending: false });
    setCycles((data || []) as Cycle[]);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.start_date || !form.end_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    const total = form.auto_eval_weight + form.manager_eval_weight + form.rh_eval_weight;
    if (total !== 100) {
      toast.error(`Os pesos devem somar 100% (atual: ${total}%)`);
      return;
    }

    if (editing) {
      const { error } = await supabase.from('rh_performance_cycles').update({
        ...form,
        updated_at: new Date().toISOString(),
      }).eq('id', editing);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Ciclo atualizado');
    } else {
      const { error } = await supabase.from('rh_performance_cycles').insert({ ...form, status: 'open' });
      if (error) { toast.error('Erro ao criar ciclo'); return; }
      toast.success('Ciclo criado');
    }
    setDialogOpen(false);
    load();
  };

  const changeStatus = async (id: string, newStatus: string) => {
    await supabase.from('rh_performance_cycles').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    toast.success(`Ciclo ${newStatus === 'in_progress' ? 'iniciado' : 'encerrado'}`);
    load();
  };

  const openEdit = (c: Cycle) => {
    setEditing(c.id);
    setForm({
      name: c.name,
      start_date: c.start_date,
      end_date: c.end_date,
      cycle_type: c.cycle_type,
      auto_eval_weight: c.auto_eval_weight,
      manager_eval_weight: c.manager_eval_weight,
      rh_eval_weight: c.rh_eval_weight,
    });
    setDialogOpen(true);
  };

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ciclos de Avaliação</h1>
          <p className="text-muted-foreground">Gerencie os ciclos trimestrais e anuais de avaliação</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Ciclo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Pesos (Auto/Gestor/RH)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum ciclo cadastrado</TableCell></TableRow>
              ) : cycles.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><Badge variant="outline">{c.cycle_type}</Badge></TableCell>
                  <TableCell className="text-sm">{format(new Date(c.start_date), 'dd/MM/yyyy')} — {format(new Date(c.end_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-sm">{c.auto_eval_weight}% / {c.manager_eval_weight}% / {c.rh_eval_weight}%</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGES[c.status]?.variant || 'outline'}>{STATUS_BADGES[c.status]?.label || c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {c.status === 'open' && (
                      <Button size="sm" variant="ghost" onClick={() => changeStatus(c.id, 'in_progress')}><Play className="h-4 w-4" /></Button>
                    )}
                    {c.status === 'in_progress' && (
                      <Button size="sm" variant="ghost" onClick={() => changeStatus(c.id, 'closed')}><CheckCircle className="h-4 w-4" /></Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar Ciclo' : 'Novo Ciclo'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Q1 2026" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Início</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>Fim</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.cycle_type} onValueChange={v => setForm({ ...form, cycle_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pesos de Avaliação (devem somar 100%)</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Autoavaliação</Label>
                  <Input type="number" value={form.auto_eval_weight} onChange={e => setForm({ ...form, auto_eval_weight: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-xs">Gestor</Label>
                  <Input type="number" value={form.manager_eval_weight} onChange={e => setForm({ ...form, manager_eval_weight: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-xs">RH</Label>
                  <Input type="number" value={form.rh_eval_weight} onChange={e => setForm({ ...form, rh_eval_weight: Number(e.target.value) })} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Total: {form.auto_eval_weight + form.manager_eval_weight + form.rh_eval_weight}%</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
