import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Package, Plus, Search, Filter, QrCode, Wrench, ArrowRightLeft,
  BarChart3, Printer, Download, Eye, Edit, Trash2, MapPin, User,
  Calendar, DollarSign, Tag, Box, Monitor, ChevronDown, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

// Types
interface Asset {
  id: string;
  codigo_patrimonio: string;
  nome_item: string;
  categoria_id: string | null;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  descricao: string | null;
  empresa_id: string | null;
  localizacao_id: string | null;
  responsavel_id: string | null;
  data_compra: string | null;
  valor_compra: number | null;
  garantia_ate: string | null;
  status: string;
  qr_code: string | null;
  codigo_barras: string | null;
  criado_em: string;
  atualizado_em: string;
  asset_categories?: { nome: string } | null;
  asset_locations?: { nome_local: string } | null;
}

interface AssetCategory { id: string; nome: string; descricao: string | null; }
interface AssetLocation { id: string; nome_local: string; tipo_local: string; descricao: string | null; }
interface AssetMovement {
  id: string; asset_id: string; local_anterior: string | null; local_novo: string | null;
  responsavel_anterior: string | null; responsavel_novo: string | null;
  data_movimentacao: string; motivo: string | null; registrado_por: string;
}
interface AssetMaintenance {
  id: string; asset_id: string; tipo_manutencao: string; descricao: string | null;
  data_inicio: string | null; data_fim: string | null; valor: number | null;
  responsavel: string | null; status: string; criado_em: string;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  ativo: { label: 'Ativo', variant: 'default' },
  em_uso: { label: 'Em Uso', variant: 'secondary' },
  em_manutencao: { label: 'Em Manutenção', variant: 'outline' },
  inativo: { label: 'Inativo', variant: 'destructive' },
  descartado: { label: 'Descartado', variant: 'destructive' },
};

const EMPTY_FORM = {
  nome_item: '', categoria_id: '', marca: '', modelo: '', numero_serie: '',
  descricao: '', localizacao_id: '', responsavel_id: '', data_compra: '',
  valor_compra: '', garantia_ate: '', status: 'ativo' as string,
};

