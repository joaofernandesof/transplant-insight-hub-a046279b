import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface KPI {
  id: string; cargo_id: string; name: string; description: string | null;
  monthly_target: number | null; weight: number; kpi_type: string;
}

export default function PerformanceKPIs() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [cargos, setCargos] = useState<{ id: string; nome: string }[]>([]);
  const [selectedCargo, setSelectedCargo] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ cargo_id: '', name: '', description: '', monthly_target: '', weight: '1', kpi_type: 'manual' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('rh_cargo_kpis').select('*').order('cargo_id'),
      supabase.from('rh_cargos').select('id, nome').order('nome'),
    ]).then(([k, c]) => {
      setKpis((k.data || []) as KPI[]);
      setCargos(c.data || []);
      setLoading(false);
    });
  }, []);

  const load = async () => {
    const { data } = await supabase.from('rh_cargo_kpis').select('*').order('cargo_id');
    setKpis((data || []) as KPI[]);
  };

  const cargoMap = new Map(cargos.map(c => [c.id, c.nome]));
  const filtered = selectedCargo === 'all' ? kpis : kpis.filter(k => k.cargo_id === selectedCargo);

  const handleSave = async () => {
    if (!form.cargo_id || !form.name) { toast.error('Preencha campos obrigatórios'); return; }
    const payload = {
      cargo_id: form.cargo_id,
      name: form.name,
      description: form.description || null,
      monthly_target: form.monthly_target ? Number(form.monthly_target) : null,
      weight: Number(form.weight),
      kpi_type: form.kpi_type,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      await supabase.from('rh_cargo_kpis').update(payload).eq('id', editingId);
      toast.success('KPI atualizado');
    } else {
      await supabase.from('rh_cargo_kpis').insert(payload);
      toast.success('KPI criado');
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('rh_cargo_kpis').delete().eq('id', id);
    toast.success('KPI removido');
    load();
  };

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">KPIs por Cargo</h1>
          <p className="text-muted-foreground">Configure indicadores de desempenho por função</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCargo} onValueChange={setSelectedCargo}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Cargo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {cargos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditingId(null); setForm({ cargo_id: '', name: '', description: '', monthly_target: '', weight: '1', kpi_type: 'manual' }); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Novo KPI
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cargo</TableHead>
                <TableHead>KPI</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Meta Mensal</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum KPI cadastrado</TableCell></TableRow>
              ) : filtered.map(k => (
                <TableRow key={k.id}>
                  <TableCell>{cargoMap.get(k.cargo_id) || '—'}</TableCell>
                  <TableCell className="font-medium">{k.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{k.description || '—'}</TableCell>
                  <TableCell>{k.monthly_target ?? '—'}</TableCell>
                  <TableCell>{k.weight}</TableCell>
                  <TableCell><Badge variant="outline">{k.kpi_type}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditingId(k.id); setForm({ cargo_id: k.cargo_id, name: k.name, description: k.description || '', monthly_target: k.monthly_target?.toString() || '', weight: k.weight.toString(), kpi_type: k.kpi_type }); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(k.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Editar KPI' : 'Novo KPI'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cargo</Label>
              <Select value={form.cargo_id} onValueChange={v => setForm({ ...form, cargo_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{cargos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nome do KPI</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Meta Mensal</Label><Input type="number" value={form.monthly_target} onChange={e => setForm({ ...form, monthly_target: e.target.value })} /></div>
              <div><Label>Peso</Label><Input type="number" step="0.1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.kpi_type} onValueChange={v => setForm({ ...form, kpi_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatic">Automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
