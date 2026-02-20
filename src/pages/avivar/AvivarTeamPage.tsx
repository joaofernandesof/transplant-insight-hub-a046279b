/**
 * AvivarTeamPage - Gestão de Equipe/Colaboradores
 * Permite que o Admin Cliente gerencie seus colaboradores
 */

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import { toast } from 'sonner';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  Shield, 
  MoreVertical,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  Search,
  Camera,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import PermissionsMatrix from './PermissionsMatrix';

type TeamRole = 'owner' | 'admin' | 'coordenador' | 'sdr' | 'atendente';

interface TeamMember {
  id: string;
  user_id: string;
  role: TeamRole;
  is_active: boolean;
  created_at: string | null;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
}

const ROLE_INFO: Record<TeamRole, { label: string; color: string; description: string }> = {
  owner: { 
    label: 'Proprietário', 
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    description: 'Dono da conta'
  },
  admin: { 
    label: 'Administrador', 
    color: 'bg-red-500/10 text-red-600 border-red-500/20',
    description: 'Acesso total ao sistema'
  },
  coordenador: { 
    label: 'Coordenador', 
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    description: 'Tudo exceto configurações IA'
  },
  sdr: { 
    label: 'SDR', 
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    description: 'Leads, Follow-up, Agenda'
  },
  atendente: { 
    label: 'Atendente', 
    color: 'bg-green-500/10 text-green-600 border-green-500/20',
    description: 'Inbox, Chats, Contatos'
  },
};

