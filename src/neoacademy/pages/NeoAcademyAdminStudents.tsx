import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import {
  Loader2, Users, Search, GraduationCap, TrendingUp, Shield,
  ChevronUp, ChevronDown, MoreHorizontal, BookOpen, Trash2,
  Plus, UserCheck, Check, X, Filter, ArrowUpDown, UserPlus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ========== Profiles Sub-Panel (imported inline) ==========
import NeoAcademyAdminProfiles from './NeoAcademyAdminProfiles';

type SortField = 'name' | 'enrollments' | 'progress' | 'lastAccess';
type SortDir = 'asc' | 'desc';

interface StudentRow {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isActive: boolean;
  enrollments: { id: string; courseId: string; courseTitle: string; progress: number; completedAt: string | null; isActive: boolean }[];
  lastAccess: string | null;
  profileAssignments: Record<string, boolean>; // profileId -> isActive
}

interface StudentProfile {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  order_index: number | null;
}

export default function NeoAcademyAdminStudents() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [enrollStudentId, setEnrollStudentId] = useState<string | null>(null);
  const [activeMainTab, setActiveMainTab] = useState('students');
  const [newStudentDialogOpen, setNewStudentDialogOpen] = useState(false);
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentCourseId, setNewStudentCourseId] = useState<string>('');

  // Get account ID
  const { data: accountId } = useQuery({
    queryKey: ['neoacademy-account-id', user?.authUserId],
    queryFn: async () => {
      if (!user?.authUserId) return null;
      const { data } = await supabase
        .from('neoacademy_account_members')
        .select('account_id')
        .or(`user_id.eq.${user.authUserId},user_id.eq.${user.id}`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (data?.account_id) return data.account_id;
      if (user.isAdmin) {
        const { data: fallback } = await supabase.from('neoacademy_accounts').select('id').limit(1).maybeSingle();
        if (fallback?.id) return fallback.id;
        const { data: anyProfile } = await supabase.from('neoacademy_student_profiles').select('account_id').limit(1).maybeSingle();
        return anyProfile?.account_id || null;
      }
      return null;
    },
    enabled: !!user,
  });

  // Fetch all enrollments with course info
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['neoacademy-admin-students-full', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoacademy_enrollments')
        .select('*, course:neoacademy_courses(id, title, category)')
        .eq('account_id', accountId!)
        .order('enrolled_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountId,
  });

  // Fetch student profiles (tiers)
  const { data: studentProfiles = [] } = useQuery({
    queryKey: ['neoacademy-student-profiles', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoacademy_student_profiles')
        .select('id, name, slug, color, order_index')
        .eq('account_id', accountId!)
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return (data || []) as StudentProfile[];
    },
    enabled: !!accountId,
  });

  // Fetch user-profile assignments
  const { data: profileAssignmentsRaw = [] } = useQuery({
    queryKey: ['neoacademy-user-profile-assignments', accountId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('neoacademy_user_student_profiles')
        .select('user_id, profile_id, is_active')
        .eq('account_id', accountId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountId,
  });

  // Build profile assignments map: userId -> { profileId -> isActive }
  const profileAssignmentsMap = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {};
    profileAssignmentsRaw.forEach((a: any) => {
      if (!map[a.user_id]) map[a.user_id] = {};
      map[a.user_id][a.profile_id] = a.is_active;
    });
    return map;
  }, [profileAssignmentsRaw]);

  // Fetch profiles for all users
  const userIds = useMemo(() => {
    if (!enrollments) return [];
    return [...new Set(enrollments.map(e => e.user_id))];
  }, [enrollments]);

  const { data: profiles } = useQuery({
    queryKey: ['neoacademy-student-profiles-lookup', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      const batches: string[][] = [];
      for (let i = 0; i < userIds.length; i += 50) {
        batches.push(userIds.slice(i, i + 50));
      }
      const results = await Promise.all(
        batches.map(batch =>
          supabase.from('profiles').select('user_id, name, email, avatar_url, status').in('user_id', batch)
        )
      );
      const map: Record<string, { name: string; email: string; avatarUrl: string | null; status: string | null }> = {};
      results.forEach(r => {
        r.data?.forEach(p => {
          map[p.user_id] = { name: p.name, email: p.email, avatarUrl: p.avatar_url, status: p.status };
        });
      });
      return map;
    },
    enabled: userIds.length > 0,
  });

  // Fetch all courses for enrollment dialog
  const { data: allCourses = [] } = useQuery({
    queryKey: ['neoacademy-all-courses-list', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoacademy_courses')
        .select('id, title, category, is_published')
        .eq('account_id', accountId!)
        .order('title');
      if (error) throw error;
      return data || [];
    },
    enabled: !!accountId,
  });

  // Build student rows
  const students: StudentRow[] = useMemo(() => {
    if (!enrollments) return [];
    const map: Record<string, StudentRow> = {};
    enrollments.forEach((e: any) => {
      if (!map[e.user_id]) {
        const profile = profiles?.[e.user_id];
        map[e.user_id] = {
          userId: e.user_id,
          name: profile?.name || `Aluno ${e.user_id.slice(0, 8)}`,
          email: profile?.email || '',
          avatarUrl: profile?.avatarUrl || null,
          isActive: e.is_active !== false,
          enrollments: [],
          lastAccess: null,
          profileAssignments: profileAssignmentsMap[e.user_id] || {},
        };
      }
      map[e.user_id].enrollments.push({
        id: e.id,
        courseId: e.course_id,
        courseTitle: e.course?.title || 'Curso',
        progress: Number(e.progress_percent || 0),
        completedAt: e.completed_at,
        isActive: e.is_active !== false,
      });
      // Track last access
      const access = e.last_accessed_at || e.enrolled_at;
      if (access && (!map[e.user_id].lastAccess || access > map[e.user_id].lastAccess!)) {
        map[e.user_id].lastAccess = access;
      }
      // Mark active if any enrollment is active
      if (e.is_active !== false) {
        map[e.user_id].isActive = true;
      }
    });
    return Object.values(map);
  }, [enrollments, profiles, profileAssignmentsMap]);

  // Filter & sort
  const filtered = useMemo(() => {
    let result = students;

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }

    // Filter status
    if (filterStatus === 'active') {
      result = result.filter(s => s.isActive);
    } else if (filterStatus === 'inactive') {
      result = result.filter(s => !s.isActive);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'enrollments':
          cmp = a.enrollments.length - b.enrollments.length;
          break;
        case 'progress': {
          const avgA = a.enrollments.length ? a.enrollments.reduce((s, e) => s + e.progress, 0) / a.enrollments.length : 0;
          const avgB = b.enrollments.length ? b.enrollments.reduce((s, e) => s + e.progress, 0) / b.enrollments.length : 0;
          cmp = avgA - avgB;
          break;
        }
        case 'lastAccess':
          cmp = (a.lastAccess || '').localeCompare(b.lastAccess || '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [students, search, filterStatus, sortField, sortDir]);

  // Mutations
  const toggleEnrollment = useMutation({
    mutationFn: async ({ enrollmentId, isActive }: { enrollmentId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('neoacademy_enrollments')
        .update({ is_active: isActive })
        .eq('id', enrollmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-admin-students-full'] });
      toast.success('Acesso atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar acesso'),
  });

  const removeEnrollment = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from('neoacademy_enrollments')
        .delete()
        .eq('id', enrollmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-admin-students-full'] });
      toast.success('Matrícula removida!');
    },
    onError: () => toast.error('Erro ao remover matrícula'),
  });

  const addEnrollment = useMutation({
    mutationFn: async ({ userId, courseId }: { userId: string; courseId: string }) => {
      if (!accountId) throw new Error('No account');
      const { error } = await supabase
        .from('neoacademy_enrollments')
        .insert({
          user_id: userId,
          course_id: courseId,
          account_id: accountId,
          is_active: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-admin-students-full'] });
      toast.success('Aluno matriculado!');
      setEnrollDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message?.includes('duplicate') ? 'Aluno já matriculado neste curso' : 'Erro ao matricular');
    },
  });

  const toggleAllAccess = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('neoacademy_enrollments')
        .update({ is_active: isActive })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-admin-students-full'] });
      toast.success(isActive ? 'Todos os acessos liberados!' : 'Todos os acessos bloqueados!');
      setSelectedStudent(null);
    },
    onError: () => toast.error('Erro ao atualizar acessos'),
  });

  const addNewStudent = useMutation({
    mutationFn: async ({ email, courseId }: { email: string; courseId: string }) => {
      if (!accountId) throw new Error('No account');
      // Find user by email in profiles
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();
      if (profileErr) throw profileErr;
      if (!profile) throw new Error('Usuário não encontrado com este email. O aluno precisa ter uma conta criada primeiro.');
      
      // Check if already enrolled
      const { data: existing } = await supabase
        .from('neoacademy_enrollments')
        .select('id')
        .eq('user_id', profile.id)
        .eq('course_id', courseId)
        .maybeSingle();
      if (existing) throw new Error('Aluno já matriculado neste curso.');

      const { error } = await supabase
        .from('neoacademy_enrollments')
        .insert({
          user_id: profile.id,
          course_id: courseId,
          account_id: accountId,
          is_active: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-admin-students-full'] });
      toast.success('Aluno cadastrado e matriculado com sucesso!');
      setNewStudentDialogOpen(false);
      setNewStudentEmail('');
      setNewStudentCourseId('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao cadastrar aluno');
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-zinc-600" />;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-blue-400" /> : <ChevronDown className="h-3 w-3 text-blue-400" />;
  };

  // Stats
  const uniqueStudents = students.length;
  const totalEnrollments = enrollments?.length || 0;
  const activeStudents = students.filter(s => s.isActive).length;
  const avgProgress = totalEnrollments > 0
    ? Math.round(enrollments!.reduce((s, e: any) => s + Number(e.progress_percent || 0), 0) / totalEnrollments)
    : 0;

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
            <Users className="h-5 w-5 text-blue-400" />
            <h1 className="text-lg font-bold text-white">Gestão de Alunos</h1>
          </div>
          <Button
            size="sm"
            onClick={() => setNewStudentDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Novo Aluno
          </Button>
        </div>
      </header>

      <div className="px-6 pt-6">
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
          <TabsList className="bg-[#14141f] border border-white/5 mb-6">
            <TabsTrigger value="students" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 gap-2">
              <Users className="h-4 w-4" />
              Alunos ({uniqueStudents})
            </TabsTrigger>
            <TabsTrigger value="profiles" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 gap-2">
              <UserCheck className="h-4 w-4" />
              Perfis de Alunos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#14141f] border border-white/5">
                <Users className="h-5 w-5 text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-white">{uniqueStudents}</div>
                <div className="text-xs text-zinc-500">Alunos Únicos</div>
              </div>
              <div className="p-4 rounded-xl bg-[#14141f] border border-white/5">
                <GraduationCap className="h-5 w-5 text-emerald-400 mb-2" />
                <div className="text-2xl font-bold text-white">{totalEnrollments}</div>
                <div className="text-xs text-zinc-500">Matrículas</div>
              </div>
              <div className="p-4 rounded-xl bg-[#14141f] border border-white/5">
                <Shield className="h-5 w-5 text-sky-400 mb-2" />
                <div className="text-2xl font-bold text-white">{activeStudents}</div>
                <div className="text-xs text-zinc-500">Com Acesso Ativo</div>
              </div>
              <div className="p-4 rounded-xl bg-[#14141f] border border-white/5">
                <TrendingUp className="h-5 w-5 text-amber-400 mb-2" />
                <div className="text-2xl font-bold text-white">{avgProgress}%</div>
                <div className="text-xs text-zinc-500">Progresso Médio</div>
              </div>
            </div>

            {/* Search + Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome ou email..."
                  className="pl-10 bg-[#14141f] border-white/5 text-white"
                />
              </div>
              <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                <SelectTrigger className="w-[160px] bg-[#14141f] border-white/5 text-white">
                  <Filter className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Acesso Ativo</SelectItem>
                  <SelectItem value="inactive">Acesso Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#14141f] border-b border-white/5">
                      <th className="text-left px-4 py-3">
                        <button onClick={() => handleSort('name')} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition">
                          Aluno <SortIcon field="name" />
                        </button>
                      </th>
                      <th className="text-left px-4 py-3">
                        <button onClick={() => handleSort('enrollments')} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition">
                          Cursos <SortIcon field="enrollments" />
                        </button>
                      </th>
                      <th className="text-left px-4 py-3">
                        <button onClick={() => handleSort('progress')} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition">
                          Progresso <SortIcon field="progress" />
                        </button>
                      </th>
                      <th className="text-left px-4 py-3">
                        <button onClick={() => handleSort('lastAccess')} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition">
                          Último Acesso <SortIcon field="lastAccess" />
                        </button>
                      </th>
                      <th className="text-center px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((student) => {
                      const activeEnrollments = student.enrollments.filter(e => e.isActive).length;
                      const avgProg = student.enrollments.length
                        ? Math.round(student.enrollments.reduce((s, e) => s + e.progress, 0) / student.enrollments.length)
                        : 0;

                      return (
                        <tr key={student.userId} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                                {student.avatarUrl ? (
                                  <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  student.name.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">{student.name}</p>
                                <p className="text-[11px] text-zinc-500 truncate">{student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-white font-medium">{activeEnrollments}</span>
                              <span className="text-[11px] text-zinc-500">/ {student.enrollments.length}</span>
                              {activeEnrollments < student.enrollments.length && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-400 bg-amber-500/10">
                                  {student.enrollments.length - activeEnrollments} bloqueados
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400 transition-all"
                                  style={{ width: `${avgProg}%` }}
                                />
                              </div>
                              <span className="text-xs text-zinc-400">{avgProg}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-zinc-500">
                              {student.lastAccess
                                ? formatDistanceToNow(new Date(student.lastAccess), { addSuffix: true, locale: ptBR })
                                : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-500 hover:text-white hover:bg-white/5">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-white/10 text-white min-w-[200px]">
                                <DropdownMenuItem
                                  onClick={() => setSelectedStudent(student)}
                                  className="hover:bg-white/5 cursor-pointer gap-2"
                                >
                                  <BookOpen className="h-4 w-4" />
                                  Gerenciar Acessos
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => { setEnrollStudentId(student.userId); setEnrollDialogOpen(true); }}
                                  className="hover:bg-white/5 cursor-pointer gap-2"
                                >
                                  <Plus className="h-4 w-4" />
                                  Matricular em Curso
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem
                                  onClick={() => toggleAllAccess.mutate({ userId: student.userId, isActive: true })}
                                  className="hover:bg-white/5 cursor-pointer gap-2 text-emerald-400"
                                >
                                  <Check className="h-4 w-4" />
                                  Liberar Todos os Acessos
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => toggleAllAccess.mutate({ userId: student.userId, isActive: false })}
                                  className="hover:bg-white/5 cursor-pointer gap-2 text-red-400"
                                >
                                  <X className="h-4 w-4" />
                                  Bloquear Todos os Acessos
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-16 text-zinc-600">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhum aluno encontrado</p>
                </div>
              )}
            </div>

            <p className="text-xs text-zinc-600 text-right">
              Exibindo {filtered.length} de {students.length} alunos
            </p>
          </TabsContent>

          <TabsContent value="profiles">
            <NeoAcademyAdminProfiles embedded />
          </TabsContent>
        </Tabs>
      </div>

      {/* Student Access Management Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={(o) => !o && setSelectedStudent(null)}>
        <DialogContent className="bg-[#14141f] border-white/10 text-white max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              Gerenciar Acessos — {selectedStudent?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-3 py-2">
              <p className="text-xs text-zinc-500 mb-4">
                Ative ou desative o acesso a cada curso individualmente.
              </p>
              {selectedStudent.enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    enrollment.isActive
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{enrollment.courseTitle}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-zinc-500">{enrollment.progress}% progresso</span>
                      {enrollment.completedAt && (
                        <Badge className="text-[9px] bg-emerald-500/20 text-emerald-400 border-0">Concluído</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] font-medium ${enrollment.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {enrollment.isActive ? 'Ativo' : 'Bloqueado'}
                    </span>
                    <Switch
                      checked={enrollment.isActive}
                      onCheckedChange={(checked) =>
                        toggleEnrollment.mutate({ enrollmentId: enrollment.id, isActive: checked })
                      }
                    />
                  </div>
                </div>
              ))}

              <div className="flex gap-2 pt-4 border-t border-white/5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setEnrollStudentId(selectedStudent.userId); setEnrollDialogOpen(true); }}
                  className="text-blue-400 hover:bg-blue-500/10 gap-1.5 flex-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Matricular em Novo Curso
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enroll in Course Dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent className="bg-[#14141f] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Matricular em Curso</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2 max-h-[400px] overflow-y-auto">
            {allCourses.map((course) => {
              const alreadyEnrolled = enrollStudentId
                ? enrollments?.some(e => e.user_id === enrollStudentId && e.course_id === course.id)
                : false;

              return (
                <div
                  key={course.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    alreadyEnrolled ? 'bg-white/[0.02] border-white/5 opacity-50' : 'bg-[#14141f] border-white/5 hover:border-blue-500/20'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{course.title}</p>
                    {course.category && (
                      <span className="text-[10px] text-zinc-500">{course.category}</span>
                    )}
                  </div>
                  {alreadyEnrolled ? (
                    <Badge className="text-[9px] bg-white/5 text-zinc-500 border-0">Matriculado</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => enrollStudentId && addEnrollment.mutate({ userId: enrollStudentId, courseId: course.id })}
                      disabled={addEnrollment.isPending}
                      className="text-blue-400 hover:bg-blue-500/10 h-7"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Matricular
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* New Student Dialog */}
      <Dialog open={newStudentDialogOpen} onOpenChange={setNewStudentDialogOpen}>
        <DialogContent className="bg-[#14141f] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-400" />
              Cadastrar Novo Aluno
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newStudentEmail.trim()) { toast.error('Informe o email do aluno'); return; }
              if (!newStudentCourseId) { toast.error('Selecione um curso'); return; }
              addNewStudent.mutate({ email: newStudentEmail.trim(), courseId: newStudentCourseId });
            }}
            className="space-y-4 py-2"
          >
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Email do Aluno *</label>
              <Input
                type="email"
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
                placeholder="aluno@email.com"
                className="bg-[#0a0a0f] border-white/10 text-white"
                required
              />
              <p className="text-[10px] text-zinc-600 mt-1">O aluno precisa ter uma conta no sistema</p>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Matricular no Curso *</label>
              <Select value={newStudentCourseId} onValueChange={setNewStudentCourseId}>
                <SelectTrigger className="bg-[#0a0a0f] border-white/10 text-white">
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                  {allCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setNewStudentDialogOpen(false)} className="text-zinc-400">
                Cancelar
              </Button>
              <Button type="submit" disabled={addNewStudent.isPending} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                {addNewStudent.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Cadastrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
