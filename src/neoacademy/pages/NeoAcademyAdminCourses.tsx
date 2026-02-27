import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Loader2, BookOpen, Plus, Edit, Trash2, Eye, EyeOff, Star, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function NeoAcademyAdminCourses() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-violet-400" />
            <h1 className="text-lg font-bold text-white">Gerenciar Cursos</h1>
          </div>
          <Button size="sm" className="bg-violet-500 hover:bg-violet-600 text-white gap-2">
            <Plus className="h-4 w-4" /> Novo Curso
          </Button>
        </div>
      </header>

      <div className="px-6 pt-6">
        <div className="space-y-3">
          {courses?.map((course: any) => (
            <div key={course.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#14141f] border border-white/5">
              {/* Thumbnail */}
              <div className="w-24 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-violet-900/40 to-fuchsia-900/40 shrink-0">
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-violet-400/50" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white truncate">{course.title}</h3>
                  {course.is_featured && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1">
                  {course.category && <span className="text-violet-400 uppercase font-bold text-[10px]">{course.category}</span>}
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.total_duration_minutes || 0}min</span>
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{course.total_lessons || 0} aulas</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{enrollmentCounts?.[course.id] || 0} alunos</span>
                </div>
              </div>

              {/* Actions */}
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
                <button className="p-2 rounded-lg text-zinc-600 hover:text-white hover:bg-white/5 transition" title="Editar">
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
    </div>
  );
}
