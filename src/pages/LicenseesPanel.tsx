import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
} from "lucide-react";

type LicenseeTier = 'basic' | 'pro' | 'expert' | 'master' | 'elite' | 'titan' | 'legacy';

interface Licensee {
  id: string;
  name: string;
  email: string;
  phone: string;
  clinicName: string;
  city: string;
  state: string;
  tier: LicenseeTier;
  revenue: number;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
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

const statusConfig = {
  active: { label: 'Ativo', color: 'bg-status-success text-black' },
  inactive: { label: 'Inativo', color: 'bg-status-critical text-black' },
  pending: { label: 'Pendente', color: 'bg-status-warning text-black' },
};

// Mock data
const initialLicensees: Licensee[] = [
  {
    id: 'clinic-1',
    name: 'Dr. João Silva',
    email: 'joao@clinica1.com',
    phone: '(11) 99999-1111',
    clinicName: 'Clínica Capilar SP',
    city: 'São Paulo',
    state: 'SP',
    tier: 'pro',
    revenue: 120000,
    status: 'active',
    createdAt: '2024-01-15'
  },
  {
    id: 'clinic-2',
    name: 'Dra. Maria Santos',
    email: 'maria@clinica2.com',
    phone: '(21) 99999-2222',
    clinicName: 'Hair Center RJ',
    city: 'Rio de Janeiro',
    state: 'RJ',
    tier: 'expert',
    revenue: 250000,
    status: 'active',
    createdAt: '2024-02-20'
  },
  {
    id: 'clinic-3',
    name: 'Dr. Carlos Oliveira',
    email: 'carlos@clinica3.com',
    phone: '(31) 99999-3333',
    clinicName: 'Transplante Capilar BH',
    city: 'Belo Horizonte',
    state: 'MG',
    tier: 'master',
    revenue: 520000,
    status: 'active',
    createdAt: '2023-11-10'
  },
  {
    id: 'clinic-4',
    name: 'Dr. Pedro Almeida',
    email: 'pedro@clinica4.com',
    phone: '(41) 99999-4444',
    clinicName: 'Neo Hair Curitiba',
    city: 'Curitiba',
    state: 'PR',
    tier: 'basic',
    revenue: 45000,
    status: 'pending',
    createdAt: '2025-01-05'
  },
];

const emptyLicensee: Omit<Licensee, 'id' | 'createdAt'> = {
  name: '',
  email: '',
  phone: '',
  clinicName: '',
  city: '',
  state: '',
  tier: 'basic',
  revenue: 0,
  status: 'pending',
};

export default function LicenseesPanel() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [licensees, setLicensees] = useState<Licensee[]>(initialLicensees);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLicensee, setEditingLicensee] = useState<Licensee | null>(null);
  const [formData, setFormData] = useState<Omit<Licensee, 'id' | 'createdAt'>>(emptyLicensee);

  // Redirect if not admin
  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const filteredLicensees = licensees.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.clinicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (licensee?: Licensee) => {
    if (licensee) {
      setEditingLicensee(licensee);
      setFormData({
        name: licensee.name,
        email: licensee.email,
        phone: licensee.phone,
        clinicName: licensee.clinicName,
        city: licensee.city,
        state: licensee.state,
        tier: licensee.tier,
        revenue: licensee.revenue,
        status: licensee.status,
      });
    } else {
      setEditingLicensee(null);
      setFormData(emptyLicensee);
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingLicensee) {
      setLicensees(prev =>
        prev.map(l =>
          l.id === editingLicensee.id
            ? { ...l, ...formData }
            : l
        )
      );
    } else {
      const newLicensee: Licensee = {
        id: `clinic-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setLicensees(prev => [...prev, newLicensee]);
    }
    setIsDialogOpen(false);
    setEditingLicensee(null);
    setFormData(emptyLicensee);
  };

  const handleDelete = (id: string) => {
    setLicensees(prev => prev.filter(l => l.id !== id));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const stats = {
    total: licensees.length,
    active: licensees.filter(l => l.status === 'active').length,
    pending: licensees.filter(l => l.status === 'pending').length,
    totalRevenue: licensees.reduce((acc, l) => acc + l.revenue, 0),
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Painel de Licenciados</h1>
          <p className="text-muted-foreground">Gerenciamento de cadastros</p>
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
                  <p className="text-xs text-muted-foreground">Total Licenciados</p>
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
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Trophy className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Faturamento Total</p>
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
                Novo Licenciado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingLicensee ? 'Editar Licenciado' : 'Novo Licenciado'}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados do licenciado
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Dr. João Silva"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicName">Nome da Clínica</Label>
                    <Input
                      id="clinicName"
                      value={formData.clinicName}
                      onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                      placeholder="Clínica Capilar SP"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@clinica.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
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
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
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
                    <Label htmlFor="revenue">Faturamento (R$)</Label>
                    <Input
                      id="revenue"
                      type="number"
                      value={formData.revenue}
                      onChange={(e) => setFormData({ ...formData, revenue: Number(e.target.value) })}
                      placeholder="100000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'active' | 'inactive' | 'pending') => setFormData({ ...formData, status: value })}
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {editingLicensee ? 'Salvar Alterações' : 'Criar Licenciado'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Lista de Licenciados</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="font-semibold">Licenciado</TableHead>
                    <TableHead className="font-semibold">Clínica</TableHead>
                    <TableHead className="font-semibold">Localização</TableHead>
                    <TableHead className="font-semibold">Contato</TableHead>
                    <TableHead className="font-semibold">Nível</TableHead>
                    <TableHead className="font-semibold text-right">Faturamento</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLicensees.map((licensee) => {
                    const tier = tierConfig[licensee.tier];
                    const status = statusConfig[licensee.status];
                    return (
                      <TableRow key={licensee.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="font-medium">{licensee.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Desde {new Date(licensee.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {licensee.clinicName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {licensee.city}/{licensee.state}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {licensee.email}
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {licensee.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${tier.bgColor} ${tier.color} gap-1`}>
                            {tier.icon}
                            {tier.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(licensee.revenue)}
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
                                className="text-destructive"
                                onClick={() => handleDelete(licensee.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredLicensees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum licenciado encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