export default function AvivarTeamPage() {
  const { user } = useUnifiedAuth();
  const { accountId } = useAvivarAccount();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'atendente' as TeamRole,
  });

  // Upload avatar function
  const uploadAvatar = async (file: File, memberId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.authUserId}/${memberId}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('team-avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('team-avatars')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Fetch team members with profile email
  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ['avivar-team-members', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      
      const { data, error } = await supabase
        .from('avivar_account_members')
        .select('id, user_id, role, is_active, created_at')
        .eq('account_id', accountId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch profiles for all member user_ids
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email, avatar_url, phone')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data.map(m => {
        const profile = profileMap.get(m.user_id);
        return {
          ...m,
          name: profile?.name || (m.user_id === user?.authUserId ? 'Eu (Proprietário)' : `Membro (${m.role})`),
          email: profile?.email || '',
          phone: profile?.phone || null,
          avatar_url: profile?.avatar_url || null,
        };
      }) as TeamMember[];
    },
    enabled: !!accountId,
  });

  // Add team member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (data: typeof formData & { avatarFile?: File | null }) => {
      if (!accountId) throw new Error('Conta não encontrada');

      let realUserId: string | null = null;

      // 1. Check if user already exists by email in profiles
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', data.email)
        .limit(1)
        .maybeSingle();

      if (existingProfile?.user_id) {
        realUserId = existingProfile.user_id;
      } else {
        // 2. Also check neohub_users
        const { data: existingNeohub } = await supabase
          .from('neohub_users')
          .select('user_id')
          .eq('email', data.email)
          .limit(1)
          .maybeSingle();

        if (existingNeohub?.user_id) {
          realUserId = existingNeohub.user_id;
        }
      }

      // 3. If user doesn't exist, create via edge function
      if (!realUserId) {
        const defaultPassword = `Avivar@${Date.now().toString(36)}`;
        const { data: createResult, error: createError } = await supabase.functions.invoke('admin-create-user', {
          body: {
            email: data.email,
            password: defaultPassword,
            full_name: data.name,
            phone: data.phone || null,
            allowed_portals: ['avivar'],
          },
        });

        if (createError || !createResult?.user_id) {
          throw new Error(createResult?.error || 'Erro ao criar usuário');
        }

        realUserId = createResult.user_id;

        // Also ensure profile exists
        await supabase.from('profiles').upsert({
          user_id: realUserId,
          name: data.name,
          email: data.email,
          phone: data.phone || null,
        }, { onConflict: 'user_id' });
      }

      // 4. Check if already a member of this account
      const { data: existingMember } = await supabase
        .from('avivar_account_members')
        .select('id')
        .eq('account_id', accountId)
        .eq('user_id', realUserId!)
        .maybeSingle();

      if (existingMember) {
        throw new Error('duplicate');
      }

      // 5. Insert into avivar_account_members with the real user_id
      const { error } = await supabase
        .from('avivar_account_members')
        .insert({
          account_id: accountId,
          user_id: realUserId!,
          role: data.role as any,
          is_active: true,
        });
      if (error) throw error;

      // 6. Upload avatar if provided
      if (data.avatarFile && realUserId) {
        const avatarUrl = await uploadAvatar(data.avatarFile, realUserId);
        if (avatarUrl) {
          await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('user_id', realUserId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-team-members'] });
      toast.success('Membro adicionado com sucesso!');
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Este membro já está na equipe');
      } else {
        toast.error(`Erro ao adicionar membro: ${error.message}`);
      }
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from('avivar_account_members')
        .update({ role: data.role as any })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-team-members'] });
      toast.success('Membro atualizado!');
      setIsEditDialogOpen(false);
      setSelectedMember(null);
    },
    onError: () => {
      toast.error('Erro ao atualizar membro');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('avivar_account_members')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['avivar-team-members'] });
      toast.success(isActive ? 'Membro reativado!' : 'Membro desativado!');
    },
    onError: () => {
      toast.error('Erro ao alterar status');
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('avivar_account_members')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-team-members'] });
      toast.success('Membro removido!');
      setIsDeleteDialogOpen(false);
      setSelectedMember(null);
    },
    onError: () => {
      toast.error('Erro ao remover membro');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', role: 'atendente' });
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  const handleEdit = (member: TeamMember) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (member: TeamMember) => {
    setSelectedMember(member);
    setIsDeleteDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeMembers = filteredMembers.filter(m => m.is_active);
  const inactiveMembers = filteredMembers.filter(m => !m.is_active);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <Users className="h-6 w-6 text-[hsl(var(--avivar-primary))]" />
            Equipe
          </h1>
          <p className="text-[hsl(var(--avivar-muted-foreground))]">
            Gerencie os membros da sua empresa
          </p>
        </div>
      </div>

      {/* Tabs: Usuários / Permissões */}
      <Tabs defaultValue="usuarios" className="space-y-6">
        <TabsList className="bg-[hsl(var(--avivar-muted))]">
          <TabsTrigger value="usuarios" className="data-[state=active]:bg-[hsl(var(--avivar-card))]">
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="data-[state=active]:bg-[hsl(var(--avivar-card))]">
            <Shield className="h-4 w-4 mr-2" />
            Permissões
          </TabsTrigger>
        </TabsList>

        {/* ====== ABA USUÁRIOS ====== */}
        <TabsContent value="usuarios" className="space-y-6">
          {/* Add Button */}
          <div className="flex justify-end">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]">
                  <UserPlus className="h-4 w-4 mr-2" />
                  + Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Adicione um novo membro à sua equipe
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={avatarPreview || undefined} />
                        <AvatarFallback className="bg-[hsl(var(--avivar-primary)/0.1)] text-[hsl(var(--avivar-primary))] text-xl">
                          {formData.name ? getInitials(formData.name) : <Camera className="h-6 w-6" />}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[hsl(var(--avivar-primary))] text-white shadow-lg hover:bg-[hsl(var(--avivar-accent))] transition-colors"
                      >
                        <Upload className="h-3 w-3" />
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e)}
                      className="hidden"
                    />
                    <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                      Clique para adicionar foto
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="João Silva"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="joao@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone (opcional)</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Função</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: TeamRole) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_INFO).map(([key, info]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex flex-col">
                              <span>{info.label}</span>
                              <span className="text-xs text-muted-foreground">{info.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => addMemberMutation.mutate({ ...formData, avatarFile })}
                    disabled={!formData.name || !formData.email || addMemberMutation.isPending || isUploading}
                    className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
                  >
                    {isUploading ? 'Enviando foto...' : addMemberMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[hsl(var(--avivar-primary)/0.1)]">
                    <Users className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
                      {teamMembers.length}
                    </p>
                    <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Total de membros</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
                      {activeMembers.length}
                    </p>
                    <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
                      {teamMembers.filter(m => !m.is_active).length}
                    </p>
                    <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
            <Input
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]"
            />
          </div>

          {/* Team Members List */}
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardHeader>
              <CardTitle className="text-lg text-[hsl(var(--avivar-foreground))]">
                Colaboradores Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-[hsl(var(--avivar-muted-foreground))]">
                  Carregando...
                </div>
              ) : activeMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-[hsl(var(--avivar-muted-foreground))] mb-3" />
                  <p className="text-[hsl(var(--avivar-muted-foreground))]">
                    Nenhum colaborador encontrado
                  </p>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                    Adicione seu primeiro colaborador
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))] hover:bg-[hsl(var(--avivar-primary)/0.05)] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="bg-[hsl(var(--avivar-primary)/0.1)] text-[hsl(var(--avivar-primary))]">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                            {member.name}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                            {member.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {member.email}
                              </span>
                            )}
                            {member.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {member.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className={ROLE_INFO[member.role].color}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          {ROLE_INFO[member.role].label}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(member)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => toggleActiveMutation.mutate({ id: member.id, isActive: false })}
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Desativar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(member)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inactive Members */}
          {inactiveMembers.length > 0 && (
            <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] opacity-75">
              <CardHeader>
                <CardTitle className="text-lg text-[hsl(var(--avivar-foreground))]">
                  Colaboradores Inativos
                </CardTitle>
                <CardDescription>
                  Colaboradores que foram desativados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inactiveMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-background))]"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 grayscale">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="bg-gray-200 text-gray-500">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-[hsl(var(--avivar-muted-foreground))]">
                            {member.name}
                          </p>
                          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActiveMutation.mutate({ id: member.id, isActive: true })}
                      >
                        Reativar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ====== ABA PERMISSÕES ====== */}
        <TabsContent value="permissoes">
          <PermissionsMatrix />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formData.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select
                value={formData.role}
                onValueChange={(value: TeamRole) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => selectedMember && updateMemberMutation.mutate({
                id: selectedMember.id,
                data: formData
              })}
              disabled={updateMemberMutation.isPending}
              className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
            >
              {updateMemberMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover colaborador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O colaborador{' '}
              <strong>{selectedMember?.name}</strong> será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedMember && deleteMemberMutation.mutate(selectedMember.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMemberMutation.isPending ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
