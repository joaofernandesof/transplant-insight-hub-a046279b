import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

interface Cargo {
  id: string;
  nome: string;
  nivel: string;
  objetivo: string | null;
  responsabilidades: string | null;
  competencias: string | null;
  formacao: string | null;
  modelo_contratacao: string;
  tem_comissao: boolean;
  faixa_salarial_min: number | null;
  faixa_salarial_max: number | null;
}

const emptyForm = {
  nome: '', nivel: 'operacional', objetivo: '', responsabilidades: '', competencias: '',
  formacao: '', modelo_contratacao: 'clt', tem_comissao: false,
  faixa_salarial_min: null as number | null, faixa_salarial_max: null as number | null,
};

const NIVEIS = ['diretor', 'gerente', 'coordenador', 'supervisor', 'operacional', 'estagio'];
const MODELOS = [
  { value: 'clt', label: 'CLT' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'estagio', label: 'Estágio' },
  { value: 'clt_ou_cnpj', label: 'CLT ou CNPJ' },
];

export default function NeoRHCargos() {
  const { isAdmin } = useUnifiedAuth();
  const [items, setItems] = useState<Cargo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Cargo | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const { data } = await supabase.from('rh_cargos').select('*').order('nome');
    setItems((data ?? []) as Cargo[]);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({...emptyForm}); setDialogOpen(true); };
  const openEdit = (item: Cargo) => {
    setEditing(item);
    setForm({
      nome: item.nome,
      nivel: item.nivel,
      objetivo: item.objetivo ?? '',
      responsabilidades: item.responsabilidades ?? '',
      competencias: item.competencias ?? '',
      formacao: item.formacao ?? '',
      modelo_contratacao: item.modelo_contratacao,
      tem_comissao: item.tem_comissao,
      faixa_salarial_min: item.faixa_salarial_min,
      faixa_salarial_max: item.faixa_salarial_max,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    const payload = {
      nome: form.nome,
      nivel: form.nivel,
      objetivo: form.objetivo || null,
      responsabilidades: form.responsabilidades || null,
      competencias: form.competencias || null,
      formacao: form.formacao || null,
      modelo_contratacao: form.modelo_contratacao,
      tem_comissao: form.tem_comissao,
      faixa_salarial_min: form.faixa_salarial_min,
      faixa_salarial_max: form.faixa_salarial_max,
    };

    if (editing) {
      const { error } = await supabase.from('rh_cargos').update(payload).eq('id', editing.id);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Cargo atualizado');
    } else {
      const { error } = await supabase.from('rh_cargos').insert(payload);
      if (error) { toast.error('Erro ao criar'); return; }
      toast.success('Cargo criado');
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este cargo?')) return;
    const { error } = await supabase.from('rh_cargos').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Excluído');
    load();
  };

  const nivelBadge = (n: string) => {
    const colors: Record<string, string> = {
      diretor: 'bg-purple-100 text-purple-800',
      gerente: 'bg-blue-100 text-blue-800',
      coordenador: 'bg-cyan-100 text-cyan-800',
      supervisor: 'bg-amber-100 text-amber-800',
      operacional: 'bg-gray-100 text-gray-800',
      estagio: 'bg-emerald-100 text-emerald-800',
    };
    return <Badge className={colors[n] || ''}>{n}</Badge>;
  };

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cargos</h1>
        {isAdmin && <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Cargo</Button>}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Contratação</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Faixa Salarial</TableHead>
                {isAdmin && <TableHead className="w-[80px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{nivelBadge(c.nivel)}</TableCell>
                  <TableCell className="uppercase text-xs">{c.modelo_contratacao.replace('_', ' / ')}</TableCell>
                  <TableCell>{c.tem_comissao ? <Badge className="bg-emerald-100 text-emerald-800">Sim</Badge> : <Badge variant="outline">Não</Badge>}</TableCell>
                  <TableCell className="text-sm">
                    {c.faixa_salarial_min || c.faixa_salarial_max
                      ? `R$ ${(c.faixa_salarial_min ?? 0).toLocaleString('pt-BR')} - R$ ${(c.faixa_salarial_max ?? 0).toLocaleString('pt-BR')}`
                      : '—'}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum cargo cadastrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({...f, nome: e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nível</Label>
                <Select value={form.nivel} onValueChange={v => setForm(f => ({...f, nivel: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NIVEIS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Modelo Contratação</Label>
                <Select value={form.modelo_contratacao} onValueChange={v => setForm(f => ({...f, modelo_contratacao: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODELOS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Objetivo</Label>
              <Textarea value={form.objetivo} onChange={e => setForm(f => ({...f, objetivo: e.target.value}))} rows={2} />
            </div>
            <div className="grid gap-2">
              <Label>Responsabilidades (separar por ;)</Label>
              <Textarea value={form.responsabilidades} onChange={e => setForm(f => ({...f, responsabilidades: e.target.value}))} rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Competências</Label>
              <Textarea value={form.competencias} onChange={e => setForm(f => ({...f, competencias: e.target.value}))} rows={2} />
            </div>
            <div className="grid gap-2">
              <Label>Formação</Label>
              <Input value={form.formacao} onChange={e => setForm(f => ({...f, formacao: e.target.value}))} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Salário Mín</Label>
                <Input type="number" value={form.faixa_salarial_min ?? ''} onChange={e => setForm(f => ({...f, faixa_salarial_min: e.target.value ? Number(e.target.value) : null}))} />
              </div>
              <div className="grid gap-2">
                <Label>Salário Máx</Label>
                <Input type="number" value={form.faixa_salarial_max ?? ''} onChange={e => setForm(f => ({...f, faixa_salarial_max: e.target.value ? Number(e.target.value) : null}))} />
              </div>
              <div className="grid gap-2">
                <Label>Comissão?</Label>
                <Select value={form.tem_comissao ? 'sim' : 'nao'} onValueChange={v => setForm(f => ({...f, tem_comissao: v === 'sim'}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
