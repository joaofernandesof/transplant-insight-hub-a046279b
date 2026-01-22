import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, Search, Plus, MoreVertical,
  Phone, Mail, Eye, Edit,
  Download, Loader2, X,
  ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, MessageCircle, Calendar
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { PatientRegistrationDialog } from '@/neohub/components/PatientRegistrationDialog';
import { DocumentUploadDialog } from '@/neohub/components/DocumentUploadDialog';
import { PatientFiltersDropdown } from '@/neohub/components/PatientFiltersDropdown';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  maritalStatus: string;
  nationality: string;
  address: string;
  city: string;
  state: string;
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
  createdAt?: string;
  surgeryDate?: string;
  consultant?: string;
  seller?: string;
}

type SortField = 'name' | 'branch' | 'category' | 'baldnessGrade' | 'createdAt' | 'city' | 'surgeryDate';
type SortDirection = 'asc' | 'desc';

// Helper to parse notes field with all data
const parseNotes = (notes: string | null): Record<string, string> => {
  if (!notes) return {};
  const result: Record<string, string> = {};
  
  // Parse pipe-separated values
  const pairs = notes.split('|');
  for (const pair of pairs) {
    const match = pair.match(/([^:]+):\s*(.+)/);
    if (match) {
      const key = match[1].trim().toLowerCase();
      result[key] = match[2].trim();
    }
  }
  
  return result;
};

