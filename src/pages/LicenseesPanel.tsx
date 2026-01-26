import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Crown,
  Shield,
  Star,
  Award,
  Trophy,
  Gem,
  Sparkles,
  Users,
  Building2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type LicenseeTier = 'basic' | 'pro' | 'expert' | 'master' | 'elite' | 'titan' | 'legacy';
type LicenseeStatus = 'active' | 'inactive' | 'pending';

// Define all possible NeoHub profiles
const ALL_PROFILES = ['administrador', 'licenciado', 'colaborador', 'medico', 'aluno', 'paciente', 'cliente_avivar'] as const;
type ProfileKey = typeof ALL_PROFILES[number];

interface Licensee {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  clinic_name: string | null;
  city: string | null;
  state: string | null;
  tier: LicenseeTier;
  status: LicenseeStatus;
  created_at: string;
  profiles: ProfileKey[];
}

const tierConfig: Record<LicenseeTier, { name: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  basic: { name: 'Basic', color: 'text-slate-700', bgColor: 'bg-slate-100', icon: <Shield className="h-4 w-4" /> },
  pro: { name: 'Pro', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: <Star className="h-4 w-4" /> },
  expert: { name: 'Expert', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: <Award className="h-4 w-4" /> },
  master: { name: 'Master', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: <Trophy className="h-4 w-4" /> },
  elite: { name: 'Elite', color: 'text-rose-700', bgColor: 'bg-rose-100', icon: <Gem className="h-4 w-4" /> },
  titan: { name: 'Titan', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: <Crown className="h-4 w-4" /> },
  legacy: { name: 'Legacy', color: 'text-primary', bgColor: 'bg-gradient-to-r from-amber-100 to-yellow-100', icon: <Sparkles className="h-4 w-4" /> },
};

const statusConfig: Record<LicenseeStatus, { label: string; color: string }> = {
  active: { label: 'Ativo', color: 'bg-status-success text-black' },
  inactive: { label: 'Inativo', color: 'bg-status-critical text-black' },
  pending: { label: 'Pendente', color: 'bg-status-warning text-black' },
};

interface FormData {
  name: string;
  email: string;
  phone: string;
  clinic_name: string;
  city: string;
  state: string;
  tier: LicenseeTier;
  status: LicenseeStatus;
}

const emptyFormData: FormData = {
  name: '',
  email: '',
  phone: '',
  clinic_name: '',
  city: '',
  state: '',
  tier: 'basic',
  status: 'pending',
};

