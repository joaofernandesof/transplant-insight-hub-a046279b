import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bot, Search, Plus, Edit, Eye, CheckCircle2, XCircle, MinusCircle, Filter, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface BotControl {
  id: string;
  code: string;
  seq: string;
  chip: string;
  funnel: string | null;
  bot_name: string;
  concatenated: string | null;
  message: string | null;
  media_url: string | null;
  script: string | null;
  button1: string | null;
  button2: string | null;
  template_approved: string | null;
  bot_updated: string | null;
  confirmed_joao: string | null;
  correct_variable: string | null;
  optin_initial: string | null;
  correct_chip_bot: string | null;
  correct_chip_template: string | null;
  correct_variables: string | null;
  tested_our_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const CHECKLIST_FIELDS = [
  { key: 'template_approved', label: 'Template Aprovado' },
  { key: 'bot_updated', label: 'Robô Atualizado' },
  { key: 'confirmed_joao', label: 'Confirmado João' },
  { key: 'correct_variable', label: 'Variável Correta?' },
  { key: 'optin_initial', label: 'Opt-in Inicial' },
  { key: 'correct_chip_bot', label: 'Chip Correto no Robô?' },
  { key: 'correct_chip_template', label: 'Chip Correto no Template?' },
  { key: 'correct_variables', label: 'Variáveis Corretas?' },
  { key: 'tested_our_number', label: 'Testado no Nosso Número?' },
] as const;

type ChecklistKey = typeof CHECKLIST_FIELDS[number]['key'];

const StatusIcon = ({ value }: { value: string | null }) => {
  if (!value || value === '') return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
  if (value === 'SIM') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (value === 'NÃO' || value === 'NÃO SE APLICA') return <XCircle className="h-4 w-4 text-amber-500" />;
  return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
};

const StatusBadge = ({ value }: { value: string | null }) => {
  if (!value || value === '') return <Badge variant="outline" className="text-xs">Pendente</Badge>;
  if (value === 'SIM') return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-xs">SIM</Badge>;
  if (value === 'NÃO') return <Badge variant="destructive" className="text-xs">NÃO</Badge>;
  if (value === 'NÃO SE APLICA') return <Badge variant="secondary" className="text-xs">N/A</Badge>;
  return <Badge variant="outline" className="text-xs">{value}</Badge>;
};

const FunnelBadge = ({ funnel }: { funnel: string | null }) => {
  if (!funnel) return null;
  const colors: Record<string, string> = {
    'IBRAMEC': 'bg-violet-500/10 text-violet-600 border-violet-200',
    'FORTALEZA': 'bg-sky-500/10 text-sky-600 border-sky-200',
    'JUAZEIRO': 'bg-amber-500/10 text-amber-600 border-amber-200',
    'SÃO PAULO': 'bg-rose-500/10 text-rose-600 border-rose-200',
    'PÓS-VENDAS': 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    'GERAL': 'bg-slate-500/10 text-slate-600 border-slate-200',
    'COBRANÇA AGENDAMENTO': 'bg-blue-500/10 text-blue-600 border-blue-200',
    'COBRANÇA FOTOS': 'bg-orange-500/10 text-orange-600 border-orange-200',
    'REAGENDAMENTO': 'bg-purple-500/10 text-purple-600 border-purple-200',
    'LISTA TRANSMISSÃO': 'bg-teal-500/10 text-teal-600 border-teal-200',
  };
  return <Badge className={`text-xs ${colors[funnel] || 'bg-muted text-muted-foreground'}`}>{funnel}</Badge>;
};

export default function BotControlPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [funnelFilter, setFunnelFilter] = useState('all');
  const [selectedBot, setSelectedBot] = useState<BotControl | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<BotControl>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newBot, setNewBot] = useState<Partial<BotControl>>({ chip: 'API' });

  const { data: bots = [], isLoading } = useQuery({
    queryKey: ['bot-controls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bot_controls')
        .select('*')
        .order('seq', { ascending: true });
      if (error) throw error;
      return (data || []) as BotControl[];
    },
  });

  const updateBot = useMutation({
    mutationFn: async (updates: Partial<BotControl> & { id: string }) => {
      const { id, ...rest } = updates;
      const { error } = await supabase
        .from('bot_controls')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-controls'] });
      toast.success('Bot atualizado!');
    },
  });

  const createBot = useMutation({
    mutationFn: async (bot: Partial<BotControl>) => {
      const { error } = await supabase.from('bot_controls').insert(bot as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-controls'] });
      setShowAddDialog(false);
      setNewBot({ chip: 'API' });
      toast.success('Bot criado!');
    },
  });

  const funnels = useMemo(() => [...new Set(bots.map(b => b.funnel).filter(Boolean))].sort() as string[], [bots]);

  const filtered = useMemo(() => {
    return bots.filter(b => {
      if (search) {
        const q = search.toLowerCase();
        if (!b.code.toLowerCase().includes(q) && !b.bot_name.toLowerCase().includes(q) && !(b.concatenated || '').toLowerCase().includes(q)) return false;
      }
      if (funnelFilter !== 'all' && b.funnel !== funnelFilter) return false;
      return true;
    });
  }, [bots, search, funnelFilter]);

  const stats = useMemo(() => {
    const total = bots.length;
    const withMessage = bots.filter(b => b.message && b.message.trim()).length;
    const fullyChecked = bots.filter(b => {
      return CHECKLIST_FIELDS.every(f => {
        const v = b[f.key as keyof BotControl] as string | null;
        return v === 'SIM' || v === 'NÃO SE APLICA';
      });
    }).length;
    return { total, withMessage, fullyChecked };
  }, [bots]);

  const openDetail = (bot: BotControl) => {
    setSelectedBot(bot);
    setEditMode(false);
    setEditData({});
  };

  const startEditing = () => {
    if (!selectedBot) return;
    setEditData({ ...selectedBot });
    setEditMode(true);
  };

  const saveEdit = () => {
    if (!editData.id) return;
    updateBot.mutate(editData as any);
    setEditMode(false);
    setSelectedBot(prev => prev ? { ...prev, ...editData } : null);
  };

  const toggleChecklist = (botId: string, field: ChecklistKey, currentValue: string | null) => {
    const cycle = ['', 'SIM', 'NÃO', 'NÃO SE APLICA'];
    const idx = cycle.indexOf(currentValue || '');
    const next = cycle[(idx + 1) % cycle.length];
    updateBot.mutate({ id: botId, [field]: next });
  };

  const checklistCompletion = (bot: BotControl) => {
    const done = CHECKLIST_FIELDS.filter(f => {
      const v = bot[f.key as keyof BotControl] as string | null;
      return v === 'SIM' || v === 'NÃO SE APLICA';
    }).length;
    return { done, total: CHECKLIST_FIELDS.length, pct: Math.round((done / CHECKLIST_FIELDS.length) * 100) };
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Controle de Bots
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerenciamento de robôs, scripts e templates do Kommo</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Novo Bot
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total de Bots</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.fullyChecked}</p>
          <p className="text-xs text-muted-foreground">Checklist Completo</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-sky-600">{stats.withMessage}</p>
          <p className="text-xs text-muted-foreground">Com Mensagem</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por código, nome ou concatenação..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={funnelFilter} onValueChange={setFunnelFilter}>
          <SelectTrigger className="w-48"><Filter className="h-4 w-4 mr-1" /><SelectValue placeholder="Funil" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Funis</SelectItem>
            {funnels.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Main Table */}
      <Card>
        <ScrollArea className="h-[calc(100vh-380px)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24 sticky top-0 bg-background">Código</TableHead>
                <TableHead className="w-24 sticky top-0 bg-background">Funil</TableHead>
                <TableHead className="sticky top-0 bg-background">Nome do Robô</TableHead>
                <TableHead className="w-20 sticky top-0 bg-background text-center">Mensagem</TableHead>
                <TableHead className="w-24 sticky top-0 bg-background text-center">Botão 1</TableHead>
                <TableHead className="w-24 sticky top-0 bg-background text-center">Botão 2</TableHead>
                <TableHead className="w-28 sticky top-0 bg-background text-center">Checklist</TableHead>
                {CHECKLIST_FIELDS.map(f => (
                  <TableHead key={f.key} className="w-8 sticky top-0 bg-background text-center px-1" title={f.label}>
                    <span className="text-[10px] leading-tight block">{f.label.split(' ').slice(0, 2).join(' ')}</span>
                  </TableHead>
                ))}
                <TableHead className="w-16 sticky top-0 bg-background" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={16} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={16} className="text-center py-8 text-muted-foreground">Nenhum bot encontrado</TableCell></TableRow>
              ) : filtered.map(bot => {
                const comp = checklistCompletion(bot);
                return (
                  <TableRow key={bot.id} className="hover:bg-muted/30 cursor-pointer group" onClick={() => openDetail(bot)}>
                    <TableCell className="font-mono text-xs font-semibold">{bot.code}</TableCell>
                    <TableCell><FunnelBadge funnel={bot.funnel} /></TableCell>
                    <TableCell className="text-sm font-medium max-w-[300px] truncate">{bot.bot_name}</TableCell>
                    <TableCell className="text-center">
                      {bot.message ? <MessageSquare className="h-4 w-4 text-emerald-500 mx-auto" /> : <MinusCircle className="h-4 w-4 text-muted-foreground mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {bot.button1 ? <Badge variant="outline" className="text-[10px]">{bot.button1}</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {bot.button2 ? <Badge variant="outline" className="text-[10px]">{bot.button2}</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${comp.pct}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{comp.done}/{comp.total}</span>
                      </div>
                    </TableCell>
                    {CHECKLIST_FIELDS.map(f => (
                      <TableCell key={f.key} className="text-center px-1" onClick={e => { e.stopPropagation(); toggleChecklist(bot.id, f.key, bot[f.key as keyof BotControl] as string | null); }}>
                        <StatusIcon value={bot[f.key as keyof BotControl] as string | null} />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Detail / Edit Dialog */}
      <Dialog open={!!selectedBot} onOpenChange={open => { if (!open) { setSelectedBot(null); setEditMode(false); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                {selectedBot?.code} — {selectedBot?.bot_name}
              </span>
              {!editMode && (
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Edit className="h-4 w-4 mr-1" /> Editar
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {selectedBot && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Details */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {editMode ? (
                      <>
                        <div>
                          <label className="text-xs text-muted-foreground">Código</label>
                          <Input value={editData.code || ''} onChange={e => setEditData(p => ({ ...p, code: e.target.value }))} className="mt-1 h-8 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Seq</label>
                          <Input value={editData.seq || ''} onChange={e => setEditData(p => ({ ...p, seq: e.target.value }))} className="mt-1 h-8 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Chip</label>
                          <Input value={editData.chip || ''} onChange={e => setEditData(p => ({ ...p, chip: e.target.value }))} className="mt-1 h-8 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Funil</label>
                          <Input value={editData.funnel || ''} onChange={e => setEditData(p => ({ ...p, funnel: e.target.value }))} className="mt-1 h-8 text-sm" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-muted-foreground">Nome do Robô</label>
                          <Input value={editData.bot_name || ''} onChange={e => setEditData(p => ({ ...p, bot_name: e.target.value }))} className="mt-1 h-8 text-sm" />
                        </div>
                         <div>
                           <label className="text-xs text-muted-foreground">URL de Mídia</label>
                           <Input value={editData.media_url || ''} onChange={e => setEditData(p => ({ ...p, media_url: e.target.value }))} className="mt-1 h-8 text-sm" />
                         </div>
                         <div>
                           <label className="text-xs text-muted-foreground">Botão 1</label>
                           <Input value={editData.button1 || ''} onChange={e => setEditData(p => ({ ...p, button1: e.target.value }))} className="mt-1 h-8 text-sm" />
                         </div>
                         <div>
                           <label className="text-xs text-muted-foreground">Botão 2</label>
                           <Input value={editData.button2 || ''} onChange={e => setEditData(p => ({ ...p, button2: e.target.value }))} className="mt-1 h-8 text-sm" />
                         </div>
                      </>
                    ) : (
                       <>
                         <div><p className="text-xs text-muted-foreground">Código</p><p className="text-sm font-mono font-semibold">{selectedBot.code}</p></div>
                         <div><p className="text-xs text-muted-foreground">Seq</p><p className="text-sm">{selectedBot.seq}</p></div>
                         <div><p className="text-xs text-muted-foreground">Chip</p><p className="text-sm">{selectedBot.chip}</p></div>
                         <div><p className="text-xs text-muted-foreground">Funil</p><FunnelBadge funnel={selectedBot.funnel} /></div>
                         <div><p className="text-xs text-muted-foreground">Botão 1</p><p className="text-sm">{selectedBot.button1 || '—'}</p></div>
                         <div><p className="text-xs text-muted-foreground">Botão 2</p><p className="text-sm">{selectedBot.button2 || '—'}</p></div>
                       </>
                    )}
                  </div>

                  <Separator />

                  {/* Concatenated */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Concatenação</p>
                    {editMode ? (
                      <Input value={editData.concatenated || ''} onChange={e => setEditData(p => ({ ...p, concatenated: e.target.value }))} className="text-sm" />
                    ) : (
                      <p className="text-sm bg-muted/50 p-2 rounded">{selectedBot.concatenated || '—'}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Mensagem</p>
                    {editMode ? (
                      <Textarea value={editData.message || ''} onChange={e => setEditData(p => ({ ...p, message: e.target.value }))} rows={6} className="text-sm" />
                    ) : (
                      <div className="text-sm bg-muted/50 p-3 rounded whitespace-pre-wrap max-h-48 overflow-auto">
                        {selectedBot.message || '—'}
                      </div>
                    )}
                  </div>

                  {/* Script */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Script Completo</p>
                    {editMode ? (
                      <Textarea value={editData.script || ''} onChange={e => setEditData(p => ({ ...p, script: e.target.value }))} rows={8} className="text-sm font-mono" placeholder="Cole aqui o script completo do bot..." />
                    ) : (
                      <div className="text-sm bg-muted/50 p-3 rounded whitespace-pre-wrap max-h-48 overflow-auto font-mono">
                        {selectedBot.script || 'Nenhum script cadastrado'}
                      </div>
                    )}
                  </div>

                  {/* Media */}
                  {(selectedBot.media_url || editMode) && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">URL de Mídia</p>
                      {!editMode && selectedBot.media_url && (
                        <a href={selectedBot.media_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                          {selectedBot.media_url}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Observações</p>
                    {editMode ? (
                      <Textarea value={editData.notes || ''} onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))} rows={3} className="text-sm" placeholder="Observações adicionais..." />
                    ) : (
                      <p className="text-sm text-muted-foreground">{selectedBot.notes || '—'}</p>
                    )}
                  </div>

                  {editMode && (
                    <div className="flex gap-2 pt-2">
                      <Button onClick={saveEdit} disabled={updateBot.isPending} size="sm">Salvar</Button>
                      <Button variant="outline" onClick={() => setEditMode(false)} size="sm">Cancelar</Button>
                    </div>
                  )}
                </div>

                {/* Right: Checklist Sidebar */}
                <div className="space-y-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Checklist de Verificação
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {CHECKLIST_FIELDS.map(f => {
                        const val = selectedBot[f.key as keyof BotControl] as string | null;
                        return (
                          <div key={f.key} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                            <span className="text-xs">{f.label}</span>
                            <button onClick={() => {
                              toggleChecklist(selectedBot.id, f.key, val);
                              setSelectedBot(prev => {
                                if (!prev) return null;
                                const cycle = ['', 'SIM', 'NÃO', 'NÃO SE APLICA'];
                                const idx = cycle.indexOf(val || '');
                                const next = cycle[(idx + 1) % cycle.length];
                                return { ...prev, [f.key]: next };
                              });
                            }}>
                              <StatusBadge value={val} />
                            </button>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Completion */}
                  {(() => {
                    const comp = checklistCompletion(selectedBot);
                    return (
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-3xl font-bold text-primary">{comp.pct}%</div>
                          <p className="text-xs text-muted-foreground">{comp.done} de {comp.total} verificações</p>
                          <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${comp.pct}%` }} />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Bot Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Novo Bot</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Código *</label>
                <Input value={newBot.code || ''} onChange={e => setNewBot(p => ({ ...p, code: e.target.value }))} placeholder="BOT XX" className="mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Seq *</label>
                <Input value={newBot.seq || ''} onChange={e => setNewBot(p => ({ ...p, seq: e.target.value }))} placeholder="BOT 0XX" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Chip</label>
                <Input value={newBot.chip || 'API'} onChange={e => setNewBot(p => ({ ...p, chip: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Funil</label>
                <Select value={newBot.funnel || ''} onValueChange={v => setNewBot(p => ({ ...p, funnel: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {funnels.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    <SelectItem value="OUTRO">OUTRO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Nome do Robô *</label>
              <Input value={newBot.bot_name || ''} onChange={e => setNewBot(p => ({ ...p, bot_name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Mensagem</label>
              <Textarea value={newBot.message || ''} onChange={e => setNewBot(p => ({ ...p, message: e.target.value }))} rows={4} className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">URL de Mídia</label>
              <Input value={newBot.media_url || ''} onChange={e => setNewBot(p => ({ ...p, media_url: e.target.value }))} className="mt-1" />
            </div>
            <Button onClick={() => {
              if (!newBot.code || !newBot.seq || !newBot.bot_name) { toast.error('Preencha os campos obrigatórios'); return; }
              createBot.mutate(newBot);
            }} disabled={createBot.isPending} className="w-full">
              Criar Bot
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
