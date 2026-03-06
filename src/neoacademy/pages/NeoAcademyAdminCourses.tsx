import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Loader2, BookOpen, Plus, Edit, Trash2, Eye, EyeOff, Star, Clock, Users, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface CourseFormData {
  title: string;
  description: string;
  short_description: string;
  category: string;
  thumbnail_url: string;
  banner_url: string;
  access_type: string;
  price: string;
  is_published: boolean;
  is_featured: boolean;
  total_lessons: string;
  total_duration_minutes: string;
}

const EMPTY_FORM: CourseFormData = {
  title: '',
  description: '',
  short_description: '',
  category: '',
  thumbnail_url: '',
  banner_url: '',
  access_type: 'free',
  price: '0',
  is_published: false,
  is_featured: false,
  total_lessons: '0',
  total_duration_minutes: '0',
};

export default function NeoAcademyAdminCourses() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [form, setForm] = useState<CourseFormData>(EMPTY_FORM);

  const { data: courses, isLoading } = useQuery({
    queryKey: ['neoacademy-admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoacademy_courses')
        .select('*')
        .order('order_index');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: enrollmentCounts } = useQuery({
    queryKey: ['neoacademy-enrollment-counts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('neoacademy_enrollments')
        .select('course_id');
      const counts: Record<string, number> = {};
      data?.forEach(e => { counts[e.course_id] = (counts[e.course_id] || 0) + 1; });
      return counts;
    },
  });

  const { data: memberAccount } = useQuery({
    queryKey: ['neoacademy-member-account', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('neoacademy_account_members')
        .select('account_id')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const saveCourse = useMutation({
    mutationFn: async (formData: CourseFormData) => {
      if (!user?.id || !memberAccount?.account_id) throw new Error('Missing data');

      const courseData = {
        title: formData.title,
        description: formData.description || null,
        short_description: formData.short_description || null,
        category: formData.category || null,
        thumbnail_url: formData.thumbnail_url || null,
        banner_url: formData.banner_url || null,
        access_type: formData.access_type || 'free',
        price: parseFloat(formData.price) || 0,
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        total_lessons: parseInt(formData.total_lessons) || 0,
        total_duration_minutes: parseInt(formData.total_duration_minutes) || 0,
      };

      if (editingCourse) {
        const { error } = await supabase
          .from('neoacademy_courses')
          .update(courseData)
          .eq('id', editingCourse.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('neoacademy_courses')
          .insert({
            ...courseData,
            account_id: memberAccount.account_id,
            created_by: user.id,
            order_index: (courses?.length || 0) + 1,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-admin-courses'] });
      toast.success(editingCourse ? 'Curso atualizado!' : 'Curso criado!');
      closeDialog();
    },
    onError: (e) => toast.error('Erro ao salvar: ' + e.message),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from('neoacademy_courses')
        .update({ is_published: published })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-admin-courses'] });
      toast.success('Status atualizado!');
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase
        .from('neoacademy_courses')
        .update({ is_featured: featured })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-admin-courses'] });
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('neoacademy_courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-admin-courses'] });
      toast.success('Curso excluído');
    },
  });

  const openNewCourse = () => {
    setEditingCourse(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditCourse = (course: any) => {
    setEditingCourse(course);
    setForm({
      title: course.title || '',
      description: course.description || '',
      short_description: course.short_description || '',
      category: course.category || '',
      thumbnail_url: course.thumbnail_url || '',
      banner_url: course.banner_url || '',
      access_type: course.access_type || 'free',
      price: String(course.price || 0),
      is_published: course.is_published || false,
      is_featured: course.is_featured || false,
      total_lessons: String(course.total_lessons || 0),
      total_duration_minutes: String(course.total_duration_minutes || 0),
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCourse(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }
    saveCourse.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-blue-400" />
            <h1 className="text-lg font-bold text-white">Gerenciar Cursos</h1>
          </div>
          <Button onClick={openNewCourse} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
            <Plus className="h-4 w-4" /> Novo Curso
          </Button>
        </div>
      </header>

      <div className="px-6 pt-6">
        {courses?.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 mb-4">Nenhum curso criado ainda.</p>
            <Button onClick={openNewCourse} className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
              <Plus className="h-4 w-4" /> Criar Primeiro Curso
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {courses?.map((course: any) => (
            <div key={course.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#14141f] border border-white/5">
              <div className="w-24 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-blue-900/40 to-sky-900/40 shrink-0">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-blue-400/50" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white truncate">{course.title}</h3>
                  {course.is_featured && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1">
                  {course.category && <span className="text-blue-400 uppercase font-bold text-[10px]">{course.category}</span>}
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.total_duration_minutes || 0}min</span>
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{course.total_lessons || 0} aulas</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{enrollmentCounts?.[course.id] || 0} alunos</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleFeatured.mutate({ id: course.id, featured: !course.is_featured })}
                  className={cn("p-2 rounded-lg transition", course.is_featured ? "text-amber-400 bg-amber-500/10" : "text-zinc-600 hover:text-amber-400 hover:bg-amber-500/10")}
                  title="Destaque"
                >
                  <Star className="h-4 w-4" />
                </button>
                <button
                  onClick={() => togglePublish.mutate({ id: course.id, published: !course.is_published })}
                  className={cn("p-2 rounded-lg transition", course.is_published ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-600 hover:text-emerald-400")}
                  title={course.is_published ? 'Despublicar' : 'Publicar'}
                >
                  {course.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => openEditCourse(course)}
                  className="p-2 rounded-lg text-zinc-600 hover:text-white hover:bg-white/5 transition"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Excluir este curso?')) deleteCourse.mutate(course.id);
                  }}
                  className="p-2 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#14141f] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingCourse ? 'Editar Curso' : 'Novo Curso'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            <div>
              <Label className="text-xs text-zinc-400">Título *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Nome do curso"
                className="bg-[#0a0a0f] border-white/10 text-white mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs text-zinc-400">Descrição Curta</Label>
              <Input
                value={form.short_description}
                onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))}
                placeholder="Resumo em uma frase"
                className="bg-[#0a0a0f] border-white/10 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-zinc-400">Descrição Completa</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descreva o conteúdo do curso..."
                className="bg-[#0a0a0f] border-white/10 text-white mt-1 min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-zinc-400">Categoria</Label>
                <Input
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="Ex: Marketing Digital"
                  className="bg-[#0a0a0f] border-white/10 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Tipo de Acesso</Label>
                <Select value={form.access_type} onValueChange={v => setForm(f => ({ ...f, access_type: v }))}>
                  <SelectTrigger className="bg-[#0a0a0f] border-white/10 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#14141f] border-white/10">
                    <SelectItem value="free">Gratuito</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="members_only">Somente Membros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.access_type === 'paid' && (
              <div>
                <Label className="text-xs text-zinc-400">Preço (R$)</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="bg-[#0a0a0f] border-white/10 text-white mt-1"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-zinc-400">URL da Thumbnail</Label>
                <Input
                  value={form.thumbnail_url}
                  onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))}
                  placeholder="https://..."
                  className="bg-[#0a0a0f] border-white/10 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-400">URL do Banner</Label>
                <Input
                  value={form.banner_url}
                  onChange={e => setForm(f => ({ ...f, banner_url: e.target.value }))}
                  placeholder="https://..."
                  className="bg-[#0a0a0f] border-white/10 text-white mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-zinc-400">Total de Aulas</Label>
                <Input
                  type="number"
                  value={form.total_lessons}
                  onChange={e => setForm(f => ({ ...f, total_lessons: e.target.value }))}
                  min="0"
                  className="bg-[#0a0a0f] border-white/10 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Duração Total (minutos)</Label>
                <Input
                  type="number"
                  value={form.total_duration_minutes}
                  onChange={e => setForm(f => ({ ...f, total_duration_minutes: e.target.value }))}
                  min="0"
                  className="bg-[#0a0a0f] border-white/10 text-white mt-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_published}
                  onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))}
                />
                <Label className="text-xs text-zinc-300">Publicado</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_featured}
                  onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))}
                />
                <Label className="text-xs text-zinc-300">Destaque</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={closeDialog} className="text-zinc-400 hover:text-white">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saveCourse.isPending}
                className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
              >
                {saveCourse.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingCourse ? 'Salvar Alterações' : 'Criar Curso'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
