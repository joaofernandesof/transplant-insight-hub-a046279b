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
  Grid3X3
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PORTAL_MODULES, PORTAL_NAMES, Portal } from '@/neohub/lib/permissions';
import { UserEditModal } from './admin/components/UserEditModal';

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

type AppRole = 'admin' | 'licensee' | 'colaborador' | 'aluno' | 'paciente';

interface UserRole {
  user_id: string;
  role: AppRole;
}

type SortField = 'name' | 'email' | 'clinic_name' | 'created_at' | 'role';
type SortOrder = 'asc' | 'desc';

// All system modules for the permission matrix
const SYSTEM_MODULES = [
  { code: 'dashboard', name: 'Dashboard de Métricas', category: 'Dados' },
  { code: 'consolidated', name: 'Resultados Consolidados', category: 'Dados' },
  { code: 'achievements', name: 'Conquistas', category: 'Dados' },
  { code: 'surgery_schedule', name: 'Agenda de Cirurgias', category: 'Dados' },
  { code: 'sala_tecnica', name: 'Sala Técnica', category: 'Dados' },
  { code: 'university', name: 'Universidade ByNeofolic', category: 'Formação' },
  { code: 'certificates', name: 'Certificados', category: 'Formação' },
  { code: 'regularization', name: 'Regularização da Clínica', category: 'Formação' },
  { code: 'materials', name: 'Central de Materiais', category: 'Recursos' },
  { code: 'marketing', name: 'Central de Marketing', category: 'Recursos' },
  { code: 'store', name: 'Loja Neo-Spa', category: 'Recursos' },
  { code: 'partners', name: 'Vitrine de Parceiros', category: 'Recursos' },
  { code: 'estrutura_neo', name: 'Estrutura NEO', category: 'Gestão' },
  { code: 'hotleads', name: 'HotLeads', category: 'Gestão' },
  { code: 'financial', name: 'Gestão Financeira', category: 'Gestão' },
  { code: 'community', name: 'Comunidade', category: 'Social' },
  { code: 'mentorship', name: 'Mentoria & Suporte', category: 'Suporte' },
  { code: 'referral', name: 'Indique e Ganhe', category: 'Marketing' },
  { code: 'marketplace', name: 'Marketplace', category: 'Marketplace' },
  { code: 'admin_dashboard', name: 'Dashboard Admin', category: 'Admin' },
  { code: 'licensees_panel', name: 'Gerenciar Alunos', category: 'Admin' },
  { code: 'user_monitoring', name: 'Monitoramento de Usuários', category: 'Admin' },
  { code: 'system_metrics', name: 'Métricas do Sistema', category: 'Admin' },
  { code: 'weekly_reports', name: 'Relatórios Semanais', category: 'Admin' },
  { code: 'clinic_comparison', name: 'Comparar Clínicas', category: 'Admin' },
  { code: 'admin_panel', name: 'Configurações do Sistema', category: 'Admin' },
  { code: 'access_matrix', name: 'Matriz de Acessos', category: 'Admin' },
];

// Permission profiles
const ACCESS_PROFILES = [
  { id: 'admin' as AppRole, name: 'Administrador', icon: Crown, color: 'text-amber-600 bg-amber-100' },
  { id: 'licensee' as AppRole, name: 'Licenciado', icon: Shield, color: 'text-blue-600 bg-blue-100' },
  { id: 'colaborador' as AppRole, name: 'Colaborador', icon: Building2, color: 'text-green-600 bg-green-100' },
  { id: 'aluno' as AppRole, name: 'Aluno', icon: GraduationCap, color: 'text-purple-600 bg-purple-100' },
  { id: 'paciente' as AppRole, name: 'Paciente', icon: Heart, color: 'text-rose-600 bg-rose-100' },
];

