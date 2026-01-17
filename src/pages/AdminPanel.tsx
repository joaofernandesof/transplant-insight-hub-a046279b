import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Settings, 
  Eye,
  EyeOff,
  Users,
  FileText,
  Sliders,
  Save,
  Loader2,
  Shield,
  UserCheck,
  UserX,
  Crown
} from 'lucide-react';
import logoByNeofolic from '@/assets/logo-byneofolic.png';
import { toast } from 'sonner';

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
  email: string;
  clinic_name: string | null;
  status: string;
  tier: string | null;
  avatar_url: string | null;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'licensee';
}

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
  const [activeTab, setActiveTab] = useState('visibility');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
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

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);

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
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('name'),
        supabase.from('user_roles').select('*')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      setUsers(profilesRes.data || []);
      setUserRoles(rolesRes.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
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

  const toggleUserRole = async (userId: string, currentRole: 'admin' | 'licensee') => {
    const newRole = currentRole === 'admin' ? 'licensee' : 'admin';
    
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

  const getUserRole = (userId: string): 'admin' | 'licensee' => {
    return userRoles.find(r => r.user_id === userId)?.role || 'licensee';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img src={logoByNeofolic} alt="ByNeofolic" className="h-10 object-contain" />
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              Painel Administrativo
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="visibility" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visibilidade
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

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

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Usuários</CardTitle>
                <CardDescription>
                  Gerencie permissões e acesso dos usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((userProfile) => {
                    const role = getUserRole(userProfile.user_id);
                    const isCurrentUser = userProfile.user_id === user?.id;
                    
                    return (
                      <div key={userProfile.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={userProfile.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(userProfile.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{userProfile.name}</p>
                              {isCurrentUser && <Badge variant="outline">Você</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
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
                      </div>
                    );
                  })}
                </div>
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
      </main>
    </div>
  );
}
