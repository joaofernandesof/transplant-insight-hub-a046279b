/**
 * Modal completo de edição de usuário
 * Permite editar dados, acessos (Portal × Perfil), status ativo/inativo
 */

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  'academy': { name: 'NeoAcademy', icon: GraduationCap, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
  'neolicense': { name: 'NeoLicense', icon: Building2, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  'avivar': { name: 'Avivar', icon: TrendingUp, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' },
  'ipromed': { name: 'CPG Advocacia', icon: Scale, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  'neorh': { name: 'NeoRH', icon: Users, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' },
  'neopay': { name: 'NeoPay', icon: CreditCard, color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
  'vision': { name: 'Vision', icon: Eye, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300' },
  'hotleads': { name: 'HotLeads', icon: TrendingUp, color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
  'neohair': { name: 'NeoHair', icon: Heart, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' },
};

// Portal role assignment for this user
interface PortalRoleAssignment {
  portalId: string;
  portalSlug: string;
  portalName: string;
  roleId: string | null; // null = no access
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
  const [portalRoles, setPortalRoles] = useState<Record<string, string | null>>({}); // portalId -> roleId | null
  const [loadingAccess, setLoadingAccess] = useState(false);

  // Reset form when user changes
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
    }
  }, [user]);

  // Load portals, roles, and user assignments
  useEffect(() => {
    if (!user || !open) return;
    
    const loadAccessData = async () => {
      setLoadingAccess(true);
      try {
        const [portalsRes, rolesRes, assignmentsRes] = await Promise.all([
          supabase.from('portals').select('id, slug, name').eq('is_active', true).order('order_index'),
          supabase.from('roles').select('id, name').order('hierarchy_level'),
          supabase.from('user_portal_roles').select('portal_id, role_id').eq('user_id', user.id).eq('is_active', true),
        ]);

        if (portalsRes.data) setDbPortals(portalsRes.data);
        if (rolesRes.data) setDbRoles(rolesRes.data);

        // Build portal -> role map
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

      // 3. Sync user_portal_roles: delete all, then insert active ones
      await supabase
        .from('user_portal_roles')
        .delete()
        .eq('user_id', user.id);

      const newAssignments = Object.entries(portalRoles)
        .filter(([_, roleId]) => roleId !== null)
        .map(([portalId, roleId]) => ({
          user_id: user.id,
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
    setPortalRoles(prev => ({ ...prev, [portalId]: roleId }));
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
            </TabsContent>

            {/* Acessos Tab - Portal × Perfil */}
            <TabsContent value="acessos" className="space-y-4 mt-0">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Portal × Perfil de Acesso</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Defina o perfil de acesso para cada portal. Deixe "Sem Acesso" para bloquear.
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
                    const roleName = getRoleName(currentRoleId);
                    const hasAccess = currentRoleId !== null;
                    const Icon = config.icon;

                    return (
                      <div
                        key={portal.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all",
                          hasAccess ? "bg-primary/5 border-primary/20" : "bg-muted/20 border-border/50"
                        )}
                      >
                        <div className={cn("p-2 rounded-lg shrink-0", config.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{config.name}</p>
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setPortalRole(portal.id, null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