const pageLabels: Record<keyof PageVisibility, string> = {
  university: 'Universidade ByNeofolic',
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
    return userRoles.find(r => r.user_id === userId)?.role || 'licensee';
  };

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        (u.clinic_name?.toLowerCase().includes(search) ?? false)
      );
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
    const newRole: AppRole = currentRole === 'admin' ? 'licensee' : 'admin';
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;
      
      setUserRoles(prev => prev.map(r => 
        r.user_id === userId ? { ...r, role: newRole } : r
      ));
      toast.success(`Usuário ${newRole === 'admin' ? 'promovido a administrador' : 'definido como licenciado'}`);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erro ao atualizar permissão');
    }
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
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Configurações do Sistema</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Permissões
            </TabsTrigger>
            <TabsTrigger value="visibility" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visibilidade
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              Geral
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Gestão de Usuários</CardTitle>
                    <CardDescription>
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
                        className="pl-8 w-64"
                      />
                    </div>
                    <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                      <SelectTrigger className="w-36">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="licensee">Licenciado</SelectItem>
                        <SelectItem value="colaborador">Colaborador</SelectItem>
                        <SelectItem value="aluno">Aluno</SelectItem>
                        <SelectItem value="paciente">Paciente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">
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
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedUsers.map((userProfile) => {
                        const role = getUserRole(userProfile.user_id);
                        const isCurrentUser = userProfile.user_id === user?.id;
                        
                        return (
                          <TableRow key={userProfile.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={userProfile.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {getInitials(userProfile.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{userProfile.name}</span>
                                    {isCurrentUser && <Badge variant="outline" className="text-xs">Você</Badge>}
                                  </div>
                                  {userProfile.city && (
                                    <span className="text-xs text-muted-foreground">
                                      {userProfile.city}{userProfile.state && `, ${userProfile.state}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{userProfile.email}</TableCell>
                            <TableCell className="text-sm">{userProfile.clinic_name || '-'}</TableCell>
                            <TableCell>
                              <Badge className={role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}>
                                {role === 'admin' ? (
                                  <>
                                    <Crown className="h-3 w-3 mr-1" />
                                    Admin
                                  </>
                                ) : (
                                  <>
                                    <Shield className="h-3 w-3 mr-1" />
                                    Licenciado
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(userProfile)}
                                  title="Editar usuário"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {!isCurrentUser && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleUserRole(userProfile.user_id, role)}
                                  >
                                    {role === 'admin' ? (
                                      <>
                                        <UserX className="h-4 w-4 mr-1" />
                                        Remover Admin
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="h-4 w-4 mr-1" />
                                        Tornar Admin
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
                
                <div className="mt-4 text-sm text-muted-foreground">
                  Mostrando {filteredAndSortedUsers.length} de {users.length} usuários
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Matrix Tab */}
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Grid3X3 className="h-5 w-5" />
                      Matriz de Permissões por Módulo
                    </CardTitle>
                    <CardDescription>
                      Defina quem pode Ver, Editar, Inserir e Excluir em cada módulo do sistema
                    </CardDescription>
                  </div>
                  <Select value={permissionFilter} onValueChange={setPermissionFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                  <span className="font-medium text-muted-foreground">Legenda:</span>
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-blue-600" />
                    <span>Visualizar</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Pencil className="h-3.5 w-3.5 text-amber-600" />
                    <span>Editar / Inserir</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    <span>Excluir</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <ScrollArea className="w-full">
                  <div className="min-w-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-64">Módulo / Função</TableHead>
                          {ACCESS_PROFILES.map(profile => (
                            <TableHead key={profile.id} className="text-center min-w-[120px]">
                              <div className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
                                profile.color
                              )}>
                                <profile.icon className="h-3 w-3" />
                                {profile.name}
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      
                      <TableBody>
                        {filteredModules.map((mod, idx) => {
                          const perms = modulePermissions[mod.code] || {};
                          
                          return (
                            <TableRow 
                              key={mod.code}
                              className={cn(idx % 2 === 0 ? "bg-background" : "bg-muted/30")}
                            >
                              <TableCell>
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-medium text-sm">{mod.name}</span>
                                  <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0">
                                    {mod.category}
                                  </Badge>
                                </div>
                              </TableCell>
                              
                              {ACCESS_PROFILES.map(profile => {
                                const profilePerms = perms[profile.id] || { read: false, write: false, delete: false };
                                const isAdmin = profile.id === 'admin';
                                
                                return (
                                  <TableCell key={profile.id} className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      {/* Visualizar (Read) */}
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex flex-col items-center gap-0.5">
                                              <Checkbox
                                                checked={isAdmin || profilePerms.read}
                                                disabled={isAdmin}
                                                onCheckedChange={(checked) => 
                                                  handlePermissionChange(mod.code, profile.id, 'read', !!checked)
                                                }
                                                className={cn(
                                                  "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600",
                                                  isAdmin && "opacity-50"
                                                )}
                                              />
                                              <Eye className="h-3 w-3 text-blue-600" />
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>Visualizar</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      {/* Editar/Inserir (Write) */}
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex flex-col items-center gap-0.5">
                                              <Checkbox
                                                checked={isAdmin || profilePerms.write}
                                                disabled={isAdmin || !profilePerms.read}
                                                onCheckedChange={(checked) => 
                                                  handlePermissionChange(mod.code, profile.id, 'write', !!checked)
                                                }
                                                className={cn(
                                                  "data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600",
                                                  (isAdmin || !profilePerms.read) && "opacity-50"
                                                )}
                                              />
                                              <Pencil className="h-3 w-3 text-amber-600" />
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>Editar / Inserir</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      {/* Excluir (Delete) */}
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex flex-col items-center gap-0.5">
                                              <Checkbox
                                                checked={isAdmin || profilePerms.delete}
                                                disabled={isAdmin || !profilePerms.read}
                                                onCheckedChange={(checked) => 
                                                  handlePermissionChange(mod.code, profile.id, 'delete', !!checked)
                                                }
                                                className={cn(
                                                  "data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600",
                                                  (isAdmin || !profilePerms.read) && "opacity-50"
                                                )}
                                              />
                                              <Trash2 className="h-3 w-3 text-red-600" />
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>Excluir</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
                
                {/* Info Footer */}
                <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>
                    As permissões de Editar e Excluir dependem da permissão de Visualizar estar ativa.
                    O perfil Administrador possui acesso total e não pode ser modificado.
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    As alterações são salvas automaticamente no banco de dados.
                  </p>
                  {permissionsLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando permissões...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Page Visibility Tab */}
          <TabsContent value="visibility">
            <Card>
              <CardHeader>
                <CardTitle>Visibilidade das Páginas</CardTitle>
                <CardDescription>
                  Controle quais seções do portal estão disponíveis para os licenciados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(Object.keys(pageLabels) as Array<keyof PageVisibility>).map((key) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      {pageVisibility[key] ? (
                        <Eye className="h-5 w-5 text-green-600" />
                      ) : (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      )}
                      <Label htmlFor={key} className="font-medium cursor-pointer">
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
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>
                  Configurações avançadas do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <Label className="font-medium">Permitir Novos Cadastros</Label>
                    <p className="text-sm text-muted-foreground">
                      Habilitar registro de novos usuários pelo formulário de signup
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <Label className="font-medium">Modo Manutenção</Label>
                    <p className="text-sm text-muted-foreground">
                      Bloquear acesso de licenciados temporariamente
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <Label className="font-medium">Notificações por Email</Label>
                    <p className="text-sm text-muted-foreground">
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
      </div>
  );
}
