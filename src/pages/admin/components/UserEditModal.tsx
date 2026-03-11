/**
 * Modal completo de edição de usuário
 * Permite editar dados, acessos (Portal × Perfil), status ativo/inativo
 * Inclui edição granular de permissões por módulo com indicador de personalização
 */

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Shield,
  Crown,
  Save,
  Loader2,
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  Eye,
  GraduationCap,
  Heart,
  TrendingUp,
  Scale,
  Users,
  AlertTriangle,
  Trash2,
  CreditCard,
  Settings,
  X,
  ChevronDown,
  ChevronRight,
  Pencil,
  KeyRound,
  Copy,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Roles hierarchy
const ROLES = [
  { id: 'super_administrador', name: 'Super Admin', icon: Crown },
  { id: 'administrador', name: 'Administrador', icon: Shield },
  { id: 'gerente', name: 'Gerente', icon: Building2 },
  { id: 'coordenador', name: 'Coordenador', icon: Users },
  { id: 'supervisor', name: 'Supervisor', icon: Eye },
  { id: 'operador', name: 'Operador', icon: Settings },
  { id: 'visualizador', name: 'Visualizador', icon: Eye },
  { id: 'externo', name: 'Externo', icon: AlertTriangle },
];

// Portal definitions with icons
const PORTAL_CONFIG: Record<string, { name: string; icon: any; color: string }> = {
  'admin': { name: 'Administrador', icon: Crown, color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300' },
  'neoteam': { name: 'NeoTeam', icon: Users, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
  'neocare': { name: 'NeoCare', icon: Heart, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300' },
  'academy': { name: 'Conecta Capilar', icon: GraduationCap, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  'neolicense': { name: 'NeoLicense', icon: Building2, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  'avivar': { name: 'Avivar', icon: TrendingUp, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' },
  'ipromed': { name: 'CPG Advocacia', icon: Scale, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  'neorh': { name: 'NeoRH', icon: Users, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' },
  'neopay': { name: 'NeoPay', icon: CreditCard, color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
  'vision': { name: 'Vision', icon: Eye, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300' },
  'hotleads': { name: 'HotLeads', icon: TrendingUp, color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
  'neohair': { name: 'NeoHair', icon: Heart, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' },
};

const PERMISSION_ACTIONS = [
  { key: 'can_view', label: 'Ver', short: 'V' },
  { key: 'can_create', label: 'Criar', short: 'C' },
  { key: 'can_edit', label: 'Editar', short: 'E' },
  { key: 'can_delete', label: 'Excluir', short: 'D' },
  { key: 'can_approve', label: 'Aprovar', short: 'A' },
  { key: 'can_export', label: 'Exportar', short: 'X' },
  { key: 'can_configure', label: 'Config', short: 'Cfg' },
] as const;

type PermAction = typeof PERMISSION_ACTIONS[number]['key'];

interface ModulePermissions {
  moduleId: string;
  moduleName: string;
  defaults: Record<PermAction, boolean>;
  current: Record<PermAction, boolean>;
}

interface PortalRoleAssignment {
  portalId: string;
  portalSlug: string;
  portalName: string;
  roleId: string | null;
  roleName: string | null;
}

interface UserData {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  clinic_name?: string;
  address_city?: string;
  address_state?: string;
  avatar_url?: string;
  is_active: boolean;
  allowed_portals?: string[];
  tier?: string;
  crm?: string;
  rqe?: string;
  created_at: string;
}

interface UserEditModalProps {
  user: UserData | null;
  userRole?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated?: () => void;
}

export function UserEditModal({
  user,
  userRole = 'operador',
  open,
  onOpenChange,
  onUserUpdated,
}: UserEditModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dados');

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    clinic_name: '',
    address_city: '',
    address_state: '',
    crm: '',
    rqe: '',
    tier: 'basic',
  });
  const [isActive, setIsActive] = useState(true);

  // Portal × Role state
  const [dbPortals, setDbPortals] = useState<{ id: string; slug: string; name: string }[]>([]);
  const [dbRoles, setDbRoles] = useState<{ id: string; name: string }[]>([]);
  const [portalRoles, setPortalRoles] = useState<Record<string, string | null>>({});
  const [loadingAccess, setLoadingAccess] = useState(false);

  // Granular permissions state
  const [expandedPortal, setExpandedPortal] = useState<string | null>(null);
  const [portalModulePerms, setPortalModulePerms] = useState<Record<string, ModulePermissions[]>>({});
  const [loadingModules, setLoadingModules] = useState<string | null>(null);
  const [neohubUserId, setNeohubUserId] = useState<string | null>(null);

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleSetPassword = async () => {
    if (!user || !newPassword || newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setIsResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-user-password', {
        body: { target_user_id: user.user_id, new_password: newPassword },
      });
      if (error) throw error;
      toast.success('Senha alterada com sucesso!');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar senha');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleGenerateRandomPassword = async () => {
    if (!user) return;
    setIsResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-user-password', {
        body: { target_user_id: user.user_id, generate_random: true },
      });
      if (error) throw error;
      const pwd = data?.generated_password;
      setGeneratedPassword(pwd);
      toast.success('Senha gerada com sucesso! Copie e envie ao usuário.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar senha');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Senha copiada!');
  };
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        clinic_name: user.clinic_name || '',
        address_city: user.address_city || '',
        address_state: user.address_state || '',
        crm: user.crm || '',
        rqe: user.rqe || '',
        tier: user.tier || 'basic',
      });
      setIsActive(user.is_active ?? true);
      setExpandedPortal(null);
      setPortalModulePerms({});
    }
  }, [user]);

  // Load portals, roles, and user assignments
  useEffect(() => {
    if (!user || !open) return;
    
    const loadAccessData = async () => {
      setLoadingAccess(true);
      try {
        const { data: neohubUser } = await supabase
          .from('neohub_users')
          .select('id')
          .eq('user_id', user.user_id)
          .maybeSingle();

        const nId = neohubUser?.id;
        setNeohubUserId(nId || null);

        const [portalsRes, rolesRes, assignmentsRes] = await Promise.all([
          supabase.from('portals').select('id, slug, name').eq('is_active', true).order('order_index'),
          supabase.from('roles').select('id, name').order('hierarchy_level'),
          nId
            ? supabase.from('user_portal_roles').select('portal_id, role_id').eq('user_id', nId).eq('is_active', true)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (portalsRes.data) setDbPortals(portalsRes.data);
        if (rolesRes.data) setDbRoles(rolesRes.data);

        const roleMap: Record<string, string | null> = {};
        (portalsRes.data || []).forEach(p => { roleMap[p.id] = null; });
        (assignmentsRes.data || []).forEach(a => { roleMap[a.portal_id] = a.role_id; });
        setPortalRoles(roleMap);
      } catch (err) {
        console.error('Error loading access data:', err);
      } finally {
        setLoadingAccess(false);
      }
    };

    loadAccessData();
  }, [user, open]);

  // Load module permissions for a portal when expanded
  const loadModulePermissions = useCallback(async (portalId: string, roleId: string) => {
    setLoadingModules(portalId);
    try {
      // Get modules for this portal
      const { data: modules } = await supabase
        .from('modules')
        .select('id, name, code')
        .eq('portal_id', portalId)
        .eq('is_active', true)
        .order('order_index');

      if (!modules || modules.length === 0) {
        setPortalModulePerms(prev => ({ ...prev, [portalId]: [] }));
        setLoadingModules(null);
        return;
      }

      // Get default permissions for this role
      const { data: rolePerms } = await supabase
        .from('role_module_permissions')
        .select('module_id, can_view, can_create, can_edit, can_delete, can_approve, can_export, can_configure')
        .eq('role_id', roleId)
        .in('module_id', modules.map(m => m.id));

      // Get user overrides
      let userOverrides: any[] = [];
      if (neohubUserId) {
        const { data } = await supabase
          .from('user_module_permission_overrides' as any)
          .select('module_id, can_view, can_create, can_edit, can_delete, can_approve, can_export, can_configure')
          .eq('user_id', neohubUserId)
          .eq('portal_id', portalId);
        userOverrides = data || [];
      }

      const permMap: Record<string, any> = {};
      (rolePerms || []).forEach(rp => { permMap[rp.module_id] = rp; });

      const overrideMap: Record<string, any> = {};
      userOverrides.forEach(uo => { overrideMap[uo.module_id] = uo; });

      const result: ModulePermissions[] = modules.map(m => {
        const defaults: Record<PermAction, boolean> = {
          can_view: permMap[m.id]?.can_view ?? false,
          can_create: permMap[m.id]?.can_create ?? false,
          can_edit: permMap[m.id]?.can_edit ?? false,
          can_delete: permMap[m.id]?.can_delete ?? false,
          can_approve: permMap[m.id]?.can_approve ?? false,
          can_export: permMap[m.id]?.can_export ?? false,
          can_configure: permMap[m.id]?.can_configure ?? false,
        };

        const override = overrideMap[m.id];
        const current: Record<PermAction, boolean> = override
          ? {
              can_view: override.can_view ?? defaults.can_view,
              can_create: override.can_create ?? defaults.can_create,
              can_edit: override.can_edit ?? defaults.can_edit,
              can_delete: override.can_delete ?? defaults.can_delete,
              can_approve: override.can_approve ?? defaults.can_approve,
              can_export: override.can_export ?? defaults.can_export,
              can_configure: override.can_configure ?? defaults.can_configure,
            }
          : { ...defaults };

        return {
          moduleId: m.id,
          moduleName: m.name,
          defaults,
          current,
        };
      });

      setPortalModulePerms(prev => ({ ...prev, [portalId]: result }));
    } catch (err) {
      console.error('Error loading module permissions:', err);
    } finally {
      setLoadingModules(null);
    }
  }, [neohubUserId]);

  // Toggle a specific module permission
  const toggleModulePerm = (portalId: string, moduleId: string, action: PermAction) => {
    setPortalModulePerms(prev => {
      const portalPerms = prev[portalId] || [];
      return {
        ...prev,
        [portalId]: portalPerms.map(mp =>
          mp.moduleId === moduleId
            ? { ...mp, current: { ...mp.current, [action]: !mp.current[action] } }
            : mp
        ),
      };
    });
  };

  // Reset module permissions to defaults
  const resetPortalToDefaults = (portalId: string) => {
    setPortalModulePerms(prev => {
      const portalPerms = prev[portalId] || [];
      return {
        ...prev,
        [portalId]: portalPerms.map(mp => ({
          ...mp,
          current: { ...mp.defaults },
        })),
      };
    });
  };

  // Check if a portal has customized permissions
  const hasCustomPermissions = (portalId: string): boolean => {
    const perms = portalModulePerms[portalId];
    if (!perms) return false;
    return perms.some(mp =>
      PERMISSION_ACTIONS.some(a => mp.current[a.key] !== mp.defaults[a.key])
    );
  };

  // Count customized modules
  const countCustomModules = (portalId: string): number => {
    const perms = portalModulePerms[portalId];
    if (!perms) return 0;
    return perms.filter(mp =>
      PERMISSION_ACTIONS.some(a => mp.current[a.key] !== mp.defaults[a.key])
    ).length;
  };

  // Handle portal expand toggle
  const handleExpandPortal = (portalId: string) => {
    if (expandedPortal === portalId) {
      setExpandedPortal(null);
      return;
    }
    setExpandedPortal(portalId);
    const roleId = portalRoles[portalId];
    if (roleId && !portalModulePerms[portalId]) {
      loadModulePermissions(portalId, roleId);
    }
  };

  // When role changes for a portal, reload module permissions
  const handleRoleChange = (portalId: string, roleId: string | null) => {
    setPortalRoles(prev => ({ ...prev, [portalId]: roleId }));
    // Clear cached permissions when role changes
    setPortalModulePerms(prev => {
      const next = { ...prev };
      delete next[portalId];
      return next;
    });
    // If expanded and new role selected, reload
    if (expandedPortal === portalId && roleId) {
      loadModulePermissions(portalId, roleId);
    }
  };

  // Update user mutation
  const updateUser = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não encontrado');

      // 1. Update neohub_users
      const neohubPayload = {
        user_id: user.user_id,
        full_name: formData.full_name,
        email: formData.email || user.email,
        phone: formData.phone || null,
        clinic_name: formData.clinic_name || null,
        address_city: formData.address_city || null,
        address_state: formData.address_state || null,
        crm: formData.crm || null,
        rqe: formData.rqe || null,
        tier: formData.tier,
        is_active: isActive,
        allowed_portals: Object.entries(portalRoles)
          .filter(([_, roleId]) => roleId !== null)
          .map(([portalId]) => {
            const p = dbPortals.find(dp => dp.id === portalId);
            return p?.slug || '';
          })
          .filter(Boolean),
        updated_at: new Date().toISOString(),
      };

      const { error: userError } = await supabase
        .from('neohub_users')
        .upsert(neohubPayload, { onConflict: 'user_id' });

      if (userError) throw userError;

      // 2. Update profiles table for compatibility
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: formData.full_name,
          clinic_name: formData.clinic_name || null,
          city: formData.address_city || null,
          state: formData.address_state || null,
          phone: formData.phone || null,
        })
        .eq('user_id', user.user_id);

      if (profileError) console.warn('Profiles update warning:', profileError);

      // 3. Get neohub_users.id
      const { data: neohubUser } = await supabase
        .from('neohub_users')
        .select('id')
        .eq('user_id', user.user_id)
        .maybeSingle();

      const nId = neohubUser?.id;
      if (!nId) throw new Error('Registro do usuário não encontrado');

      // 4. Sync user_portal_roles
      await supabase
        .from('user_portal_roles')
        .delete()
        .eq('user_id', nId);

      const newAssignments = Object.entries(portalRoles)
        .filter(([_, roleId]) => roleId !== null)
        .map(([portalId, roleId]) => ({
          user_id: nId,
          portal_id: portalId,
          role_id: roleId!,
          is_active: true,
        }));

      if (newAssignments.length > 0) {
        const { error: insertError } = await supabase
          .from('user_portal_roles')
          .insert(newAssignments);
        if (insertError) throw insertError;
      }

      // 5. Save module permission overrides
      // Delete existing overrides for this user
      await supabase
        .from('user_module_permission_overrides' as any)
        .delete()
        .eq('user_id', nId);

      // Insert only overrides that differ from defaults
      const overrides: any[] = [];
      for (const [portalId, modules] of Object.entries(portalModulePerms)) {
        if (!portalRoles[portalId]) continue; // Skip portals with no access
        for (const mp of modules) {
          const hasOverride = PERMISSION_ACTIONS.some(a => mp.current[a.key] !== mp.defaults[a.key]);
          if (hasOverride) {
            overrides.push({
              user_id: nId,
              portal_id: portalId,
              module_id: mp.moduleId,
              can_view: mp.current.can_view,
              can_create: mp.current.can_create,
              can_edit: mp.current.can_edit,
              can_delete: mp.current.can_delete,
              can_approve: mp.current.can_approve,
              can_export: mp.current.can_export,
              can_configure: mp.current.can_configure,
            });
          }
        }
      }

      if (overrides.length > 0) {
        const { error: overrideError } = await supabase
          .from('user_module_permission_overrides' as any)
          .insert(overrides);
        if (overrideError) throw overrideError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário atualizado com sucesso!');
      onUserUpdated?.();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar: ' + error.message);
    },
  });

  const setPortalRole = (portalId: string, roleId: string | null) => {
    handleRoleChange(portalId, roleId);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getRoleName = (roleId: string | null) => {
    if (!roleId) return null;
    const r = dbRoles.find(r => r.id === roleId);
    return r ? ROLES.find(rl => rl.id === r.name)?.name || r.name : null;
  };

  const activePortalCount = Object.values(portalRoles).filter(r => r !== null).length;

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="text-lg bg-primary/10">
                {getInitials(user.full_name || user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-xl">{formData.full_name || 'Usuário'}</DialogTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                {isActive ? (
                  <><CheckCircle2 className="h-3 w-3 mr-1" /> Ativo</>
                ) : (
                  <><XCircle className="h-3 w-3 mr-1" /> Inativo</>
                )}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="dados" className="gap-2">
              <User className="h-4 w-4" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="acessos" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Acessos
            </TabsTrigger>
            <TabsTrigger value="status" className="gap-2">
              <Shield className="h-4 w-4" />
              Status
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-4 min-h-0">
            {/* Dados Tab */}
            <TabsContent value="dados" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Nome Completo
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Nome do usuário"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email
                  </Label>
                  <Input id="email" value={formData.email} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email não pode ser alterado</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic_name" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Clínica
                  </Label>
                  <Input
                    id="clinic_name"
                    value={formData.clinic_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, clinic_name: e.target.value }))}
                    placeholder="Nome da clínica"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Cidade
                  </Label>
                  <Input
                    id="city"
                    value={formData.address_city}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_city: e.target.value }))}
                    placeholder="Cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.address_state}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_state: e.target.value }))}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="crm">CRM</Label>
                  <Input
                    id="crm"
                    value={formData.crm}
                    onChange={(e) => setFormData(prev => ({ ...prev, crm: e.target.value }))}
                    placeholder="CRM do médico"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rqe">RQE</Label>
                  <Input
                    id="rqe"
                    value={formData.rqe}
                    onChange={(e) => setFormData(prev => ({ ...prev, rqe: e.target.value }))}
                    placeholder="RQE da especialidade"
                  />
                </div>
              </div>

              <Separator className="my-4" />

              {/* Password Management */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  Gerenciamento de Senha
                </Label>

                <div className="grid grid-cols-1 gap-3">
                  {/* Manual password */}
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nova senha (mín. 6 caracteres)"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSetPassword}
                      disabled={isResettingPassword || newPassword.length < 6}
                      className="whitespace-nowrap"
                    >
                      {isResettingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4 mr-1" />}
                      Definir Senha
                    </Button>
                  </div>

                  {/* Generate random */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateRandomPassword}
                      disabled={isResettingPassword}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Gerar Senha Aleatória
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Gera e aplica uma senha aleatória segura
                    </p>
                  </div>

                  {/* Show generated password */}
                  {generatedPassword && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border">
                      <code className="text-sm font-mono flex-1 select-all">{generatedPassword}</code>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(generatedPassword)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Acessos Tab - Portal × Perfil with granular permissions */}
            <TabsContent value="acessos" className="space-y-4 mt-0">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Portal × Perfil de Acesso</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Defina o perfil e personalize permissões por módulo.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activePortalCount} portais ativos
                </Badge>
              </div>

              {loadingAccess ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2">
                  {dbPortals.map(portal => {
                    const config = PORTAL_CONFIG[portal.slug] || { name: portal.name, icon: LayoutDashboard, color: 'bg-muted text-muted-foreground' };
                    const currentRoleId = portalRoles[portal.id];
                    const hasAccess = currentRoleId !== null;
                    const Icon = config.icon;
                    const isExpanded = expandedPortal === portal.id;
                    const isCustomized = hasCustomPermissions(portal.id);
                    const customCount = countCustomModules(portal.id);
                    const modules = portalModulePerms[portal.id];

                    return (
                      <div
                        key={portal.id}
                        className={cn(
                          "rounded-lg border transition-all",
                          hasAccess ? "bg-primary/5 border-primary/20" : "bg-muted/20 border-border/50"
                        )}
                      >
                        {/* Portal header row */}
                        <div className="flex items-center gap-3 p-3">
                          <div className={cn("p-2 rounded-lg shrink-0", config.color)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{config.name}</p>
                              {isCustomized && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400">
                                  <Pencil className="h-2.5 w-2.5 mr-1" />
                                  {customCount} personalizado{customCount > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Select
                              value={currentRoleId || 'none'}
                              onValueChange={(v) => setPortalRole(portal.id, v === 'none' ? null : v)}
                            >
                              <SelectTrigger className="w-[180px] h-8 text-xs">
                                <SelectValue placeholder="Sem Acesso" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  <span className="text-muted-foreground">Sem Acesso</span>
                                </SelectItem>
                                {dbRoles.map(role => {
                                  const roleDef = ROLES.find(r => r.id === role.name);
                                  return (
                                    <SelectItem key={role.id} value={role.id}>
                                      <div className="flex items-center gap-2">
                                        {roleDef && <roleDef.icon className="h-3 w-3" />}
                                        <span>{roleDef?.name || role.name}</span>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            {hasAccess && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleExpandPortal(portal.id)}
                                  title="Editar permissões individuais"
                                >
                                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => setPortalRole(portal.id, null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Expanded module permissions */}
                        {isExpanded && hasAccess && (
                          <div className="border-t px-3 pb-3 pt-2">
                            {loadingModules === portal.id ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            ) : modules && modules.length > 0 ? (
                              <div className="space-y-1">
                                {/* Header row */}
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium px-2 py-1">
                                  <span className="flex-1">Módulo</span>
                                  {PERMISSION_ACTIONS.map(a => (
                                    <span key={a.key} className="w-8 text-center" title={a.label}>{a.short}</span>
                                  ))}
                                </div>
                                {/* Module rows */}
                                {modules.map(mp => {
                                  const isModuleCustom = PERMISSION_ACTIONS.some(
                                    a => mp.current[a.key] !== mp.defaults[a.key]
                                  );
                                  return (
                                    <div
                                      key={mp.moduleId}
                                      className={cn(
                                        "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs",
                                        isModuleCustom ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50" : "hover:bg-muted/50"
                                      )}
                                    >
                                      <span className="flex-1 truncate flex items-center gap-1.5">
                                        {mp.moduleName}
                                        {isModuleCustom && (
                                          <span className="text-amber-500 text-[9px]">●</span>
                                        )}
                                      </span>
                                      {PERMISSION_ACTIONS.map(a => {
                                        const isDefault = mp.current[a.key] === mp.defaults[a.key];
                                        return (
                                          <div key={a.key} className="w-8 flex justify-center">
                                            <Checkbox
                                              checked={mp.current[a.key]}
                                              onCheckedChange={() => toggleModulePerm(portal.id, mp.moduleId, a.key)}
                                              className={cn(
                                                "h-4 w-4",
                                                !isDefault && "border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                              )}
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                                {/* Reset button */}
                                {isCustomized && (
                                  <div className="flex justify-end pt-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs text-muted-foreground h-7"
                                      onClick={() => resetPortalToDefaults(portal.id)}
                                    >
                                      Restaurar padrão do perfil
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground text-center py-4">
                                Nenhum módulo cadastrado para este portal.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Status Tab */}
            <TabsContent value="status" className="space-y-6 mt-0">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Status da Conta</Label>
                <div className={cn(
                  "flex items-center justify-between p-4 rounded-lg border",
                  isActive ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                )}>
                  <div className="flex items-center gap-3">
                    {isActive ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                    <div>
                      <p className={cn("font-medium", isActive ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300")}>
                        {isActive ? 'Conta Ativa' : 'Conta Inativa'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isActive ? 'O usuário pode acessar o sistema normalmente' : 'O usuário não conseguirá fazer login'}
                      </p>
                    </div>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-medium">Plano/Tier</Label>
                <Select value={formData.tier} onValueChange={(v) => setFormData(prev => ({ ...prev, tier: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Informações do Sistema</Label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">ID do Usuário</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{user.user_id}</code>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Criado em</p>
                    <p>{new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <span className="font-medium text-destructive">Zona de Perigo</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Ações irreversíveis que afetam permanentemente este usuário
                </p>
                <Button variant="destructive" size="sm" disabled>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Usuário (em breve)
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => updateUser.mutate()} disabled={updateUser.isPending}>
            {updateUser.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
