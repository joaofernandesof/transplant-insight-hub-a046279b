import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, BookOpen, Search, Calendar, Tag, Trash2, Edit2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CATEGORIES = [
  { value: 'geral', label: 'Geral' },
  { value: 'atendimento', label: 'Atendimento' },
  { value: 'ocorrencia', label: 'Ocorrência' },
  { value: 'observacao', label: 'Observação' },
  { value: 'procedimento', label: 'Procedimento' },
  { value: 'administrativo', label: 'Administrativo' },
];

const CATEGORY_COLORS: Record<string, string> = {
  geral: 'bg-muted text-muted-foreground',
  atendimento: 'bg-primary/10 text-primary',
  ocorrencia: 'bg-destructive/10 text-destructive',
  observacao: 'bg-accent text-accent-foreground',
  procedimento: 'bg-secondary text-secondary-foreground',
  administrativo: 'bg-muted text-muted-foreground',
};

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  entry_date: string;
  created_at: string;
}

export default function NeoTeamDiaryPage() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('geral');
  const [tagsInput, setTagsInput] = useState('');
  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['neoteam-diary', filterCategory],
    queryFn: async () => {
      let query = supabase
        .from('neoteam_diary_entries')
        .select('*')
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DiaryEntry[];
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const payload = {
        title,
        content,
        category,
        tags,
        entry_date: entryDate,
        user_id: user!.id,
      };

      if (editingEntry) {
        const { error } = await supabase
          .from('neoteam_diary_entries')
          .update(payload)
          .eq('id', editingEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('neoteam_diary_entries')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoteam-diary'] });
      toast.success(editingEntry ? 'Registro atualizado!' : 'Registro criado!');
      resetForm();
      setDialogOpen(false);
    },
    onError: () => toast.error('Erro ao salvar registro.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('neoteam_diary_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoteam-diary'] });
      toast.success('Registro excluído.');
    },
    onError: () => toast.error('Erro ao excluir registro.'),
  });

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('geral');
    setTagsInput('');
    setEntryDate(format(new Date(), 'yyyy-MM-dd'));
    setEditingEntry(null);
  };

  const openEdit = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setCategory(entry.category);
    setTagsInput((entry.tags || []).join(', '));
    setEntryDate(entry.entry_date);
    setDialogOpen(true);
  };

  const filtered = entries.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.content.toLowerCase().includes(search.toLowerCase())
  );

  // Group by date
  const grouped = filtered.reduce<Record<string, DiaryEntry[]>>((acc, entry) => {
    const key = entry.entry_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <NeoTeamBreadcrumb />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Diário de Bordo
          </h1>
          <p className="text-sm text-muted-foreground">Registre atividades, observações e ocorrências do dia a dia.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Registro</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingEntry ? 'Editar Registro' : 'Novo Registro'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <Input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} required />
              <Textarea placeholder="Descreva a atividade, observação ou ocorrência..." value={content} onChange={e => setContent(e.target.value)} required rows={5} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Data</label>
                  <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tags (separadas por vírgula)</label>
                <Input placeholder="ex: urgente, sala 2" value={tagsInput} onChange={e => setTagsInput(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Salvando...' : editingEntry ? 'Atualizar' : 'Salvar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar registros..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Entries */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum registro encontrado.</p>
            <p className="text-xs mt-1">Clique em "Novo Registro" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground">
                  {format(parseISO(date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </h2>
              </div>
              <div className="space-y-3">
                {items.map(entry => (
                  <Card key={entry.id} className="group">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{entry.title}</CardTitle>
                          <Badge variant="outline" className={CATEGORY_COLORS[entry.category] || ''}>
                            {CATEGORIES.find(c => c.value === entry.category)?.label || entry.category}
                          </Badge>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(entry)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(entry.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{entry.content}</p>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-3 flex-wrap">
                          {entry.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                              <Tag className="h-3 w-3" />{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
