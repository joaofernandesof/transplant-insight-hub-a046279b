import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useModulePermissions, ACCESS_PROFILES as HOOK_ACCESS_PROFILES } from '@/hooks/useModulePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Settings, 
  Eye,
  EyeOff,
  Users,
  Sliders,
  Save,
  Loader2,
  Shield,
  UserCheck,
  UserX,
  Crown,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Building2,
  GraduationCap,
  Heart,
  TrendingUp,
  Filter,
  Info,
  Grid3X3,
  UserPlus,
  CheckSquare,
  Power,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PORTAL_MODULES, PORTAL_NAMES, Portal } from '@/neohub/lib/permissions';
import { UserEditModal } from './admin/components/UserEditModal';
import { AddUserDialog } from './admin/components/AddUserDialog';

interface PageVisibility {
  university: boolean;
  regularization: boolean;
  materials: boolean;
  marketing: boolean;
  store: boolean;
  financial: boolean;
  mentorship: boolean;
  systems: boolean;
  career: boolean;
  hotleads: boolean;
  community: boolean;
}

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  full_name?: string;
  email: string;
  clinic_name: string | null;
  city: string | null;
  address_city?: string | null;
  state: string | null;
  address_state?: string | null;
  status: string;
  tier: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  is_active?: boolean;
  allowed_portals?: string[];
  crm?: string | null;
  rqe?: string | null;
}

type AppRole = 'super_administrador' | 'administrador' | 'gerente' | 'coordenador' | 'supervisor' | 'operador' | 'visualizador' | 'externo';

interface UserRole {
  user_id: string;
  role: AppRole;
}

type SortField = 'name' | 'email' | 'clinic_name' | 'created_at' | 'role';
type SortOrder = 'asc' | 'desc';

// Permission profiles (new RBAC hierarchy)
const ACCESS_PROFILES: { id: AppRole; name: string; icon: any; color: string }[] = [
  { id: 'super_administrador', name: 'Super Administrador', icon: Crown, color: 'text-amber-600 bg-amber-100' },
  { id: 'administrador', name: 'Administrador', icon: Shield, color: 'text-blue-600 bg-blue-100' },
  { id: 'gerente', name: 'Gerente', icon: Building2, color: 'text-green-600 bg-green-100' },
  { id: 'coordenador', name: 'Coordenador', icon: Users, color: 'text-purple-600 bg-purple-100' },
  { id: 'supervisor', name: 'Supervisor', icon: UserCheck, color: 'text-cyan-600 bg-cyan-100' },
  { id: 'operador', name: 'Operador', icon: Settings, color: 'text-slate-600 bg-slate-100' },
  { id: 'visualizador', name: 'Visualizador', icon: Eye, color: 'text-gray-600 bg-gray-100' },
  { id: 'externo', name: 'Externo', icon: UserX, color: 'text-rose-600 bg-rose-100' },
];

