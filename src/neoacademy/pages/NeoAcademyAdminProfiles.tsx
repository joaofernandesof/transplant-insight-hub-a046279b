import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import {
  Loader2, Users, Plus, Trash2, BookOpen, Check, X,
  GraduationCap, Crown, UserCheck, Sparkles, Star, Shield,
  Pencil,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

const PROFILE_ICONS: Record<string, React.ReactNode> = {
  lead: <Users className="h-5 w-5" />,
  pre_formacao_360: <GraduationCap className="h-5 w-5" />,
  pre_brows_360: <Sparkles className="h-5 w-5" />,
  conecta_capilar: <Star className="h-5 w-5" />,
  licenciado: <Crown className="h-5 w-5" />,
  fellow: <Shield className="h-5 w-5" />,
};

const PROFILE_COLORS: Record<string, string> = {
  lead: '#6b7280',
  pre_formacao_360: '#3b82f6',
  pre_brows_360: '#a855f7',
  conecta_capilar: '#f59e0b',
  licenciado: '#10b981',
  fellow: '#ef4444',
};

interface Profile {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  is_active: boolean;
  order_index: number;
  account_id: string;
}

interface ProfileCourse {
  id: string;
  profile_id: string;
  course_id: string;
}

interface Course {
  id: string;
  title: string;
  category: string | null;
  is_published: boolean | null;
  thumbnail_url: string | null;
}

export default function NeoAcademyAdminProfiles({ embedded = false }: { embedded?: boolean }) {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileSlug, setNewProfileSlug] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  // Get account ID - try member lookup first, fallback to first account for admins
  const { data: accountId, isLoading: loadingAccount } = useQuery({
    queryKey: ['neoacademy-account-id', user?.authUserId],
    queryFn: async () => {
      if (!user?.authUserId) return null;
      // Try member lookup
      const { data: memberData } = await supabase
        .from('neoacademy_account_members')
        .select('account_id')
        .or(`user_id.eq.${user.authUserId},user_id.eq.${user.id}`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (memberData?.account_id) return memberData.account_id;
      
      // Fallback for admins: get first account
      if (user.isAdmin) {
        const { data: fallback } = await supabase
          .from('neoacademy_accounts')
          .select('id')
          .limit(1)
          .maybeSingle();
        if (fallback?.id) return fallback.id;
        
        // Ultimate fallback: query profiles directly without account filter
        const { data: anyProfile } = await supabase
          .from('neoacademy_student_profiles')
          .select('account_id')
          .limit(1)
          .maybeSingle();
        return anyProfile?.account_id || null;
      }
      return null;
    },
    enabled: !!user,
  });

  // Fetch profiles
  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['neoacademy-student-profiles', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoacademy_student_profiles')
        .select('*')
        .eq('account_id', accountId!)
        .order('order_index');
      if (error) throw error;
      return (data || []) as Profile[];
    },
    enabled: !!accountId,
  });

  // Fetch courses
  const { data: courses = [] } = useQuery({
    queryKey: ['neoacademy-all-courses', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoacademy_courses')
        .select('id, title, category, is_published, thumbnail_url')
        .eq('account_id', accountId!)
        .order('title');
      if (error) throw error;
      return (data || []) as Course[];
    },
    enabled: !!accountId,
  });

  // Fetch profile-course mappings
  const { data: profileCourses = [] } = useQuery({
    queryKey: ['neoacademy-profile-courses', accountId],
    queryFn: async () => {
      const profileIds = profiles.map(p => p.id);
      if (profileIds.length === 0) return [];
      const { data, error } = await supabase
        .from('neoacademy_profile_courses')
        .select('*')
        .in('profile_id', profileIds);
      if (error) throw error;
      return (data || []) as ProfileCourse[];
    },
    enabled: profiles.length > 0,
  });

  // Create profile
  const createProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('neoacademy_student_profiles')
        .insert({
          account_id: accountId!,
          name: newProfileName,
          slug: newProfileSlug || newProfileName.toLowerCase().replace(/\s+/g, '_'),
          description: newProfileDesc || null,
          color: PROFILE_COLORS[newProfileSlug] || '#3b82f6',
          order_index: profiles.length,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-student-profiles'] });
      setShowCreateDialog(false);
      setNewProfileName('');
      setNewProfileSlug('');
      setNewProfileDesc('');
      toast.success('Perfil criado!');
    },
    onError: (err: any) => {
      const msg = err?.message || '';
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('23505')) {
        toast.error('Já existe um perfil com esse slug/identificador. Use outro nome.');
      } else {
        toast.error('Erro ao criar perfil');
      }
    },
  });

  // Delete profile
  const deleteProfile = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('neoacademy_student_profiles')
        .delete()
        .eq('id', profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-student-profiles'] });
      setSelectedProfile(null);
      toast.success('Perfil removido!');
    },
    onError: () => toast.error('Erro ao remover perfil'),
  });

  // Toggle course in profile
  const toggleCourse = useMutation({
    mutationFn: async ({ profileId, courseId, enabled }: { profileId: string; courseId: string; enabled: boolean }) => {
      if (enabled) {
        const { error } = await supabase
          .from('neoacademy_profile_courses')
          .insert({ profile_id: profileId, course_id: courseId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('neoacademy_profile_courses')
          .delete()
          .eq('profile_id', profileId)
          .eq('course_id', courseId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-profile-courses'] });
    },
    onError: () => toast.error('Erro ao atualizar curso'),
  });

  // Update profile
  const updateProfile = useMutation({
    mutationFn: async (profile: Profile) => {
      const { error } = await supabase
        .from('neoacademy_student_profiles')
        .update({
          name: profile.name,
          description: profile.description,
          is_active: profile.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoacademy-student-profiles'] });
      setEditingProfile(null);
      toast.success('Perfil atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar'),
  });

  const getProfileCourseIds = (profileId: string) =>
    profileCourses.filter(pc => pc.profile_id === profileId).map(pc => pc.course_id);

  const activeProfile = profiles.find(p => p.id === selectedProfile);

  if (loadingProfiles) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'min-h-screen pb-12'}>
      {/* Header - only show when standalone */}
      {!embedded && (
        <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCheck className="h-5 w-5 text-blue-400" />
              <h1 className="text-lg font-bold text-white">Perfis de Alunos</h1>
            </div>
            <Button
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Perfil
            </Button>
          </div>
        </header>
      )}

      {embedded && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-400" />
              Perfis de Alunos
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Gerencie os perfis e defina quais cursos cada perfil pode acessar</p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Perfil
          </Button>
        </div>
      )}

      <div className="px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Profile list */}
          <div className="lg:col-span-4 space-y-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
              {profiles.length} perfis cadastrados
            </p>

            {profiles.map((profile) => {
              const courseCount = getProfileCourseIds(profile.id).length;
              const isSelected = selectedProfile === profile.id;

              return (
                <button
                  key={profile.id}
                  onClick={() => setSelectedProfile(profile.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20'
                      : 'bg-[#14141f] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${profile.color}20`, color: profile.color }}
                    >
                      {PROFILE_ICONS[profile.slug] || <Users className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{profile.name}</p>
                        {!profile.is_active && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Inativo</span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {courseCount} {courseCount === 1 ? 'curso liberado' : 'cursos liberados'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingProfile(profile); }}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {profile.description && (
                    <p className="text-[10px] text-zinc-600 mt-2 line-clamp-2">{profile.description}</p>
                  )}
                </button>
              );
            })}

            {profiles.length === 0 && (
              <div className="text-center py-12 text-zinc-600">
                <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum perfil criado</p>
                <p className="text-xs mt-1">Clique em "Novo Perfil" para começar</p>
              </div>
            )}
          </div>

          {/* Course assignment */}
          <div className="lg:col-span-8">
            {activeProfile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-400" />
                      Cursos de "{activeProfile.name}"
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">
                      Ative/desative os cursos disponíveis para este perfil
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Remover o perfil "${activeProfile.name}"?`)) {
                        deleteProfile.mutate(activeProfile.id);
                      }
                    }}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir Perfil
                  </Button>
                </div>

                <div className="space-y-2">
                  {courses.map((course) => {
                    const isEnabled = getProfileCourseIds(activeProfile.id).includes(course.id);

                    return (
                      <div
                        key={course.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          isEnabled
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-[#14141f] border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {course.thumbnail_url ? (
                            <img
                              src={course.thumbnail_url}
                              alt=""
                              className="h-10 w-14 rounded-lg object-cover shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-14 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                              <BookOpen className="h-4 w-4 text-zinc-600" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{course.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {course.category && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-500">
                                  {course.category}
                                </span>
                              )}
                              {!course.is_published && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                                  Rascunho
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {isEnabled && (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Liberado
                            </span>
                          )}
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) =>
                              toggleCourse.mutate({
                                profileId: activeProfile.id,
                                courseId: course.id,
                                enabled: checked,
                              })
                            }
                          />
                        </div>
                      </div>
                    );
                  })}

                  {courses.length === 0 && (
                    <div className="text-center py-12 text-zinc-600">
                      <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Nenhum curso cadastrado</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-zinc-600">
                <UserCheck className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">Selecione um perfil</p>
                <p className="text-xs mt-1">para gerenciar os cursos disponíveis</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#14141f] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Novo Perfil de Aluno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Nome do Perfil *</label>
              <Input
                value={newProfileName}
                onChange={(e) => {
                  setNewProfileName(e.target.value);
                  setNewProfileSlug(e.target.value.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
                }}
                placeholder="Ex: Aluno Pré Formação 360"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Slug (identificador)</label>
              <Input
                value={newProfileSlug}
                onChange={(e) => setNewProfileSlug(e.target.value)}
                placeholder="ex: pre_formacao_360"
                className="bg-white/5 border-white/10 text-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1.5 block">Descrição</label>
              <Input
                value={newProfileDesc}
                onChange={(e) => setNewProfileDesc(e.target.value)}
                placeholder="Descrição do perfil..."
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)} className="text-zinc-400">
              Cancelar
            </Button>
            <Button
              onClick={() => createProfile.mutate()}
              disabled={!newProfileName || createProfile.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Perfil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingProfile} onOpenChange={(o) => !o && setEditingProfile(null)}>
        <DialogContent className="bg-[#14141f] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          {editingProfile && (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Nome</label>
                <Input
                  value={editingProfile.name}
                  onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Descrição</label>
                <Input
                  value={editingProfile.description || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, description: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-400">Ativo</label>
                <Switch
                  checked={editingProfile.is_active}
                  onCheckedChange={(checked) => setEditingProfile({ ...editingProfile, is_active: checked })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingProfile(null)} className="text-zinc-400">
              Cancelar
            </Button>
            <Button
              onClick={() => editingProfile && updateProfile.mutate(editingProfile)}
              disabled={updateProfile.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
