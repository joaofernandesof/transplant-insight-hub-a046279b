import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import {
  ArrowLeft, BookOpen, Plus, Edit, Trash2, Eye, EyeOff, Users, GripVertical,
  ChevronDown, ChevronRight, Save, X, FileText, Download, Image, Video,
  UserPlus, UserMinus, Search, Loader2, Clock, FolderOpen, UserCheck, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ====================== TYPES ======================
interface ModuleForm { title: string; description: string; thumbnail_url: string; is_published: boolean; }
interface LessonForm {
  title: string; description: string; video_url: string; thumbnail_url: string;
  content: string; is_published: boolean; is_preview: boolean;
  video_duration_seconds: string; attachments: { name: string; url: string; type: string }[];
}
interface CourseEditForm {
  title: string; description: string; short_description: string; category: string;
  thumbnail_url: string; banner_url: string; access_type: string; price: string;
  is_published: boolean; is_featured: boolean; total_lessons: string; total_duration_minutes: string;
}

const EMPTY_MODULE: ModuleForm = { title: '', description: '', thumbnail_url: '', is_published: true };
const EMPTY_LESSON: LessonForm = {
  title: '', description: '', video_url: '', thumbnail_url: '', content: '',
  is_published: true, is_preview: false, video_duration_seconds: '0', attachments: [],
};

export default function NeoAcademyAdminCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState('content');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Dialog states
  const [moduleDialog, setModuleDialog] = useState(false);
  const [lessonDialog, setLessonDialog] = useState(false);
  const [courseEditDialog, setCourseEditDialog] = useState(false);
  const [studentDialog, setStudentDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [moduleForm, setModuleForm] = useState<ModuleForm>(EMPTY_MODULE);
  const [lessonForm, setLessonForm] = useState<LessonForm>(EMPTY_LESSON);
  const [lessonModuleId, setLessonModuleId] = useState('');
  const [courseForm, setCourseForm] = useState<CourseEditForm | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [addStudentEmail, setAddStudentEmail] = useState('');

  // ====================== QUERIES ======================
  const { data: memberAccount } = useQuery({
    queryKey: ['neoacademy-member-account', user?.id, user?.authUserId],
    queryFn: async () => {
      if (!user) return null;
      const { data: d1 } = await supabase.from('neoacademy_account_members').select('account_id').eq('user_id', user.authUserId).single();
      if (d1) return d1;
      const { data: d2 } = await supabase.from('neoacademy_account_members').select('account_id').eq('user_id', user.id).single();
      if (d2) return d2;
      // Fallback for admins
      if (user.isAdmin) {
        const { data: fallback } = await supabase.from('neoacademy_accounts').select('id').limit(1).single();
        return fallback ? { account_id: fallback.id } : null;
      }
      return null;
    },
    enabled: !!user?.id,
  });

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['admin-course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('neoacademy_courses').select('*').eq('id', courseId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: modules } = useQuery({
    queryKey: ['admin-modules', courseId],
    queryFn: async () => {
      const { data } = await supabase.from('neoacademy_modules').select('*').eq('course_id', courseId!).order('order_index');
      return data || [];
    },
    enabled: !!courseId,
  });

  const { data: lessons } = useQuery({
    queryKey: ['admin-lessons', courseId],
    queryFn: async () => {
      const { data } = await supabase.from('neoacademy_lessons').select('*').eq('course_id', courseId!).order('order_index');
      return data || [];
    },
    enabled: !!courseId,
  });

  const { data: enrollments } = useQuery({
    queryKey: ['admin-enrollments', courseId],
    queryFn: async () => {
      const { data } = await supabase.from('neoacademy_enrollments').select('*').eq('course_id', courseId!);
      return data || [];
    },
    enabled: !!courseId,
  });

  const { data: profiles } = useQuery({
    queryKey: ['admin-enrollment-profiles', enrollments?.map(e => e.user_id)],
    queryFn: async () => {
      if (!enrollments?.length) return [];
      const userIds = enrollments.map(e => e.user_id);
      const { data } = await supabase.from('profiles').select('id, name, email, avatar_url').in('id', userIds);
      return data || [];
    },
    enabled: !!enrollments?.length,
  });

  const accountId = memberAccount?.account_id;

  // ====================== MUTATIONS ======================
  const saveModule = useMutation({
    mutationFn: async (form: ModuleForm) => {
      if (!accountId || !courseId) throw new Error('Missing data');
      const payload = { title: form.title, description: form.description || null, thumbnail_url: (form as any).thumbnail_url || null, is_published: form.is_published };
      if (editingModule) {
        const { error } = await supabase.from('neoacademy_modules').update(payload).eq('id', editingModule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('neoacademy_modules').insert({
          ...payload, account_id: accountId, course_id: courseId, order_index: (modules?.length || 0) + 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-modules', courseId] }); toast.success('Módulo salvo!'); setModuleDialog(false); },
    onError: (e) => toast.error(e.message),
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('neoacademy_modules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-modules', courseId] }); toast.success('Módulo excluído'); },
  });

  const saveLesson = useMutation({
    mutationFn: async (form: LessonForm) => {
      if (!accountId || !courseId || !lessonModuleId) throw new Error('Missing data');
      const moduleLessons = lessons?.filter(l => l.module_id === lessonModuleId) || [];
      const payload = {
        title: form.title, description: form.description || null, video_url: form.video_url || null,
        thumbnail_url: form.thumbnail_url || null, content: form.content || null,
        is_published: form.is_published, is_preview: form.is_preview,
        video_duration_seconds: parseInt(form.video_duration_seconds) || null,
        attachments: form.attachments.length > 0 ? form.attachments : null,
      };
      if (editingLesson) {
        const { error } = await supabase.from('neoacademy_lessons').update(payload).eq('id', editingLesson.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('neoacademy_lessons').insert({
          ...payload, account_id: accountId, course_id: courseId, module_id: lessonModuleId,
          order_index: moduleLessons.length + 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-lessons', courseId] }); toast.success('Aula salva!'); setLessonDialog(false); },
    onError: (e) => toast.error(e.message),
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('neoacademy_lessons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-lessons', courseId] }); toast.success('Aula excluída'); },
  });

  const saveCourseEdit = useMutation({
    mutationFn: async (form: CourseEditForm) => {
      const { error } = await supabase.from('neoacademy_courses').update({
        title: form.title, description: form.description || null, short_description: form.short_description || null,
        category: form.category || null, thumbnail_url: form.thumbnail_url || null, banner_url: form.banner_url || null,
        access_type: form.access_type, price: parseFloat(form.price) || 0,
        is_published: form.is_published, is_featured: form.is_featured,
        total_lessons: parseInt(form.total_lessons) || 0, total_duration_minutes: parseInt(form.total_duration_minutes) || 0,
      }).eq('id', courseId!);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-course', courseId] }); toast.success('Curso atualizado!'); setCourseEditDialog(false); },
    onError: (e) => toast.error(e.message),
  });

  const removeEnrollment = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase.from('neoacademy_enrollments').delete().eq('id', enrollmentId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-enrollments', courseId] }); toast.success('Aluno removido'); },
  });

  const addStudentManual = useMutation({
    mutationFn: async (email: string) => {
      if (!accountId || !courseId) throw new Error('Missing');
      // Find user by email in profiles
      const { data: profile, error: pErr } = await supabase.from('profiles').select('id').eq('email', email.trim()).single();
      if (pErr || !profile) throw new Error('Usuário não encontrado com esse email');
      // Check if already enrolled
      const { data: existing } = await supabase.from('neoacademy_enrollments').select('id').eq('course_id', courseId).eq('user_id', profile.id).single();
      if (existing) throw new Error('Aluno já matriculado');
      const { error } = await supabase.from('neoacademy_enrollments').insert({ account_id: accountId, course_id: courseId, user_id: profile.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-enrollments', courseId] }); toast.success('Aluno adicionado!'); setAddStudentEmail(''); },
    onError: (e) => toast.error(e.message),
  });

  // ====================== HELPERS ======================
  const toggleModule = (id: string) => {
    setExpandedModules(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const openNewModule = () => { setEditingModule(null); setModuleForm(EMPTY_MODULE); setModuleDialog(true); };
  const openEditModule = (m: any) => {
    setEditingModule(m);
    setModuleForm({ title: m.title || '', description: m.description || '', thumbnail_url: m.thumbnail_url || '', is_published: m.is_published ?? true });
    setModuleDialog(true);
  };

  const openNewLesson = (moduleId: string) => { setEditingLesson(null); setLessonModuleId(moduleId); setLessonForm(EMPTY_LESSON); setLessonDialog(true); };
  const openEditLesson = (l: any) => {
    setEditingLesson(l); setLessonModuleId(l.module_id);
    const att = Array.isArray(l.attachments) ? l.attachments : [];
    setLessonForm({
      title: l.title || '', description: l.description || '', video_url: l.video_url || '',
      thumbnail_url: l.thumbnail_url || '', content: l.content || '',
      is_published: l.is_published ?? true, is_preview: l.is_preview ?? false,
      video_duration_seconds: String(l.video_duration_seconds || 0),
      attachments: att as any,
    });
    setLessonDialog(true);
  };

  const openCourseEdit = () => {
    if (!course) return;
    setCourseForm({
      title: course.title || '', description: course.description || '', short_description: course.short_description || '',
      category: course.category || '', thumbnail_url: course.thumbnail_url || '', banner_url: course.banner_url || '',
      access_type: course.access_type || 'free', price: String(course.price || 0),
      is_published: course.is_published || false, is_featured: course.is_featured || false,
      total_lessons: String(course.total_lessons || 0), total_duration_minutes: String(course.total_duration_minutes || 0),
    });
    setCourseEditDialog(true);
  };

  const addAttachment = () => {
    setLessonForm(f => ({ ...f, attachments: [...f.attachments, { name: '', url: '', type: 'pdf' }] }));
  };
  const removeAttachment = (i: number) => {
    setLessonForm(f => ({ ...f, attachments: f.attachments.filter((_, idx) => idx !== i) }));
  };
  const updateAttachment = (i: number, field: string, value: string) => {
    setLessonForm(f => ({
      ...f, attachments: f.attachments.map((a, idx) => idx === i ? { ...a, [field]: value } : a),
    }));
  };

  const filteredEnrollments = enrollments?.filter(e => {
    if (!studentSearch) return true;
    const profile = profiles?.find(p => p.id === e.user_id);
    const search = studentSearch.toLowerCase();
    return (profile?.name?.toLowerCase().includes(search) || profile?.email?.toLowerCase().includes(search));
  });

  if (courseLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div>;
  if (!course) return <div className="text-center py-16 text-zinc-500">Curso não encontrado</div>;

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/neoacademy/admin/courses')} className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              {course.thumbnail_url && <img src={course.thumbnail_url} className="w-10 h-7 rounded object-cover" />}
              <div>
                <h1 className="text-sm font-bold text-white">{course.title}</h1>
                <p className="text-[10px] text-zinc-500">{course.category} • {enrollments?.length || 0} alunos</p>
              </div>
            </div>
          </div>
          <Button onClick={openCourseEdit} size="sm" variant="outline" className="border-white/10 text-zinc-300 hover:text-white gap-2">
            <Edit className="h-3.5 w-3.5" /> Editar Curso
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#14141f] border border-white/5">
            <TabsTrigger value="content" className="text-xs data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <FolderOpen className="h-3.5 w-3.5 mr-1.5" /> Conteúdo
            </TabsTrigger>
            <TabsTrigger value="students" className="text-xs data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
              <Users className="h-3.5 w-3.5 mr-1.5" /> Alunos ({enrollments?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* =============== CONTENT TAB =============== */}
          <TabsContent value="content" className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs text-zinc-500">{modules?.length || 0} módulos • {lessons?.length || 0} aulas</p>
              <Button onClick={openNewModule} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white gap-2 text-xs">
                <Plus className="h-3.5 w-3.5" /> Novo Módulo
              </Button>
            </div>

            {modules?.map((mod: any, mi: number) => {
              const modLessons = lessons?.filter((l: any) => l.module_id === mod.id) || [];
              const isExpanded = expandedModules.has(mod.id);
              return (
                <div key={mod.id} className="rounded-xl border border-white/5 bg-[#14141f] overflow-hidden">
                  {/* Module header */}
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02]" onClick={() => toggleModule(mod.id)}>
                    <GripVertical className="h-4 w-4 text-zinc-700 shrink-0" />
                    {mod.thumbnail_url ? (
                      <img src={mod.thumbnail_url} className="w-10 h-7 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-7 rounded bg-gradient-to-br from-blue-900/30 to-sky-900/30 flex items-center justify-center shrink-0">
                        <FolderOpen className="h-3.5 w-3.5 text-blue-400/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-blue-400 font-bold">MÓDULO {mi + 1}</span>
                        {!mod.is_published && <span className="text-[9px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">Rascunho</span>}
                      </div>
                      <h3 className="text-sm font-semibold text-white truncate">{mod.title}</h3>
                    </div>
                    <span className="text-[10px] text-zinc-500 mr-2">{modLessons.length} aulas</span>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEditModule(mod)} className="p-1.5 rounded hover:bg-white/5 text-zinc-600 hover:text-white"><Edit className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { if (confirm('Excluir módulo e suas aulas?')) deleteModule.mutate(mod.id); }} className="p-1.5 rounded hover:bg-rose-500/10 text-zinc-600 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-zinc-500" /> : <ChevronRight className="h-4 w-4 text-zinc-500" />}
                  </div>

                  {/* Lessons */}
                  {isExpanded && (
                    <div className="border-t border-white/5">
                      {modLessons.map((lesson: any, li: number) => (
                        <div key={lesson.id} className="flex items-center gap-3 px-6 py-2.5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]">
                          <span className="text-[10px] text-zinc-600 w-5 text-right shrink-0">{li + 1}</span>
                          {lesson.thumbnail_url ? (
                            <img src={lesson.thumbnail_url} className="w-12 h-8 rounded object-cover shrink-0" />
                          ) : (
                            <div className="w-12 h-8 rounded bg-zinc-800/50 flex items-center justify-center shrink-0">
                              <Video className="h-3.5 w-3.5 text-zinc-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{lesson.title}</p>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                              {lesson.video_duration_seconds && <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{Math.round(lesson.video_duration_seconds / 60)}min</span>}
                              {lesson.is_preview && <span className="text-amber-400">Preview</span>}
                              {!lesson.is_published && <span className="text-zinc-600">Rascunho</span>}
                              {lesson.attachments && Array.isArray(lesson.attachments) && lesson.attachments.length > 0 && (
                                <span className="flex items-center gap-0.5 text-emerald-400"><FileText className="h-2.5 w-2.5" />{lesson.attachments.length} materiais</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => openEditLesson(lesson)} className="p-1.5 rounded hover:bg-white/5 text-zinc-600 hover:text-white"><Edit className="h-3.5 w-3.5" /></button>
                            <button onClick={() => { if (confirm('Excluir aula?')) deleteLesson.mutate(lesson.id); }} className="p-1.5 rounded hover:bg-rose-500/10 text-zinc-600 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      ))}
                      <div className="px-6 py-2">
                        <button onClick={() => openNewLesson(mod.id)} className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition">
                          <Plus className="h-3 w-3" /> Adicionar Aula
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>

          {/* =============== STUDENTS TAB =============== */}
          <TabsContent value="students" className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <Input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Buscar aluno..." className="bg-[#14141f] border-white/10 text-white pl-9 text-xs h-9" />
              </div>
              <Button onClick={() => setStudentDialog(true)} size="sm" className="bg-blue-500 hover:bg-blue-600 text-white gap-2 text-xs">
                <UserPlus className="h-3.5 w-3.5" /> Adicionar Aluno
              </Button>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#14141f] overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_150px_100px_100px_60px] gap-3 px-4 py-2 border-b border-white/5 text-[10px] text-zinc-500 uppercase font-bold">
                <span>Aluno</span><span>Matrícula</span><span>Progresso</span><span>Último acesso</span><span></span>
              </div>
              {filteredEnrollments?.length === 0 && (
                <p className="text-center py-8 text-xs text-zinc-500">Nenhum aluno encontrado</p>
              )}
              {filteredEnrollments?.map((enrollment: any) => {
                const profile = profiles?.find(p => p.id === enrollment.user_id);
                return (
                  <div key={enrollment.id} className="grid grid-cols-[1fr_150px_100px_100px_60px] gap-3 items-center px-4 py-2.5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {profile?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{profile?.name || 'Sem nome'}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{profile?.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400">{new Date(enrollment.enrolled_at).toLocaleDateString('pt-BR')}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${enrollment.progress_percent || 0}%` }} />
                      </div>
                      <span className="text-[10px] text-zinc-400">{enrollment.progress_percent || 0}%</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">{enrollment.last_accessed_at ? new Date(enrollment.last_accessed_at).toLocaleDateString('pt-BR') : '-'}</span>
                    <button onClick={() => { if (confirm('Remover aluno deste curso?')) removeEnrollment.mutate(enrollment.id); }} className="p-1.5 rounded hover:bg-rose-500/10 text-zinc-600 hover:text-rose-400 justify-self-center"><UserMinus className="h-3.5 w-3.5" /></button>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* =============== MODULE DIALOG =============== */}
      <Dialog open={moduleDialog} onOpenChange={setModuleDialog}>
        <DialogContent className="bg-[#14141f] border-white/10 text-white max-w-lg">
          <DialogHeader><DialogTitle>{editingModule ? 'Editar Módulo' : 'Novo Módulo'}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); if (!moduleForm.title.trim()) { toast.error('Título obrigatório'); return; } saveModule.mutate(moduleForm); }} className="space-y-4 mt-2">
            <div><Label className="text-xs text-zinc-400">Título *</Label><Input value={moduleForm.title} onChange={e => setModuleForm(f => ({ ...f, title: e.target.value }))} className="bg-[#0a0a0f] border-white/10 text-white mt-1" required /></div>
            <div><Label className="text-xs text-zinc-400">Descrição</Label><Textarea value={moduleForm.description} onChange={e => setModuleForm(f => ({ ...f, description: e.target.value }))} className="bg-[#0a0a0f] border-white/10 text-white mt-1" /></div>
            <div><Label className="text-xs text-zinc-400">URL da Capa</Label><Input value={moduleForm.thumbnail_url} onChange={e => setModuleForm(f => ({ ...f, thumbnail_url: e.target.value }))} placeholder="https://..." className="bg-[#0a0a0f] border-white/10 text-white mt-1" /></div>
            <div className="flex items-center gap-2"><Switch checked={moduleForm.is_published} onCheckedChange={v => setModuleForm(f => ({ ...f, is_published: v }))} /><Label className="text-xs text-zinc-300">Publicado</Label></div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setModuleDialog(false)} className="text-zinc-400">Cancelar</Button>
              <Button type="submit" disabled={saveModule.isPending} className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
                {saveModule.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* =============== LESSON DIALOG =============== */}
      <Dialog open={lessonDialog} onOpenChange={setLessonDialog}>
        <DialogContent className="bg-[#14141f] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingLesson ? 'Editar Aula' : 'Nova Aula'}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); if (!lessonForm.title.trim()) { toast.error('Título obrigatório'); return; } saveLesson.mutate(lessonForm); }} className="space-y-4 mt-2">
            <div><Label className="text-xs text-zinc-400">Título *</Label><Input value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))} className="bg-[#0a0a0f] border-white/10 text-white mt-1" required /></div>
            <div><Label className="text-xs text-zinc-400">Descrição</Label><Textarea value={lessonForm.description} onChange={e => setLessonForm(f => ({ ...f, description: e.target.value }))} className="bg-[#0a0a0f] border-white/10 text-white mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs text-zinc-400">URL do Vídeo</Label><Input value={lessonForm.video_url} onChange={e => setLessonForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/..." className="bg-[#0a0a0f] border-white/10 text-white mt-1" /></div>
              <div><Label className="text-xs text-zinc-400">Duração (segundos)</Label><Input type="number" value={lessonForm.video_duration_seconds} onChange={e => setLessonForm(f => ({ ...f, video_duration_seconds: e.target.value }))} className="bg-[#0a0a0f] border-white/10 text-white mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs text-zinc-400">URL da Capa</Label><Input value={lessonForm.thumbnail_url} onChange={e => setLessonForm(f => ({ ...f, thumbnail_url: e.target.value }))} placeholder="https://..." className="bg-[#0a0a0f] border-white/10 text-white mt-1" /></div>
              <div className="flex items-center gap-4 pt-6">
                <div className="flex items-center gap-2"><Switch checked={lessonForm.is_published} onCheckedChange={v => setLessonForm(f => ({ ...f, is_published: v }))} /><Label className="text-xs text-zinc-300">Publicada</Label></div>
                <div className="flex items-center gap-2"><Switch checked={lessonForm.is_preview} onCheckedChange={v => setLessonForm(f => ({ ...f, is_preview: v }))} /><Label className="text-xs text-zinc-300">Preview</Label></div>
              </div>
            </div>
            <div><Label className="text-xs text-zinc-400">Conteúdo / Notas da Aula</Label><Textarea value={lessonForm.content} onChange={e => setLessonForm(f => ({ ...f, content: e.target.value }))} className="bg-[#0a0a0f] border-white/10 text-white mt-1 min-h-[80px]" placeholder="Texto complementar, links, etc." /></div>

            {/* Attachments / Materials */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-400 flex items-center gap-1.5"><FileText className="h-3 w-3" /> Materiais da Aula</Label>
                <button type="button" onClick={addAttachment} className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"><Plus className="h-3 w-3" /> Adicionar</button>
              </div>
              {lessonForm.attachments.map((att, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 items-end">
                  <div><Label className="text-[10px] text-zinc-500">Nome</Label><Input value={att.name} onChange={e => updateAttachment(i, 'name', e.target.value)} placeholder="Ex: Apostila.pdf" className="bg-[#0a0a0f] border-white/10 text-white text-xs h-8" /></div>
                  <div><Label className="text-[10px] text-zinc-500">URL</Label><Input value={att.url} onChange={e => updateAttachment(i, 'url', e.target.value)} placeholder="https://..." className="bg-[#0a0a0f] border-white/10 text-white text-xs h-8" /></div>
                  <div>
                    <Label className="text-[10px] text-zinc-500">Tipo</Label>
                    <Select value={att.type} onValueChange={v => updateAttachment(i, 'type', v)}>
                      <SelectTrigger className="bg-[#0a0a0f] border-white/10 text-white text-xs h-8"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#14141f] border-white/10">
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="doc">DOC</SelectItem>
                        <SelectItem value="image">Imagem</SelectItem>
                        <SelectItem value="video">Vídeo</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <button type="button" onClick={() => removeAttachment(i)} className="p-1.5 rounded hover:bg-rose-500/10 text-zinc-600 hover:text-rose-400 self-end"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              {lessonForm.attachments.length === 0 && <p className="text-[10px] text-zinc-600 italic">Nenhum material adicionado</p>}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setLessonDialog(false)} className="text-zinc-400">Cancelar</Button>
              <Button type="submit" disabled={saveLesson.isPending} className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
                {saveLesson.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar Aula
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* =============== COURSE EDIT DIALOG =============== */}
      <Dialog open={courseEditDialog} onOpenChange={setCourseEditDialog}>
        <DialogContent className="bg-[#14141f] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Curso</DialogTitle></DialogHeader>
          {courseForm && (
            <form onSubmit={e => { e.preventDefault(); saveCourseEdit.mutate(courseForm); }} className="space-y-4 mt-2">
              <div><Label className="text-xs text-zinc-400">Título *</Label><Input value={courseForm.title} onChange={e => setCourseForm(f => f ? { ...f, title: e.target.value } : f)} className="bg-[#0a0a0f] border-white/10 text-white mt-1" required /></div>
              <div><Label className="text-xs text-zinc-400">Descrição Curta</Label><Input value={courseForm.short_description} onChange={e => setCourseForm(f => f ? { ...f, short_description: e.target.value } : f)} className="bg-[#0a0a0f] border-white/10 text-white mt-1" /></div>
              <div><Label className="text-xs text-zinc-400">Descrição Completa</Label><Textarea value={courseForm.description} onChange={e => setCourseForm(f => f ? { ...f, description: e.target.value } : f)} className="bg-[#0a0a0f] border-white/10 text-white mt-1 min-h-[80px]" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs text-zinc-400">Categoria</Label><Input value={courseForm.category} onChange={e => setCourseForm(f => f ? { ...f, category: e.target.value } : f)} className="bg-[#0a0a0f] border-white/10 text-white mt-1" /></div>
                <div>
                  <Label className="text-xs text-zinc-400">Tipo de Acesso</Label>
                  <Select value={courseForm.access_type} onValueChange={v => setCourseForm(f => f ? { ...f, access_type: v } : f)}>
                    <SelectTrigger className="bg-[#0a0a0f] border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#14141f] border-white/10">
                      <SelectItem value="free">Gratuito</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="members_only">Somente Membros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {courseForm.access_type === 'paid' && (
                <div><Label className="text-xs text-zinc-400">Preço (R$)</Label><Input type="number" value={courseForm.price} onChange={e => setCourseForm(f => f ? { ...f, price: e.target.value } : f)} className="bg-[#0a0a0f] border-white/10 text-white mt-1" /></div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs text-zinc-400">URL da Capa</Label><Input value={courseForm.thumbnail_url} onChange={e => setCourseForm(f => f ? { ...f, thumbnail_url: e.target.value } : f)} className="bg-[#0a0a0f] border-white/10 text-white mt-1" /></div>
                <div><Label className="text-xs text-zinc-400">URL do Banner</Label><Input value={courseForm.banner_url} onChange={e => setCourseForm(f => f ? { ...f, banner_url: e.target.value } : f)} className="bg-[#0a0a0f] border-white/10 text-white mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs text-zinc-400">Total de Aulas</Label><Input type="number" value={courseForm.total_lessons} onChange={e => setCourseForm(f => f ? { ...f, total_lessons: e.target.value } : f)} className="bg-[#0a0a0f] border-white/10 text-white mt-1" /></div>
                <div><Label className="text-xs text-zinc-400">Duração (minutos)</Label><Input type="number" value={courseForm.total_duration_minutes} onChange={e => setCourseForm(f => f ? { ...f, total_duration_minutes: e.target.value } : f)} className="bg-[#0a0a0f] border-white/10 text-white mt-1" /></div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2"><Switch checked={courseForm.is_published} onCheckedChange={v => setCourseForm(f => f ? { ...f, is_published: v } : f)} /><Label className="text-xs text-zinc-300">Publicado</Label></div>
                <div className="flex items-center gap-2"><Switch checked={courseForm.is_featured} onCheckedChange={v => setCourseForm(f => f ? { ...f, is_featured: v } : f)} /><Label className="text-xs text-zinc-300">Destaque</Label></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setCourseEditDialog(false)} className="text-zinc-400">Cancelar</Button>
                <Button type="submit" disabled={saveCourseEdit.isPending} className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
                  {saveCourseEdit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* =============== ADD STUDENT DIALOG =============== */}
      <Dialog open={studentDialog} onOpenChange={setStudentDialog}>
        <DialogContent className="bg-[#14141f] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>Adicionar Aluno</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); if (!addStudentEmail.trim()) return; addStudentManual.mutate(addStudentEmail); }} className="space-y-4 mt-2">
            <div><Label className="text-xs text-zinc-400">Email do aluno</Label><Input value={addStudentEmail} onChange={e => setAddStudentEmail(e.target.value)} placeholder="aluno@email.com" type="email" className="bg-[#0a0a0f] border-white/10 text-white mt-1" required /></div>
            <p className="text-[10px] text-zinc-500">O aluno precisa ter uma conta na plataforma.</p>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setStudentDialog(false)} className="text-zinc-400">Cancelar</Button>
              <Button type="submit" disabled={addStudentManual.isPending} className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
                {addStudentManual.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Adicionar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
