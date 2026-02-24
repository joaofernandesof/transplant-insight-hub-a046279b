/**
 * Modal completo de edição de usuário
 * Permite editar dados, acessos a portais, status ativo/inativo
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Definição dos portais disponíveis
const AVAILABLE_PORTALS = [
  { id: 'admin', name: 'Portal do Administrador', icon: Crown, color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300' },
  { id: 'neolicense', name: 'Portal do Licenciado', icon: Building2, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  { id: 'avivar', name: 'Portal Avivar', icon: TrendingUp, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' },
  { id: 'ipromed', name: 'Portal CPG Advocacia', icon: Scale, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  { id: 'academy', name: 'Portal Ibramec', icon: GraduationCap, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
  { id: 'neoteam', name: 'Portal do Colaborador', icon: Users, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
  { id: 'neocare', name: 'Portal do Paciente', icon: Heart, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300' },
  { id: 'vision', name: 'Portal Vision', icon: Eye, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300' },
  { id: 'neopay', name: 'Portal NeoPay', icon: CreditCard, color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
];

const ROLES = [
  { id: 'admin', name: 'Administrador', icon: Crown, description: 'Acesso total ao sistema' },
  { id: 'licensee', name: 'Licenciado', icon: Shield, description: 'Acesso ao portal de licenciados' },
  { id: 'colaborador', name: 'Colaborador', icon: Users, description: 'Membro de equipe' },
  { id: 'aluno', name: 'Aluno', icon: GraduationCap, description: 'Acesso à Academy' },
  { id: 'paciente', name: 'Paciente', icon: Heart, description: 'Acesso ao NeoCare' },
];

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
  userRole = 'licensee',
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
  const [allowedPortals, setAllowedPortals] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState(userRole);

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
      setAllowedPortals(user.allowed_portals || []);
      setSelectedRole(userRole);
    }
  }, [user, userRole]);

  // Update user mutation
  const updateUser = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Usuário não encontrado');

      // Update neohub_users
      const { error: userError } = await supabase
        .from('neohub_users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          clinic_name: formData.clinic_name || null,
          address_city: formData.address_city || null,
          address_state: formData.address_state || null,
          crm: formData.crm || null,
          rqe: formData.rqe || null,
          tier: formData.tier,
          is_active: isActive,
          allowed_portals: allowedPortals,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.user_id);

      if (userError) throw userError;

      // Update profiles table for compatibility
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

      // Update user role if changed
      if (selectedRole !== userRole) {
        // 1. Update user_roles table
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: selectedRole as 'admin' | 'licensee' | 'colaborador' | 'aluno' | 'paciente' })
          .eq('user_id', user.user_id);

        if (roleError) throw roleError;

        // 2. Update neohub_user_profiles (the actual permission system)
        // Map app_role to neohub_profile
        const roleToProfileMap: Record<string, string> = {
          admin: 'administrador',
          licensee: 'licenciado',
          colaborador: 'colaborador',
          aluno: 'aluno',
          paciente: 'paciente',
        };

        const oldProfile = roleToProfileMap[userRole] || userRole;
        const newProfile = roleToProfileMap[selectedRole] || selectedRole;

        // Get neohub_user_id
        const { data: neohubUser } = await supabase
          .from('neohub_users')
          .select('id')
          .eq('user_id', user.user_id)
          .single();

        if (neohubUser) {
          // Deactivate old profile
          await supabase
            .from('neohub_user_profiles')
            .update({ is_active: false })
            .eq('neohub_user_id', neohubUser.id)
            .eq('profile', oldProfile as any);

          // Upsert new profile (insert or reactivate)
          const { data: existingProfile } = await supabase
            .from('neohub_user_profiles')
            .select('id')
            .eq('neohub_user_id', neohubUser.id)
            .eq('profile', newProfile as any)
            .maybeSingle();

          if (existingProfile) {
            await supabase
              .from('neohub_user_profiles')
              .update({ is_active: true })
              .eq('id', existingProfile.id);
          } else {
            await supabase
              .from('neohub_user_profiles')
              .insert({
                neohub_user_id: neohubUser.id,
                profile: newProfile as any,
                is_active: true,
              });
          }
        }
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

  const togglePortal = (portalId: string) => {
    setAllowedPortals(prev => 
      prev.includes(portalId)
        ? prev.filter(p => p !== portalId)
        : [...prev, portalId]
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

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

          <ScrollArea className="flex-1 pr-4">
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
                  <Input
                    id="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
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

            {/* Acessos Tab */}
            <TabsContent value="acessos" className="space-y-6 mt-0">
              {/* Perfil do Usuário */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Perfil de Acesso</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <role.icon className="h-4 w-4" />
                          <span>{role.name}</span>
                          <span className="text-xs text-muted-foreground">- {role.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRole === 'admin' && (
                  <div className="flex items-center gap-2 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-700 dark:text-amber-300 text-sm">
                    <Crown className="h-4 w-4" />
                    Administradores têm acesso total a todos os portais
                  </div>
                )}
              </div>

              <Separator />

              {/* Portais Permitidos */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Portais com Acesso</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Selecione quais portais este usuário pode acessar
                </p>
                
                <div className="grid gap-3">
                  {AVAILABLE_PORTALS.map(portal => {
                    const isEnabled = selectedRole === 'admin' || allowedPortals.includes(portal.id);
                    const isAdminOverride = selectedRole === 'admin';
                    
                    return (
                      <div
                        key={portal.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-all",
                          isEnabled ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", portal.color)}>
                            <portal.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{portal.name}</p>
                            <p className="text-xs text-muted-foreground">Portal {portal.id}</p>
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          disabled={isAdminOverride}
                          onCheckedChange={() => togglePortal(portal.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Status Tab */}
            <TabsContent value="status" className="space-y-6 mt-0">
              {/* Status Ativo/Inativo */}
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
                        {isActive 
                          ? 'O usuário pode acessar o sistema normalmente'
                          : 'O usuário não conseguirá fazer login'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              </div>

              <Separator />

              {/* Tier do Usuário */}
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

              {/* Informações do Sistema */}
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

              {/* Zona de Perigo */}
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
          </ScrollArea>
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