// Category colors
const getCategoryColor = (category: string) => {
  if (!category) return 'bg-muted text-muted-foreground';
  const upper = category.toUpperCase();
  if (upper.includes('CATEGORIA A')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (upper.includes('CATEGORIA B')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (upper.includes('CATEGORIA C')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  if (upper.includes('CATEGORIA D')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
  if (upper.includes('CATEGORIA E')) return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
  return 'bg-muted text-muted-foreground';
};

// Branch colors
const getBranchColor = (branch: string) => {
  if (!branch) return 'bg-muted text-muted-foreground';
  const upper = branch.toUpperCase();
  if (upper.includes('BELO HORIZONTE')) return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
  if (upper.includes('SAO PAULO') || upper.includes('SÃO PAULO')) return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';
  if (upper.includes('RIO DE JANEIRO')) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
  if (upper.includes('FORTALEZA')) return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
  if (upper.includes('JUAZEIRO')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  if (upper.includes('BRASILIA') || upper.includes('BRASÍLIA')) return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
  if (upper.includes('RECIFE')) return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
  if (upper.includes('SALVADOR')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  if (upper.includes('CURITIBA')) return 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400';
  if (upper.includes('CAMPINAS')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (upper.includes('PORTO ALEGRE')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (upper.includes('GOIANIA') || upper.includes('GOIÂNIA')) return 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400';
  if (upper.includes('MANAUS')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (upper.includes('VITORIA') || upper.includes('VITÓRIA')) return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
  if (upper.includes('FLORIANOPOLIS') || upper.includes('FLORIANÓPOLIS')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400';
};

// Grade colors
const getGradeColor = (grade: string) => {
  const num = Number(grade);
  if (num <= 2) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (num <= 4) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (num <= 5) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
};

const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100, 200];

export default function NeoTeamPatients() {
  // Search state - single unified search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter states
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  
  // Data states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Derived filter options
  const branches = useMemo(() => {
    const set = new Set(patients.map(p => p.branch).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [patients]);

  const categories = useMemo(() => {
    const set = new Set(patients.map(p => p.category).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [patients]);

  const grades = useMemo(() => {
    const set = new Set(patients.map(p => p.baldnessGrade).filter(Boolean) as string[]);
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [patients]);

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('clinic_patients')
          .select('*')
          .order('full_name', { ascending: true })
          .limit(1000);

        if (error) throw error;

        const mappedPatients: Patient[] = (data || []).map(p => {
          const parsed = parseNotes(p.notes);
          return {
            id: p.id,
            name: p.full_name,
            email: p.email || '',
            phone: p.phone || '',
            cpf: p.cpf || '',
            birthDate: parsed['nascimento'] || parsed['data nascimento'] || '',
            maritalStatus: parsed['estado civil'] || '',
            nationality: parsed['nacionalidade'] || '',
            address: parsed['endereço'] || parsed['endereco'] || '',
            city: parsed['cidade'] || '',
            state: parsed['estado'] || parsed['uf'] || '',
            gender: 'O' as const,
            totalVisits: 0,
            status: 'active' as const,
            tags: [],
            branch: parsed['filial'] || '',
            category: parsed['categoria'] || '',
            baldnessGrade: parsed['grau'] || '',
            createdAt: p.created_at,
            surgeryDate: parsed['data cirurgia'] || parsed['cirurgia'] || '',
            consultant: parsed['consultor'] || '',
            seller: parsed['vendedor'] || '',
          };
        });

        setPatients(mappedPatients);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Stats for filters
  const stats = useMemo(() => ({
    total: patients.length,
    byBranch: branches.reduce((acc, b) => {
      acc[b] = patients.filter(p => p.branch === b).length;
      return acc;
    }, {} as Record<string, number>),
    byCategory: categories.reduce((acc, c) => {
      acc[c] = patients.filter(p => p.category === c).length;
      return acc;
    }, {} as Record<string, number>),
    byGrade: grades.reduce((acc, g) => {
      acc[g] = patients.filter(p => p.baldnessGrade === g).length;
      return acc;
    }, {} as Record<string, number>),
  }), [patients, branches, categories, grades]);

  // Unified search across all fields
  const filteredAndSortedPatients = useMemo(() => {
    let result = patients.filter(p => {
      const searchLower = searchTerm.toLowerCase();
      let matchesSearch = true;
      
      if (searchTerm) {
        matchesSearch = 
          p.name.toLowerCase().includes(searchLower) ||
          p.email.toLowerCase().includes(searchLower) ||
          p.phone.includes(searchTerm) ||
          p.cpf.includes(searchTerm) ||
          (p.branch?.toLowerCase().includes(searchLower) ?? false) ||
          (p.category?.toLowerCase().includes(searchLower) ?? false) ||
          (p.city?.toLowerCase().includes(searchLower) ?? false) ||
          (p.consultant?.toLowerCase().includes(searchLower) ?? false) ||
          (p.seller?.toLowerCase().includes(searchLower) ?? false);
      }
      
      const matchesBranch = selectedBranches.length === 0 || (p.branch && selectedBranches.includes(p.branch));
      const matchesCategory = selectedCategories.length === 0 || (p.category && selectedCategories.includes(p.category));
      const matchesGrade = selectedGrades.length === 0 || (p.baldnessGrade && selectedGrades.includes(p.baldnessGrade));
      
      return matchesSearch && matchesBranch && matchesCategory && matchesGrade;
    });

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'branch':
          comparison = (a.branch || '').localeCompare(b.branch || '');
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        case 'baldnessGrade':
          comparison = Number(a.baldnessGrade || 0) - Number(b.baldnessGrade || 0);
          break;
        case 'city':
          comparison = (a.city || '').localeCompare(b.city || '');
          break;
        case 'surgeryDate':
          comparison = (a.surgeryDate || '').localeCompare(b.surgeryDate || '');
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [patients, searchTerm, selectedBranches, selectedCategories, selectedGrades, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPatients.length / itemsPerPage);
  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedPatients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedPatients, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBranches, selectedCategories, selectedGrades]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Breadcrumb */}
      <NeoTeamBreadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Pacientes
          </h1>
          <p className="text-muted-foreground">
            {stats.total} pacientes cadastrados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button className="gap-2" onClick={() => setShowNewPatient(true)}>
            <Plus className="h-4 w-4" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, telefone, CPF, filial, categoria, cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-10"
            />
            {searchTerm && (
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters - Dropdown Style */}
      <PatientFiltersDropdown
        branches={branches}
        categories={categories}
        grades={grades}
        selectedBranches={selectedBranches}
        selectedCategories={selectedCategories}
        selectedGrades={selectedGrades}
        onBranchChange={setSelectedBranches}
        onCategoryChange={setSelectedCategories}
        onGradeChange={setSelectedGrades}
        stats={stats}
        getCategoryColor={getCategoryColor}
        getBranchColor={getBranchColor}
        getGradeColor={getGradeColor}
      />

      {/* Table */}
      <Card>
        {/* Pagination at Top */}
        {totalPages > 1 && (
          <div className="border-b p-4 flex items-center justify-between bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages} • {filteredAndSortedPatients.length} pacientes
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Por página:</span>
              <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {ITEMS_PER_PAGE_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-8"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-0 overflow-x-auto">
          <Table className="table-fixed min-w-[1800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[240px] cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-2">
                    Paciente
                    <SortIcon field="name" />
                  </div>
                </TableHead>
                <TableHead className="w-[200px]">Contato</TableHead>
                <TableHead className="w-[140px] cursor-pointer" onClick={() => handleSort('branch')}>
                  <div className="flex items-center gap-2">
                    Filial
                    <SortIcon field="branch" />
                  </div>
                </TableHead>
                <TableHead className="w-[160px] cursor-pointer" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-2">
                    Categoria
                    <SortIcon field="category" />
                  </div>
                </TableHead>
                <TableHead className="w-[80px] cursor-pointer text-center" onClick={() => handleSort('baldnessGrade')}>
                  <div className="flex items-center justify-center gap-2">
                    Grau
                    <SortIcon field="baldnessGrade" />
                  </div>
                </TableHead>
                <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort('city')}>
                  <div className="flex items-center gap-2">
                    Cidade
                    <SortIcon field="city" />
                  </div>
                </TableHead>
                <TableHead className="w-[120px]">Consultor</TableHead>
                <TableHead className="w-[120px]">Vendedor</TableHead>
                <TableHead className="w-[110px] cursor-pointer" onClick={() => handleSort('surgeryDate')}>
                  <div className="flex items-center gap-2">
                    Cirurgia
                    <SortIcon field="surgeryDate" />
                  </div>
                </TableHead>
                <TableHead className="w-[90px] text-center">Status</TableHead>
                <TableHead className="w-[80px] text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : paginatedPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    Nenhum paciente encontrado
                  </TableCell>
                </TableRow>
              ) : paginatedPatients.map((patient) => (
                <TableRow key={patient.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {patient.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{patient.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{patient.cpf}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {patient.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{patient.email}</span>
                        </p>
                      )}
                      {patient.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">{patient.phone}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => openWhatsApp(patient.phone)}
                            title="Abrir WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {patient.branch ? (
                      <Badge className={`text-xs ${getBranchColor(patient.branch)}`}>
                        {patient.branch}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {patient.category ? (
                      <Badge className={`text-xs ${getCategoryColor(patient.category)}`}>
                        {patient.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {patient.baldnessGrade ? (
                      <Badge className={`text-xs ${getGradeColor(patient.baldnessGrade)}`}>
                        {patient.baldnessGrade}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm truncate">{patient.city || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm truncate">{patient.consultant || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm truncate">{patient.seller || '—'}</span>
                  </TableCell>
                  <TableCell>
                    {patient.surgeryDate ? (
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {patient.surgeryDate}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Ativo
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem className="gap-2">
                          <Eye className="h-4 w-4" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Edit className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="gap-2"
                          onClick={() => {
                            setSelectedPatientId(patient.id);
                            setShowDocumentUpload(true);
                          }}
                        >
                          <Download className="h-4 w-4" />
                          Documentos
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

      {/* Dialogs */}
      <PatientRegistrationDialog
        open={showNewPatient}
        onOpenChange={setShowNewPatient}
        onSuccess={() => {
          setShowNewPatient(false);
        }}
      />

      <DocumentUploadDialog
        open={showDocumentUpload}
        onOpenChange={setShowDocumentUpload}
        patientId={selectedPatientId}
      />
    </div>
  );
}
