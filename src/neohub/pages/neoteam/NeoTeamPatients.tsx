import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, Search, Plus, Filter, MoreVertical,
  Phone, Mail, Calendar, FileText, Eye, Edit,
  Download, Upload, Loader2, X, Building, Tag
} from 'lucide-react';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { PatientRegistrationDialog } from '@/neohub/components/PatientRegistrationDialog';
import { DocumentUploadDialog } from '@/neohub/components/DocumentUploadDialog';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  gender: 'M' | 'F' | 'O';
  lastVisit?: string;
  nextAppointment?: string;
  totalVisits: number;
  status: 'active' | 'inactive' | 'pending';
  tags: string[];
  portalUserId?: string;
  branch?: string;
  category?: string;
  baldnessGrade?: string;
}

// Helper to parse notes field
const parseNotes = (notes: string | null): { branch?: string; category?: string; baldnessGrade?: string } => {
  if (!notes) return {};
  const result: { branch?: string; category?: string; baldnessGrade?: string } = {};
  
  const branchMatch = notes.match(/Filial:\s*([^|]+)/i);
  if (branchMatch) result.branch = branchMatch[1].trim();
  
  const categoryMatch = notes.match(/Categoria:\s*([^|]+)/i);
  if (categoryMatch) result.category = categoryMatch[1].trim();
  
  const gradeMatch = notes.match(/Grau:\s*(\d+)/i);
  if (gradeMatch) result.baldnessGrade = gradeMatch[1].trim();
  
  return result;
};

export default function NeoTeamPatients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadPatientId, setUploadPatientId] = useState<string | undefined>();
  const [uploadPatientName, setUploadPatientName] = useState<string | undefined>();
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      // Fetch from clinic_patients (unified patient table)
      const { data: patientsData, error } = await supabase
        .from('clinic_patients')
        .select('*')
        .order('full_name', { ascending: true })
        .limit(200);

      if (error) throw error;

      const formattedPatients: Patient[] = (patientsData || []).map(p => {
        const parsed = parseNotes(p.notes);
        return {
          id: p.id,
          name: p.full_name || 'Sem nome',
          email: p.email || '',
          phone: p.phone || '',
          cpf: p.cpf || '',
          birthDate: '',
          gender: 'O' as const,
          lastVisit: undefined,
          nextAppointment: undefined,
          totalVisits: 0,
          status: 'active' as const,
          tags: [],
          portalUserId: undefined,
          branch: parsed.branch,
          category: parsed.category,
          baldnessGrade: parsed.baldnessGrade,
        };
      });

      setPatients(formattedPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleUploadDocument = (patient: Patient) => {
    setUploadPatientId(patient.id);
    setUploadPatientName(patient.name);
    setShowUploadDialog(true);
  };

  // Get unique branches and categories for filter dropdowns
  const branches = [...new Set(patients.map(p => p.branch).filter(Boolean))] as string[];
  const categories = [...new Set(patients.map(p => p.category).filter(Boolean))] as string[];

  // Filtered patients
  const filteredPatients = patients.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      p.cpf.includes(searchTerm);
    
    const matchesBranch = selectedBranch === 'all' || p.branch === selectedBranch;
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    
    return matchesSearch && matchesBranch && matchesCategory;
  });

  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === 'active').length,
    withAppointment: patients.filter(p => p.nextAppointment).length,
    newThisMonth: 12,
  };

  const getStatusBadge = (status: Patient['status']) => {
    const config = {
      active: { label: 'Ativo', variant: 'default' as const },
      inactive: { label: 'Inativo', variant: 'secondary' as const },
      pending: { label: 'Pendente', variant: 'outline' as const },
    };
    return config[status];
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            Pacientes
          </h1>
          <p className="text-muted-foreground">Gerencie o cadastro de pacientes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          <Button className="gap-2" onClick={() => setShowRegistrationDialog(true)}>
            <Plus className="h-4 w-4" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Patient Registration Dialog */}
      <PatientRegistrationDialog 
        open={showRegistrationDialog} 
        onOpenChange={setShowRegistrationDialog}
        onSuccess={fetchPatients}
      />

      {/* Document Upload Dialog */}
      <DocumentUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        patientId={uploadPatientId}
        patientName={uploadPatientName}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total de Pacientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-sm text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-blue-600">{stats.withAppointment}</p>
            <p className="text-sm text-muted-foreground">Com Agendamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-purple-600">{stats.newThisMonth}</p>
            <p className="text-sm text-muted-foreground">Novos este Mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, telefone ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant={showFilters ? "default" : "outline"} 
              size="sm" 
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {(selectedBranch !== 'all' || selectedCategory !== 'all') && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                  {(selectedBranch !== 'all' ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0)}
                </Badge>
              )}
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="border-dashed">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2 min-w-[180px]">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Filial
                  </label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as filiais" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as filiais</SelectItem>
                      {branches.sort().map(branch => (
                        <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 min-w-[180px]">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Categoria
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.sort().map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(selectedBranch !== 'all' || selectedCategory !== 'all') && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2 text-muted-foreground"
                    onClick={() => {
                      setSelectedBranch('all');
                      setSelectedCategory('all');
                    }}
                  >
                    <X className="h-4 w-4" />
                    Limpar filtros
                  </Button>
                )}

                <div className="ml-auto text-sm text-muted-foreground">
                  {filteredPatients.length} de {patients.length} pacientes
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Última Visita</TableHead>
                <TableHead>Próximo Agendamento</TableHead>
                <TableHead>Consultas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum paciente encontrado
                  </TableCell>
                </TableRow>
              ) : filteredPatients.map((patient) => (
                <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">{patient.cpf}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {patient.phone}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {patient.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatDate(patient.lastVisit)}</span>
                  </TableCell>
                  <TableCell>
                    {patient.nextAppointment ? (
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(patient.nextAppointment)}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{patient.totalVisits}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(patient.status).variant}>
                      {getStatusBadge(patient.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUploadDocument(patient)}>
                            <Upload className="h-4 w-4 mr-2" />
                            Enviar Documento
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            Prontuário
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="h-4 w-4 mr-2" />
                            Agendar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Phone className="h-4 w-4 mr-2" />
                          Ligar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