export default function AssetManagementPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [transferForm, setTransferForm] = useState({ localizacao_id: '', responsavel_id: '', motivo: '' });
  const [maintenanceForm, setMaintenanceForm] = useState({ tipo_manutencao: 'corretiva', descricao: '', data_inicio: '', data_fim: '', valor: '', responsavel: '', status: 'aberta' });

  // Queries
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('assets').select('*, asset_categories(nome), asset_locations(nome_local)').order('criado_em', { ascending: false });
      if (error) throw error;
      return data as Asset[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['asset_categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('asset_categories').select('*').order('nome');
      if (error) throw error;
      return data as AssetCategory[];
    },
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['asset_locations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('asset_locations').select('*').order('nome_local');
      if (error) throw error;
      return data as AssetLocation[];
    },
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['asset_movements', viewingAsset?.id],
    enabled: !!viewingAsset,
    queryFn: async () => {
      const { data, error } = await supabase.from('asset_movements').select('*').eq('asset_id', viewingAsset!.id).order('data_movimentacao', { ascending: false });
      if (error) throw error;
      return data as AssetMovement[];
    },
  });

  const { data: maintenances = [] } = useQuery({
    queryKey: ['asset_maintenance', viewingAsset?.id],
    enabled: !!viewingAsset,
    queryFn: async () => {
      const { data, error } = await supabase.from('asset_maintenance').select('*').eq('asset_id', viewingAsset!.id).order('criado_em', { ascending: false });
      if (error) throw error;
      return data as AssetMaintenance[];
    },
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (formData: typeof EMPTY_FORM) => {
      const payload: Record<string, any> = {
        nome_item: formData.nome_item,
        categoria_id: formData.categoria_id || null,
        marca: formData.marca || null,
        modelo: formData.modelo || null,
        numero_serie: formData.numero_serie || null,
        descricao: formData.descricao || null,
        localizacao_id: formData.localizacao_id || null,
        responsavel_id: formData.responsavel_id || null,
        data_compra: formData.data_compra || null,
        valor_compra: formData.valor_compra ? parseFloat(formData.valor_compra) : null,
        garantia_ate: formData.garantia_ate || null,
        status: formData.status,
        atualizado_em: new Date().toISOString(),
      };
      if (editingAsset) {
        const { error } = await supabase.from('assets').update(payload).eq('id', editingAsset.id);
        if (error) throw error;
      } else {
        const qrUrl = `${window.location.origin}/neoteam/assets?view=new`;
        payload.codigo_patrimonio = '';
        payload.qr_code = qrUrl;
        const { error } = await supabase.from('assets').insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingAsset ? 'Ativo atualizado!' : 'Ativo cadastrado!');
      qc.invalidateQueries({ queryKey: ['assets'] });
      closeForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!viewingAsset || !user) return;
      const { error: moveErr } = await supabase.from('asset_movements').insert({
        asset_id: viewingAsset.id,
        local_anterior: viewingAsset.localizacao_id,
        local_novo: transferForm.localizacao_id || null,
        responsavel_anterior: viewingAsset.responsavel_id,
        responsavel_novo: transferForm.responsavel_id || null,
        motivo: transferForm.motivo || null,
        registrado_por: user.id,
      } as any);
      if (moveErr) throw moveErr;
      const updates: any = { atualizado_em: new Date().toISOString() };
      if (transferForm.localizacao_id) updates.localizacao_id = transferForm.localizacao_id;
      if (transferForm.responsavel_id) updates.responsavel_id = transferForm.responsavel_id;
      const { error } = await supabase.from('assets').update(updates).eq('id', viewingAsset.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Transferência registrada!');
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['asset_movements'] });
      setShowTransfer(false);
      setTransferForm({ localizacao_id: '', responsavel_id: '', motivo: '' });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const maintenanceMutation = useMutation({
    mutationFn: async () => {
      if (!viewingAsset) return;
      const { error } = await supabase.from('asset_maintenance').insert({
        asset_id: viewingAsset.id,
        tipo_manutencao: maintenanceForm.tipo_manutencao,
        descricao: maintenanceForm.descricao || null,
        data_inicio: maintenanceForm.data_inicio || null,
        data_fim: maintenanceForm.data_fim || null,
        valor: maintenanceForm.valor ? parseFloat(maintenanceForm.valor) : null,
        responsavel: maintenanceForm.responsavel || null,
        status: maintenanceForm.status,
      } as any);
      if (error) throw error;
      if (maintenanceForm.status !== 'finalizada') {
        await supabase.from('assets').update({ status: 'em_manutencao', atualizado_em: new Date().toISOString() }).eq('id', viewingAsset.id);
      }
    },
    onSuccess: () => {
      toast.success('Manutenção registrada!');
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['asset_maintenance'] });
      setShowMaintenance(false);
      setMaintenanceForm({ tipo_manutencao: 'corretiva', descricao: '', data_inicio: '', data_fim: '', valor: '', responsavel: '', status: 'aberta' });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Ativo removido!');
      qc.invalidateQueries({ queryKey: ['assets'] });
      setViewingAsset(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Helpers
  const closeForm = () => { setShowForm(false); setEditingAsset(null); setForm(EMPTY_FORM); };
  const openEdit = (a: Asset) => {
    setEditingAsset(a);
    setForm({
      nome_item: a.nome_item, categoria_id: a.categoria_id || '', marca: a.marca || '',
      modelo: a.modelo || '', numero_serie: a.numero_serie || '', descricao: a.descricao || '',
      localizacao_id: a.localizacao_id || '', responsavel_id: a.responsavel_id || '',
      data_compra: a.data_compra || '', valor_compra: a.valor_compra?.toString() || '',
      garantia_ate: a.garantia_ate || '', status: a.status,
    });
    setShowForm(true);
  };

  const filtered = useMemo(() => {
    return assets.filter(a => {
      const q = search.toLowerCase();
      const matchSearch = !q || a.nome_item.toLowerCase().includes(q) || a.codigo_patrimonio.toLowerCase().includes(q) || (a.marca?.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      const matchCat = categoryFilter === 'all' || a.categoria_id === categoryFilter;
      return matchSearch && matchStatus && matchCat;
    });
  }, [assets, search, statusFilter, categoryFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: assets.length,
    em_uso: assets.filter(a => a.status === 'em_uso').length,
    em_manutencao: assets.filter(a => a.status === 'em_manutencao').length,
    ativos: assets.filter(a => a.status === 'ativo').length,
  }), [assets]);

  const catStats = useMemo(() => {
    const map: Record<string, number> = {};
    assets.forEach(a => {
      const catName = a.asset_categories?.nome || 'Sem categoria';
      map[catName] = (map[catName] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [assets]);

  const printLabel = (a: Asset) => {
    const w = window.open('', '_blank', 'width=400,height=300');
    if (!w) return;
    w.document.write(`
      <html><head><title>Etiqueta - ${a.codigo_patrimonio}</title>
      <style>
        body { font-family: Arial; text-align: center; padding: 20px; }
        .code { font-size: 24px; font-weight: bold; margin: 10px 0; letter-spacing: 2px; }
        .name { font-size: 14px; color: #666; }
        .qr { margin: 15px auto; width: 120px; height: 120px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; font-size: 10px; }
        .logo { font-size: 18px; font-weight: bold; color: #1a56db; margin-bottom: 10px; }
      </style></head><body>
      <div class="logo">Neo Group</div>
      <div class="code">${a.codigo_patrimonio}</div>
      <div class="name">${a.nome_item}</div>
      <div class="qr">QR: ${a.codigo_patrimonio}</div>
      <script>setTimeout(()=>window.print(),300)</script>
      </body></html>
    `);
    w.document.close();
  };

  return (
    <div className="p-4 pt-16 lg:pt-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Controle Patrimonial
          </h1>
          <p className="text-sm text-muted-foreground">Gestão de ativos físicos do Neo Group</p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setEditingAsset(null); setShowForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Cadastrar Ativo
        </Button>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Box className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total de Ativos</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Monitor className="h-5 w-5 text-emerald-600" /></div>
          <div><p className="text-2xl font-bold">{stats.em_uso}</p><p className="text-xs text-muted-foreground">Em Uso</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><Wrench className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-2xl font-bold">{stats.em_manutencao}</p><p className="text-xs text-muted-foreground">Em Manutenção</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Tag className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-2xl font-bold">{stats.ativos}</p><p className="text-xs text-muted-foreground">Disponíveis</p></div>
        </CardContent></Card>
      </div>

      {/* Category breakdown */}
      {catStats.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Ativos por Categoria</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {catStats.map(([cat, count]) => (
              <Badge key={cat} variant="outline" className="gap-1 text-xs">{cat} <span className="font-bold">{count}</span></Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters + Table */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, código ou marca..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Carregando ativos...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Nenhum ativo encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Compra</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(a => (
                    <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewingAsset(a)}>
                      <TableCell className="font-mono font-semibold text-primary">{a.codigo_patrimonio}</TableCell>
                      <TableCell className="font-medium">{a.nome_item}</TableCell>
                      <TableCell>{a.asset_categories?.nome || '—'}</TableCell>
                      <TableCell>{a.asset_locations?.nome_local || '—'}</TableCell>
                      <TableCell><Badge variant={STATUS_MAP[a.status]?.variant || 'outline'}>{STATUS_MAP[a.status]?.label || a.status}</Badge></TableCell>
                      <TableCell>{a.data_compra ? format(new Date(a.data_compra), 'dd/MM/yyyy') : '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); setViewingAsset(a); }}><Eye className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); openEdit(a); }}><Edit className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); printLabel(a); }}><Printer className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========= DIALOGS ========= */}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) closeForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingAsset ? 'Editar Ativo' : 'Cadastrar Novo Ativo'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Nome do Item *</Label>
              <Input value={form.nome_item} onChange={e => setForm(f => ({ ...f, nome_item: e.target.value }))} placeholder="Ex: MacBook Pro 14" />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.categoria_id} onValueChange={v => setForm(f => ({ ...f, categoria_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Marca</Label><Input value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} /></div>
            <div><Label>Modelo</Label><Input value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} /></div>
            <div><Label>Nº de Série</Label><Input value={form.numero_serie} onChange={e => setForm(f => ({ ...f, numero_serie: e.target.value }))} /></div>
            <div>
              <Label>Localização</Label>
              <Select value={form.localizacao_id} onValueChange={v => setForm(f => ({ ...f, localizacao_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.nome_local}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Data de Compra</Label><Input type="date" value={form.data_compra} onChange={e => setForm(f => ({ ...f, data_compra: e.target.value }))} /></div>
            <div><Label>Valor de Compra (R$)</Label><Input type="number" step="0.01" value={form.valor_compra} onChange={e => setForm(f => ({ ...f, valor_compra: e.target.value }))} /></div>
            <div><Label>Garantia até</Label><Input type="date" value={form.garantia_ate} onChange={e => setForm(f => ({ ...f, garantia_ate: e.target.value }))} /></div>
            <div className="md:col-span-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.nome_item || saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : editingAsset ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!viewingAsset && !showForm} onOpenChange={v => { if (!v) setViewingAsset(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewingAsset && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="font-mono text-primary">{viewingAsset.codigo_patrimonio}</span>
                  <Badge variant={STATUS_MAP[viewingAsset.status]?.variant}>{STATUS_MAP[viewingAsset.status]?.label}</Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-muted-foreground block">Nome</span><strong>{viewingAsset.nome_item}</strong></div>
                  <div><span className="text-muted-foreground block">Categoria</span><strong>{viewingAsset.asset_categories?.nome || '—'}</strong></div>
                  <div><span className="text-muted-foreground block">Localização</span><strong>{viewingAsset.asset_locations?.nome_local || '—'}</strong></div>
                  <div><span className="text-muted-foreground block">Marca</span><strong>{viewingAsset.marca || '—'}</strong></div>
                  <div><span className="text-muted-foreground block">Modelo</span><strong>{viewingAsset.modelo || '—'}</strong></div>
                  <div><span className="text-muted-foreground block">Nº Série</span><strong>{viewingAsset.numero_serie || '—'}</strong></div>
                  <div><span className="text-muted-foreground block">Data Compra</span><strong>{viewingAsset.data_compra ? format(new Date(viewingAsset.data_compra), 'dd/MM/yyyy') : '—'}</strong></div>
                  <div><span className="text-muted-foreground block">Valor</span><strong>{viewingAsset.valor_compra ? `R$ ${viewingAsset.valor_compra.toLocaleString('pt-BR')}` : '—'}</strong></div>
                  <div><span className="text-muted-foreground block">Garantia até</span><strong>{viewingAsset.garantia_ate ? format(new Date(viewingAsset.garantia_ate), 'dd/MM/yyyy') : '—'}</strong></div>
                </div>

                {viewingAsset.descricao && <p className="text-sm text-muted-foreground">{viewingAsset.descricao}</p>}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => { openEdit(viewingAsset); }}>
                    <Edit className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowTransfer(true)}>
                    <ArrowRightLeft className="h-3.5 w-3.5" /> Transferir
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowMaintenance(true)}>
                    <Wrench className="h-3.5 w-3.5" /> Manutenção
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => printLabel(viewingAsset)}>
                    <Printer className="h-3.5 w-3.5" /> Etiqueta
                  </Button>
                  <Button size="sm" variant="destructive" className="gap-1 ml-auto" onClick={() => { if (confirm('Remover este ativo?')) deleteMutation.mutate(viewingAsset.id); }}>
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </Button>
                </div>

                <Separator />

                {/* Movements History */}
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" /> Histórico de Movimentações</h3>
                  {movements.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada.</p>
                  ) : (
                    <div className="space-y-2">
                      {movements.map(m => (
                        <div key={m.id} className="text-sm border rounded-lg p-3 bg-muted/30">
                          <div className="flex items-center justify-between">
                            <span>{format(new Date(m.data_movimentacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                          </div>
                          {m.motivo && <p className="text-muted-foreground mt-1">{m.motivo}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Maintenance History */}
                <div>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Wrench className="h-4 w-4" /> Histórico de Manutenção</h3>
                  {maintenances.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma manutenção registrada.</p>
                  ) : (
                    <div className="space-y-2">
                      {maintenances.map(m => (
                        <div key={m.id} className="text-sm border rounded-lg p-3 bg-muted/30">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{m.tipo_manutencao === 'preventiva' ? 'Preventiva' : 'Corretiva'}</Badge>
                            <Badge variant={m.status === 'finalizada' ? 'default' : m.status === 'em_execucao' ? 'secondary' : 'outline'}>
                              {m.status === 'aberta' ? 'Aberta' : m.status === 'em_execucao' ? 'Em Execução' : 'Finalizada'}
                            </Badge>
                          </div>
                          {m.descricao && <p className="text-muted-foreground mt-1">{m.descricao}</p>}
                          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                            {m.data_inicio && <span>Início: {format(new Date(m.data_inicio), 'dd/MM/yyyy')}</span>}
                            {m.valor && <span>Valor: R$ {m.valor.toLocaleString('pt-BR')}</span>}
                            {m.responsavel && <span>Resp: {m.responsavel}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent>
          <DialogHeader><DialogTitle>Transferir Ativo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nova Localização</Label>
              <Select value={transferForm.localizacao_id} onValueChange={v => setTransferForm(f => ({ ...f, localizacao_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.nome_local}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Motivo</Label><Textarea value={transferForm.motivo} onChange={e => setTransferForm(f => ({ ...f, motivo: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransfer(false)}>Cancelar</Button>
            <Button onClick={() => transferMutation.mutate()} disabled={transferMutation.isPending}>
              {transferMutation.isPending ? 'Transferindo...' : 'Confirmar Transferência'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog open={showMaintenance} onOpenChange={setShowMaintenance}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Manutenção</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={maintenanceForm.tipo_manutencao} onValueChange={v => setMaintenanceForm(f => ({ ...f, tipo_manutencao: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="corretiva">Corretiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Descrição</Label><Textarea value={maintenanceForm.descricao} onChange={e => setMaintenanceForm(f => ({ ...f, descricao: e.target.value }))} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Data Início</Label><Input type="date" value={maintenanceForm.data_inicio} onChange={e => setMaintenanceForm(f => ({ ...f, data_inicio: e.target.value }))} /></div>
              <div><Label>Data Fim</Label><Input type="date" value={maintenanceForm.data_fim} onChange={e => setMaintenanceForm(f => ({ ...f, data_fim: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={maintenanceForm.valor} onChange={e => setMaintenanceForm(f => ({ ...f, valor: e.target.value }))} /></div>
              <div><Label>Responsável</Label><Input value={maintenanceForm.responsavel} onChange={e => setMaintenanceForm(f => ({ ...f, responsavel: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={maintenanceForm.status} onValueChange={v => setMaintenanceForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberta">Aberta</SelectItem>
                  <SelectItem value="em_execucao">Em Execução</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMaintenance(false)}>Cancelar</Button>
            <Button onClick={() => maintenanceMutation.mutate()} disabled={maintenanceMutation.isPending}>
              {maintenanceMutation.isPending ? 'Salvando...' : 'Registrar Manutenção'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
