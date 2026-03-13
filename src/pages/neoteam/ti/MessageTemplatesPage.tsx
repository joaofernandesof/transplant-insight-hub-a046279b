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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Search, Plus, Edit, Eye, CheckCircle2, XCircle, MinusCircle, Filter, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface MessageTemplate {
  id: string;
  code: string;
  seq: string;
  category: string | null;
  template_name: string;
  message_content: string | null;
  media_url: string | null;
  variables_used: string | null;
  notes: string | null;
  template_approved: string | null;
  content_reviewed: string | null;
  variables_correct: string | null;
  tested: string | null;
  approved_compliance: string | null;
  media_attached: string | null;
  published: string | null;
  created_at: string;
  updated_at: string;
}

const CHECKLIST_FIELDS = [
  { key: 'template_approved', label: 'Template Aprovado' },
  { key: 'content_reviewed', label: 'Conteúdo Revisado' },
  { key: 'variables_correct', label: 'Variáveis Corretas' },
  { key: 'tested', label: 'Testado' },
  { key: 'approved_compliance', label: 'Aprovado Compliance' },
  { key: 'media_attached', label: 'Mídia Anexada' },
  { key: 'published', label: 'Publicado' },
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

const CategoryBadge = ({ category }: { category: string | null }) => {
  if (!category) return null;
  const colors: Record<string, string> = {
    'CONFIRMAÇÃO': 'bg-violet-500/10 text-violet-600 border-violet-200',
    'LEMBRETE': 'bg-sky-500/10 text-sky-600 border-sky-200',
    'FOLLOW-UP': 'bg-amber-500/10 text-amber-600 border-amber-200',
    'BOAS-VINDAS': 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    'PÓS-VENDAS': 'bg-rose-500/10 text-rose-600 border-rose-200',
    'MARKETING': 'bg-pink-500/10 text-pink-600 border-pink-200',
    'GERAL': 'bg-slate-500/10 text-slate-600 border-slate-200',
  };
  return <Badge className={`text-xs ${colors[category] || 'bg-muted text-muted-foreground'}`}>{category}</Badge>;
};

export default function MessageTemplatesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<MessageTemplate>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<MessageTemplate>>({});

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['message-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('seq', { ascending: true });
      if (error) throw error;
      return (data || []) as MessageTemplate[];
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async (updates: Partial<MessageTemplate> & { id: string }) => {
      const { id, ...rest } = updates;
      const { error } = await supabase
        .from('message_templates')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      toast.success('Modelo atualizado!');
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (tpl: Partial<MessageTemplate>) => {
      const { error } = await supabase.from('message_templates').insert(tpl as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      setShowAddDialog(false);
      setNewTemplate({});
      toast.success('Modelo criado!');
    },
  });

  const categories = useMemo(() => [...new Set(templates.map(t => t.category).filter(Boolean))].sort() as string[], [templates]);

  const filtered = useMemo(() => {
    return templates.filter(t => {
      if (search) {
        const q = search.toLowerCase();
        if (!t.code.toLowerCase().includes(q) && !t.template_name.toLowerCase().includes(q) && !(t.message_content || '').toLowerCase().includes(q)) return false;
      }
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      return true;
    });
  }, [templates, search, categoryFilter]);

  const stats = useMemo(() => {
    const total = templates.length;
    const withMessage = templates.filter(t => t.message_content && t.message_content.trim()).length;
    const fullyChecked = templates.filter(t => {
      return CHECKLIST_FIELDS.every(f => {
        const v = t[f.key as keyof MessageTemplate] as string | null;
        return v === 'SIM' || v === 'NÃO SE APLICA';
      });
    }).length;
    return { total, withMessage, fullyChecked };
  }, [templates]);

  const openDetail = (tpl: MessageTemplate) => {
    setSelectedTemplate(tpl);
    setEditMode(false);
    setEditData({});
  };

  const startEditing = () => {
    if (!selectedTemplate) return;
    setEditData({ ...selectedTemplate });
    setEditMode(true);
  };

  const saveEdit = () => {
    if (!editData.id) return;
    updateTemplate.mutate(editData as any);
    setEditMode(false);
    setSelectedTemplate(prev => prev ? { ...prev, ...editData } : null);
  };

  const toggleChecklist = (id: string, field: ChecklistKey, currentValue: string | null) => {
    const cycle = ['', 'SIM', 'NÃO', 'NÃO SE APLICA'];
    const idx = cycle.indexOf(currentValue || '');
    const next = cycle[(idx + 1) % cycle.length];
    updateTemplate.mutate({ id, [field]: next });
  };

  const checklistCompletion = (tpl: MessageTemplate) => {
    const done = CHECKLIST_FIELDS.filter(f => {
      const v = tpl[f.key as keyof MessageTemplate] as string | null;
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
            <FileText className="h-6 w-6 text-primary" />
            Modelos de Mensagens
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerenciamento de templates e modelos de mensagens</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Novo Modelo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total de Modelos</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.fullyChecked}</p>
          <p className="text-xs text-muted-foreground">Checklist Completo</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-sky-600">{stats.withMessage}</p>
          <p className="text-xs text-muted-foreground">Com Conteúdo</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por código, nome ou conteúdo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48"><Filter className="h-4 w-4 mr-1" /><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                <TableHead className="w-28 sticky top-0 bg-background">Categoria</TableHead>
                <TableHead className="sticky top-0 bg-background">Nome do Modelo</TableHead>
                <TableHead className="w-20 sticky top-0 bg-background text-center">Conteúdo</TableHead>
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
                <TableRow><TableCell colSpan={12} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={12} className="text-center py-8 text-muted-foreground">Nenhum modelo encontrado</TableCell></TableRow>
              ) : filtered.map(tpl => {
                const comp = checklistCompletion(tpl);
                return (
                  <TableRow key={tpl.id} className="hover:bg-muted/30 cursor-pointer group" onClick={() => openDetail(tpl)}>
                    <TableCell className="font-mono text-xs font-semibold">{tpl.code}</TableCell>
                    <TableCell><CategoryBadge category={tpl.category} /></TableCell>
                    <TableCell className="text-sm font-medium max-w-[300px] truncate">{tpl.template_name}</TableCell>
                    <TableCell className="text-center">
                      {tpl.message_content ? <MessageSquare className="h-4 w-4 text-emerald-500 mx-auto" /> : <MinusCircle className="h-4 w-4 text-muted-foreground mx-auto" />}
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
                      <TableCell key={f.key} className="text-center px-1" onClick={e => { e.stopPropagation(); toggleChecklist(tpl.id, f.key, tpl[f.key as keyof MessageTemplate] as string | null); }}>
                        <StatusIcon value={tpl[f.key as keyof MessageTemplate] as string | null} />
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
      <Dialog open={!!selectedTemplate} onOpenChange={open => { if (!open) { setSelectedTemplate(null); setEditMode(false); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedTemplate?.code} — {selectedTemplate?.template_name}
              </span>
              {!editMode && (
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Edit className="h-4 w-4 mr-1" /> Editar
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {selectedTemplate && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Details */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                          <label className="text-xs text-muted-foreground">Categoria</label>
                          <Input value={editData.category || ''} onChange={e => setEditData(p => ({ ...p, category: e.target.value }))} className="mt-1 h-8 text-sm" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-muted-foreground">Nome do Modelo</label>
                          <Input value={editData.template_name || ''} onChange={e => setEditData(p => ({ ...p, template_name: e.target.value }))} className="mt-1 h-8 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">URL de Mídia</label>
                          <Input value={editData.media_url || ''} onChange={e => setEditData(p => ({ ...p, media_url: e.target.value }))} className="mt-1 h-8 text-sm" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div><p className="text-xs text-muted-foreground">Código</p><p className="text-sm font-mono font-semibold">{selectedTemplate.code}</p></div>
                        <div><p className="text-xs text-muted-foreground">Seq</p><p className="text-sm">{selectedTemplate.seq}</p></div>
                        <div><p className="text-xs text-muted-foreground">Categoria</p><CategoryBadge category={selectedTemplate.category} /></div>
                      </>
                    )}
                  </div>

                  <Separator />

                  {/* Variables */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Variáveis Utilizadas</p>
                    {editMode ? (
                      <Input value={editData.variables_used || ''} onChange={e => setEditData(p => ({ ...p, variables_used: e.target.value }))} className="text-sm" placeholder="Ex: nome, procedimento, data" />
                    ) : (
                      <p className="text-sm bg-muted/50 p-2 rounded">{selectedTemplate.variables_used || '—'}</p>
                    )}
                  </div>

                  {/* Message Content */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Conteúdo da Mensagem</p>
                    {editMode ? (
                      <Textarea value={editData.message_content || ''} onChange={e => setEditData(p => ({ ...p, message_content: e.target.value }))} rows={8} className="text-sm" />
                    ) : (
                      <div className="text-sm bg-muted/50 p-3 rounded whitespace-pre-wrap max-h-48 overflow-auto">
                        {selectedTemplate.message_content || '—'}
                      </div>
                    )}
                  </div>

                  {/* Media */}
                  {(selectedTemplate.media_url || editMode) && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">URL de Mídia</p>
                      {!editMode && selectedTemplate.media_url && (
                        <a href={selectedTemplate.media_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                          {selectedTemplate.media_url}
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
                      <p className="text-sm text-muted-foreground">{selectedTemplate.notes || '—'}</p>
                    )}
                  </div>

                  {editMode && (
                    <div className="flex gap-2 pt-2">
                      <Button onClick={saveEdit} disabled={updateTemplate.isPending} size="sm">Salvar</Button>
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
                        const val = selectedTemplate[f.key as keyof MessageTemplate] as string | null;
                        return (
                          <div key={f.key} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                            <span className="text-xs">{f.label}</span>
                            <button onClick={() => {
                              toggleChecklist(selectedTemplate.id, f.key, val);
                              setSelectedTemplate(prev => {
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

                  {(() => {
                    const comp = checklistCompletion(selectedTemplate);
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

      {/* Add Template Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Novo Modelo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Código *</label>
                <Input value={newTemplate.code || ''} onChange={e => setNewTemplate(p => ({ ...p, code: e.target.value }))} placeholder="MSG 01" className="mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Seq *</label>
                <Input value={newTemplate.seq || ''} onChange={e => setNewTemplate(p => ({ ...p, seq: e.target.value }))} placeholder="MSG 001" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Categoria</label>
              <Select value={newTemplate.category || ''} onValueChange={v => setNewTemplate(p => ({ ...p, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONFIRMAÇÃO">CONFIRMAÇÃO</SelectItem>
                  <SelectItem value="LEMBRETE">LEMBRETE</SelectItem>
                  <SelectItem value="FOLLOW-UP">FOLLOW-UP</SelectItem>
                  <SelectItem value="BOAS-VINDAS">BOAS-VINDAS</SelectItem>
                  <SelectItem value="PÓS-VENDAS">PÓS-VENDAS</SelectItem>
                  <SelectItem value="MARKETING">MARKETING</SelectItem>
                  <SelectItem value="GERAL">GERAL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Nome do Modelo *</label>
              <Input value={newTemplate.template_name || ''} onChange={e => setNewTemplate(p => ({ ...p, template_name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Conteúdo da Mensagem</label>
              <Textarea value={newTemplate.message_content || ''} onChange={e => setNewTemplate(p => ({ ...p, message_content: e.target.value }))} rows={4} className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Variáveis Utilizadas</label>
              <Input value={newTemplate.variables_used || ''} onChange={e => setNewTemplate(p => ({ ...p, variables_used: e.target.value }))} placeholder="nome, procedimento, data" className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">URL de Mídia</label>
              <Input value={newTemplate.media_url || ''} onChange={e => setNewTemplate(p => ({ ...p, media_url: e.target.value }))} className="mt-1" />
            </div>
            <Button onClick={() => {
              if (!newTemplate.code || !newTemplate.seq || !newTemplate.template_name) { toast.error('Preencha os campos obrigatórios'); return; }
              createTemplate.mutate(newTemplate);
            }} disabled={createTemplate.isPending} className="w-full">
              Criar Modelo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