export default function LicenseesPanel() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [licensees, setLicensees] = useState<Licensee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLicensee, setEditingLicensee] = useState<Licensee | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [licenseeToDelete, setLicenseeToDelete] = useState<Licensee | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Fetch users with their profiles from neohub_users
  const fetchLicensees = async () => {
    try {
      setIsLoading(true);
      
      // Fetch neohub_users with their profiles
      const { data: neohubUsers, error: neohubError } = await supabase
        .from('neohub_users')
        .select(`
          id,
          user_id,
          full_name,
          email,
          phone,
          is_active,
          created_at,
          neohub_user_profiles (
            profile,
            is_active
          )
        `)
        .order('created_at', { ascending: false });

      if (neohubError) throw neohubError;

      const formattedData: Licensee[] = (neohubUsers || []).map((user: any) => {
        // Extract active profiles
        const activeProfiles = (user.neohub_user_profiles || [])
          .filter((p: any) => p.is_active)
          .map((p: any) => p.profile as ProfileKey);

        return {
          id: user.id,
          user_id: user.user_id,
          name: user.full_name || 'Sem nome',
          email: user.email || '',
          phone: user.phone,
          clinic_name: null,
          city: null,
          state: null,
          tier: 'basic' as LicenseeTier,
          status: user.is_active ? 'active' as LicenseeStatus : 'inactive' as LicenseeStatus,
          created_at: user.created_at,
          profiles: activeProfiles,
        };
      });

      setLicensees(formattedData);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Erro ao carregar alunos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchLicensees();
    }
  }, [isAdmin]);

  const filteredLicensees = licensees.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.clinic_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.city?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (licensee?: Licensee) => {
    if (licensee) {
      setEditingLicensee(licensee);
      setFormData({
        name: licensee.name,
        email: licensee.email,
        phone: licensee.phone || '',
        clinic_name: licensee.clinic_name || '',
        city: licensee.city || '',
        state: licensee.state || '',
        tier: licensee.tier,
        status: licensee.status,
      });
    } else {
      setEditingLicensee(null);
      setFormData(emptyFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    try {
      setIsSaving(true);

      if (editingLicensee) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            clinic_name: formData.clinic_name || null,
            city: formData.city || null,
            state: formData.state || null,
            tier: formData.tier,
            status: formData.status,
          })
          .eq('id', editingLicensee.id);

        if (error) throw error;
        toast.success('Licenciado atualizado com sucesso!');
      } else {
        // For creating new licensees, we need to create an auth user first
        // This should be done through the signup flow
        toast.info('Para adicionar um novo licenciado, ele deve se cadastrar pelo sistema de autenticação.');
        setIsDialogOpen(false);
        return;
      }

      await fetchLicensees();
      setIsDialogOpen(false);
      setEditingLicensee(null);
      setFormData(emptyFormData);
    } catch (error: any) {
      console.error('Error saving licensee:', error);
      toast.error(error.message || 'Erro ao salvar licenciado');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (licensee: Licensee) => {
    setLicenseeToDelete(licensee);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!licenseeToDelete) return;

    try {
      // We can only update status to inactive, not delete auth users
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'inactive' })
        .eq('id', licenseeToDelete.id);

      if (error) throw error;

      toast.success('Licenciado desativado com sucesso');
      await fetchLicensees();
    } catch (error: any) {
      console.error('Error deactivating licensee:', error);
      toast.error(error.message || 'Erro ao desativar licenciado');
    } finally {
      setDeleteDialogOpen(false);
      setLicenseeToDelete(null);
    }
  };

  const stats = {
    total: licensees.length,
    active: licensees.filter(l => l.status === 'active').length,
    pending: licensees.filter(l => l.status === 'pending').length,
    inactive: licensees.filter(l => l.status === 'inactive').length,
  };

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <div className="p-6 pt-16 lg:pt-8 lg:p-8 overflow-x-hidden w-full">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Painel de Alunos IBRAMEC</h1>
          <p className="text-muted-foreground">Gerenciamento de cadastros e perfis</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Alunos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-success/20">
                  <Building2 className="h-5 w-5 text-status-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-warning/20">
                  <Users className="h-5 w-5 text-status-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-status-critical/20">
                  <Users className="h-5 w-5 text-status-critical" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inactive}</p>
                  <p className="text-xs text-muted-foreground">Inativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Add */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, clínica, email ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingLicensee ? 'Editar Aluno' : 'Novo Aluno'}
                </DialogTitle>
                <DialogDescription>
                  {editingLicensee 
                    ? 'Atualize os dados do aluno' 
                    : 'Para adicionar um novo aluno, ele deve se cadastrar pelo sistema'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Dr. João Silva"
                      disabled={!editingLicensee}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinic_name">Nome da Clínica</Label>
                    <Input
                      id="clinic_name"
                      value={formData.clinic_name}
                      onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                      placeholder="Clínica Capilar SP"
                      disabled={!editingLicensee}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@clinica.com"
                      disabled={!editingLicensee}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      disabled={!editingLicensee}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="São Paulo"
                      disabled={!editingLicensee}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="SP"
                      maxLength={2}
                      disabled={!editingLicensee}
                    />
                  </div>
                </div>
                {editingLicensee && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tier">Nível</Label>
                      <Select
                        value={formData.tier}
                        onValueChange={(value: LicenseeTier) => setFormData({ ...formData, tier: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(tierConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                {config.icon}
                                {config.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: LicenseeStatus) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                {editingLicensee && (
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Salvar Alterações
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Lista de Alunos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredLicensees.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm ? 'Nenhum aluno encontrado para a busca.' : 'Nenhum aluno cadastrado.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted">
                      <TableHead className="font-semibold">Aluno</TableHead>
                      <TableHead className="font-semibold">Contato</TableHead>
                      <TableHead className="font-semibold text-center">Admin</TableHead>
                      <TableHead className="font-semibold text-center">Licenciado</TableHead>
                      <TableHead className="font-semibold text-center">Colaborador</TableHead>
                      <TableHead className="font-semibold text-center">Médico</TableHead>
                      <TableHead className="font-semibold text-center">Aluno</TableHead>
                      <TableHead className="font-semibold text-center">Paciente</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLicensees.map((licensee) => {
                      const status = statusConfig[licensee.status] || statusConfig.pending;
                      const hasProfile = (profile: ProfileKey) => licensee.profiles.includes(profile);
                      
                      return (
                        <TableRow key={licensee.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="font-medium">{licensee.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(licensee.created_at).toLocaleDateString('pt-BR')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate max-w-[180px]">{licensee.email}</span>
                              </div>
                              {licensee.phone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  {licensee.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          {/* Profile columns with checkmark indicators */}
                          <TableCell className="text-center">
                            {hasProfile('administrador') ? (
                              <Badge className="bg-purple-100 text-purple-700">✓</Badge>
                            ) : (
                              <span className="text-muted-foreground/40">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {hasProfile('licenciado') ? (
                              <Badge className="bg-amber-100 text-amber-700">✓</Badge>
                            ) : (
                              <span className="text-muted-foreground/40">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {hasProfile('colaborador') ? (
                              <Badge className="bg-blue-100 text-blue-700">✓</Badge>
                            ) : (
                              <span className="text-muted-foreground/40">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {hasProfile('medico') ? (
                              <Badge className="bg-teal-100 text-teal-700">✓</Badge>
                            ) : (
                              <span className="text-muted-foreground/40">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {hasProfile('aluno') ? (
                              <Badge className="bg-emerald-100 text-emerald-700">✓</Badge>
                            ) : (
                              <span className="text-muted-foreground/40">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {hasProfile('paciente') ? (
                              <Badge className="bg-rose-100 text-rose-700">✓</Badge>
                            ) : (
                              <span className="text-muted-foreground/40">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenDialog(licensee)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteClick(licensee)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Desativar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desativar Aluno</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja desativar <strong>{licenseeToDelete?.name}</strong>?
                O aluno será marcado como inativo e não poderá acessar o sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Desativar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