const pageLabels: Record<keyof PageVisibility, string> = {
  university: 'Academia ByNeofolic',
  regularization: 'Regularização da Clínica',
  materials: 'Central de Materiais',
  marketing: 'Central de Marketing',
  store: 'Loja Neo-Spa',
  financial: 'Gestão Financeira',
  mentorship: 'Mentoria & Suporte',
  systems: 'Sistemas & Ferramentas',
  career: 'Plano de Carreira',
  hotleads: 'HotLeads',
  community: 'Comunidade'
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // User management state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  
  // Edit user dialog state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    clinic_name: '',
    city: '',
    state: '',
    phone: '',
  });
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  
  // Bulk selection state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  // Page visibility state
  const [pageVisibility, setPageVisibility] = useState<PageVisibility>({
    university: true,
    regularization: true,
    materials: true,
    marketing: true,
    store: true,
    financial: true,
    mentorship: true,
    systems: true,
    career: true,
    hotleads: true,
    community: true
  });

  // Permission matrix - persisted in database
  const { 
    permissions: dbPermissions, 
    isLoading: permissionsLoading, 
    getPermissionMatrix, 
    updatePermission: updateDbPermission,
    saveAllPermissions,
    isSaving: permissionsSaving 
  } = useModulePermissions();
  
  const modulePermissions = getPermissionMatrix();
  const [permissionFilter, setPermissionFilter] = useState<string>('all');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchSettings();
    fetchUsers();
  }, [isAdmin]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('key', 'page_visibility')
        .maybeSingle();

      if (error) throw error;
      
      if (data?.value && typeof data.value === 'object') {
        setPageVisibility(data.value as unknown as PageVisibility);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch from both tables to get complete user data
      const [profilesRes, neohubUsersRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('name'),
        supabase.from('neohub_users').select('id, user_id, full_name, email, phone, clinic_name, address_city, address_state, avatar_url, is_active, allowed_portals, tier, crm, rqe, created_at'),
        supabase.from('user_roles').select('*')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      // Merge data from both tables, prioritizing neohub_users for newer fields
      const mergedUsers = (profilesRes.data || []).map(profile => {
        const neohubUser = neohubUsersRes.data?.find(nu => nu.user_id === profile.user_id);
        return {
          ...profile,
          full_name: neohubUser?.full_name || profile.name,
          address_city: neohubUser?.address_city || profile.city,
          address_state: neohubUser?.address_state || profile.state,
          is_active: neohubUser?.is_active ?? true,
          allowed_portals: neohubUser?.allowed_portals || [],
          crm: neohubUser?.crm,
          rqe: neohubUser?.rqe,
        };
      });

      setUsers(mergedUsers);
      setUserRoles(rolesRes.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const getUserRole = (userId: string): AppRole => {
    return (userRoles.find(r => r.user_id === userId)?.role as AppRole) || 'operador';
  };

  const getRoleMeta = (role: AppRole) => {
    return ACCESS_PROFILES.find(p => p.id === role) || ACCESS_PROFILES[5]; // default to operador
  };

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(u => {
        const displayName = (u.full_name || u.name || '').toLowerCase();
        return (
          displayName.includes(search) ||
          u.email.toLowerCase().includes(search) ||
          (u.clinic_name?.toLowerCase().includes(search) ?? false)
        );
      });
    }
    
    // Filter by role
    if (roleFilter !== 'all') {
      result = result.filter(u => getUserRole(u.user_id) === roleFilter);
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal: string | Date;
      let bVal: string | Date;
      
      switch (sortField) {
        case 'name':
          aVal = (a.full_name || a.name || '').toLowerCase();
          bVal = (b.full_name || b.name || '').toLowerCase();
          break;
        case 'role':
          aVal = getUserRole(a.user_id);
          bVal = getUserRole(b.user_id);
          break;
        case 'created_at':
          aVal = new Date(a.created_at);
          bVal = new Date(b.created_at);
          break;
        default:
          aVal = (a[sortField] ?? '').toLowerCase();
          bVal = (b[sortField] ?? '').toLowerCase();
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [users, searchTerm, sortField, sortOrder, roleFilter, userRoles]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleVisibilityChange = (key: keyof PageVisibility) => {
    setPageVisibility(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveVisibility = async () => {
    setIsSaving(true);
    try {
      const valueToSave = JSON.parse(JSON.stringify(pageVisibility));
      const { error } = await supabase
        .from('admin_settings')
        .update({ 
          value: valueToSave,
          updated_by: user?.id
        })
        .eq('key', 'page_visibility');

      if (error) throw error;
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUserRole = async (userId: string, currentRole: AppRole) => {
    // No longer toggle — use the dropdown to pick a specific role
  };

  const openEditDialog = (userProfile: UserProfile) => {
    setEditingUser(userProfile);
    setEditForm({
      name: userProfile.name || '',
      email: userProfile.email || '',
      clinic_name: userProfile.clinic_name || '',
      city: userProfile.city || '',
      state: userProfile.state || '',
      phone: userProfile.phone || '',
    });
  };

  const saveUserEdit = async () => {
    if (!editingUser) return;
    
    setIsSavingUser(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          clinic_name: editForm.clinic_name || null,
          city: editForm.city || null,
          state: editForm.state || null,
          phone: editForm.phone || null,
        })
        .eq('user_id', editingUser.user_id);

      if (error) throw error;
      
      setUsers(prev => prev.map(u => 
        u.user_id === editingUser.user_id 
          ? { ...u, ...editForm }
          : u
      ));
      
      setEditingUser(null);
      toast.success('Usuário atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erro ao atualizar usuário');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handlePermissionChange = async (moduleCode: string, profileId: string, field: 'read' | 'write' | 'delete', value: boolean) => {
    const dbField = field === 'read' ? 'can_read' : field === 'write' ? 'can_write' : 'can_delete';
    await updateDbPermission(moduleCode, profileId as any, dbField, value);
  };

  // Bulk selection helpers
  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredAndSortedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredAndSortedUsers.map(u => u.user_id)));
    }
  };

  const bulkToggleActive = async (activate: boolean) => {
    if (selectedUsers.size === 0) return;
    setIsBulkProcessing(true);
    try {
      for (const userId of selectedUsers) {
        if (userId === user?.id) continue; // skip self
        await supabase
          .from('neohub_users')
          .update({ is_active: activate, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      }
      toast.success(`${selectedUsers.size} usuário(s) ${activate ? 'ativado(s)' : 'desativado(s)'}`);
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao processar ação em massa');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const bulkChangeRole = async (newRole: AppRole) => {
    if (selectedUsers.size === 0) return;
    setIsBulkProcessing(true);
    try {
      for (const userId of selectedUsers) {
        if (userId === user?.id) continue;
        await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);
      }
      toast.success(`Perfil de ${selectedUsers.size} usuário(s) alterado para ${getRoleMeta(newRole).name}`);
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao alterar perfis em massa');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const bulkDeleteUsers = async () => {
    if (selectedUsers.size === 0) return;
    const confirmed = window.confirm(`Tem certeza que deseja excluir ${selectedUsers.size} usuário(s)? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;
    setIsBulkProcessing(true);
    try {
      for (const userId of selectedUsers) {
        if (userId === user?.id) continue;
        await supabase.functions.invoke('admin-delete-user', {
          body: { user_id: userId },
        });
      }
      toast.success(`${selectedUsers.size} usuário(s) excluído(s)`);
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao excluir usuários');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const deleteUser = async (userId: string) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.');
    if (!confirmed) return;
    try {
      const { error } = await supabase.functions.invoke('admin-delete-user', {
        body: { user_id: userId },
      });
      if (error) throw error;
      toast.success('Usuário excluído com sucesso');
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao excluir usuário');
    }
  };

  const toggleUserActive = async (userId: string, currentlyActive: boolean) => {
    try {
      await supabase
        .from('neohub_users')
        .update({ is_active: !currentlyActive, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      toast.success(currentlyActive ? 'Usuário desativado' : 'Usuário ativado');
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // Group modules by category
  const modulesByCategory = useMemo(() => {
    const grouped: Record<string, typeof SYSTEM_MODULES> = {};
    SYSTEM_MODULES.forEach(mod => {
      if (!grouped[mod.category]) {
        grouped[mod.category] = [];
      }
      grouped[mod.category].push(mod);
    });
    return grouped;
  }, []);

  const filteredModules = useMemo(() => {
    if (permissionFilter === 'all') return SYSTEM_MODULES;
    return SYSTEM_MODULES.filter(m => m.category === permissionFilter);
  }, [permissionFilter]);

  const categories = useMemo(() => {
    return [...new Set(SYSTEM_MODULES.map(m => m.category))];
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 overflow-x-hidden w-full bg-gradient-to-b from-slate-900 to-slate-950 min-h-screen">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-6 w-6 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Configurações do Sistema</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6 bg-slate-800/60 border border-slate-700/50">
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="visibility" className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              <Eye className="h-4 w-4" />
              Visibilidade
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              <Sliders className="h-4 w-4" />
              Geral
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-slate-800/60 border-slate-700/50">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-white">Gestão de Usuários</CardTitle>
                    <CardDescription className="text-slate-400">
                      Gerencie permissões e dados dos usuários
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                      />
                    </div>
                    <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                      <SelectTrigger className="w-44 bg-slate-900/50 border-slate-700 text-white">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {ACCESS_PROFILES.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setShowAddUserDialog(true)} className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Adicionar
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/access-matrix')} className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700">
                      <Grid3X3 className="h-4 w-4" />
                      Matriz de Acesso
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Bulk Action Bar */}
                {selectedUsers.size > 0 && (
                  <div className="mb-4 flex items-center gap-3 p-3 bg-blue-950/40 border border-blue-500/30 rounded-lg">
                    <CheckSquare className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-blue-300 font-medium">
                      {selectedUsers.size} selecionado(s)
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-1">
                            <Shield className="h-3.5 w-3.5" />
                            Alterar Perfil
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {ACCESS_PROFILES.map(p => (
                            <DropdownMenuItem key={p.id} onClick={() => bulkChangeRole(p.id)} disabled={isBulkProcessing}>
                              <p.icon className="h-4 w-4 mr-2" />
                              {p.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-600/50 text-emerald-400 hover:bg-emerald-900/30 gap-1"
                        onClick={() => bulkToggleActive(true)}
                        disabled={isBulkProcessing}
                      >
                        <Power className="h-3.5 w-3.5" />
                        Ativar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-600/50 text-amber-400 hover:bg-amber-900/30 gap-1"
                        onClick={() => bulkToggleActive(false)}
                        disabled={isBulkProcessing}
                      >
                        <Power className="h-3.5 w-3.5" />
                        Desativar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-600/50 text-red-400 hover:bg-red-900/30 gap-1"
                        onClick={bulkDeleteUsers}
                        disabled={isBulkProcessing}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400"
                        onClick={() => setSelectedUsers(new Set())}
                      >
                        Limpar
                      </Button>
                    </div>
                    {isBulkProcessing && <Loader2 className="h-4 w-4 animate-spin text-blue-400" />}
                  </div>
                )}

                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                     <TableRow className="border-slate-700/50 hover:bg-transparent">
                        <TableHead className="w-[40px]">
                          <Checkbox
                            checked={filteredAndSortedUsers.length > 0 && selectedUsers.size === filteredAndSortedUsers.length}
                            onCheckedChange={toggleSelectAll}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                        </TableHead>
                        <TableHead className="w-[250px] text-slate-400">
                          <Button variant="ghost" size="sm" onClick={() => handleSort('name')} className="gap-1">
                            Usuário
                            <SortIcon field="name" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSort('email')} className="gap-1">
                            Email
                            <SortIcon field="email" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSort('clinic_name')} className="gap-1">
                            Clínica
                            <SortIcon field="clinic_name" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button variant="ghost" size="sm" onClick={() => handleSort('role')} className="gap-1">
                            Perfil
                            <SortIcon field="role" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-center w-[80px]">Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedUsers.map((userProfile) => {
                        const role = getUserRole(userProfile.user_id);
                        const roleMeta = getRoleMeta(role);
                        const RoleIcon = roleMeta.icon;
                        const isCurrentUser = userProfile.user_id === user?.id;
                        const displayName = userProfile.full_name || userProfile.name;
                        const isSelected = selectedUsers.has(userProfile.user_id);
                        const isUserActive = userProfile.is_active !== false;
                        
                        return (
                          <TableRow key={userProfile.id} className={cn(
                            "border-slate-700/50 hover:bg-slate-700/30",
                            isSelected && "bg-blue-950/30"
                          )}>
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelectUser(userProfile.user_id)}
                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={userProfile.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(displayName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-white">{displayName}</span>
                                    {isCurrentUser && <Badge variant="outline" className="text-xs">Você</Badge>}
                                  </div>
                                  {(userProfile.address_city || userProfile.city) && (
                                    <span className="text-xs text-slate-400">
                                      {userProfile.address_city || userProfile.city}
                                      {(userProfile.address_state || userProfile.state) && `, ${userProfile.address_state || userProfile.state}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-300">{userProfile.email}</TableCell>
                            <TableCell className="text-sm text-slate-300">{userProfile.clinic_name || '-'}</TableCell>
                            <TableCell>
                              <Badge className={roleMeta.color}>
                                <RoleIcon className="h-3 w-3 mr-1" />
                                {roleMeta.name}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={isUserActive ? 'bg-emerald-900/50 text-emerald-400 border-emerald-500/30' : 'bg-red-900/50 text-red-400 border-red-500/30'} variant="outline">
                                {isUserActive ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-700"
                                  onClick={() => openEditDialog(userProfile)}
                                  title="Editar usuário"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {!isCurrentUser && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-700">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                          <Shield className="h-4 w-4 mr-2" />
                                          Alterar Função
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                          {ACCESS_PROFILES.map(p => (
                                            <DropdownMenuItem key={p.id} onClick={() => {
                                              supabase.from('user_roles').update({ role: p.id }).eq('user_id', userProfile.user_id).then(() => {
                                                setUserRoles(prev => prev.map(r => r.user_id === userProfile.user_id ? { ...r, role: p.id } : r));
                                                toast.success(`Função alterada para ${p.name}`);
                                              });
                                            }}>
                                              <p.icon className="h-4 w-4 mr-2" />
                                              {p.name}
                                            </DropdownMenuItem>
                                          ))}
                                        </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => toggleUserActive(userProfile.user_id, isUserActive)}>
                                        <Power className="h-4 w-4 mr-2" />
                                        {isUserActive ? 'Desativar' : 'Ativar'}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-red-400 focus:text-red-400" onClick={() => deleteUser(userProfile.user_id)}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir Usuário
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
                
                <div className="mt-4 text-sm text-slate-400">
                  Mostrando {filteredAndSortedUsers.length} de {users.length} usuários
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* Page Visibility Tab */}
          <TabsContent value="visibility">
            <Card className="bg-slate-800/60 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Visibilidade das Páginas</CardTitle>
                <CardDescription className="text-slate-400">
                  Controle quais seções do portal estão disponíveis para os licenciados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(Object.keys(pageLabels) as Array<keyof PageVisibility>).map((key) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0">
                    <div className="flex items-center gap-3">
                      {pageVisibility[key] ? (
                        <Eye className="h-5 w-5 text-green-400" />
                      ) : (
                        <EyeOff className="h-5 w-5 text-slate-500" />
                      )}
                      <Label htmlFor={key} className="font-medium cursor-pointer text-white">
                        {pageLabels[key]}
                      </Label>
                    </div>
                    <Switch
                      id={key}
                      checked={pageVisibility[key]}
                      onCheckedChange={() => handleVisibilityChange(key)}
                    />
                  </div>
                ))}
                
                <Button 
                  className="w-full mt-6" 
                  onClick={saveVisibility}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-slate-800/60 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Configurações Gerais</CardTitle>
                <CardDescription className="text-slate-400">
                  Configurações avançadas do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                  <div>
                    <Label className="font-medium text-white">Permitir Novos Cadastros</Label>
                    <p className="text-sm text-slate-400">
                      Habilitar registro de novos usuários pelo formulário de signup
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
                  <div>
                    <Label className="font-medium text-white">Modo Manutenção</Label>
                    <p className="text-sm text-slate-400">
                      Bloquear acesso de licenciados temporariamente
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <Label className="font-medium text-white">Notificações por Email</Label>
                    <p className="text-sm text-slate-400">
                      Enviar emails para novos leads e atualizações
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit User Modal - New Complete Version */}
        <UserEditModal
          user={editingUser ? {
            id: editingUser.id,
            user_id: editingUser.user_id,
            full_name: editingUser.full_name || editingUser.name,
            email: editingUser.email,
            phone: editingUser.phone || undefined,
            clinic_name: editingUser.clinic_name || undefined,
            address_city: editingUser.address_city || editingUser.city || undefined,
            address_state: editingUser.address_state || editingUser.state || undefined,
            avatar_url: editingUser.avatar_url || undefined,
            is_active: editingUser.is_active ?? true,
            allowed_portals: editingUser.allowed_portals || [],
            tier: editingUser.tier || undefined,
            crm: editingUser.crm || undefined,
            rqe: editingUser.rqe || undefined,
            created_at: editingUser.created_at,
          } : null}
          userRole={editingUser ? getUserRole(editingUser.user_id) : 'licensee'}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onUserUpdated={() => {
            fetchUsers();
            setEditingUser(null);
          }}
        />
        <AddUserDialog
          open={showAddUserDialog}
          onOpenChange={setShowAddUserDialog}
          onSuccess={() => fetchUsers()}
        />
      </div>
  );
}
