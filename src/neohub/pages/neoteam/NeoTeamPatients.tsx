import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
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
  Download, Upload, Loader2, X, Building, Tag,
  ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal,
  BarChart3, Hash, ChevronLeft, ChevronRight
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
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  createdAt?: string;
}

type SortField = 'name' | 'branch' | 'category' | 'baldnessGrade' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type SearchField = 'all' | 'name' | 'email' | 'cpf' | 'phone';

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

const ITEMS_PER_PAGE_OPTIONS = [25, 50, 100, 200];

export default function NeoTeamPatients() {
  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  
  // Filter states
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // UI states
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadPatientId, setUploadPatientId] = useState<string | undefined>();
  const [uploadPatientName, setUploadPatientName] = useState<string | undefined>();

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const { data: patientsData, error } = await supabase
        .from('clinic_patients')
        .select('*')
        .order('full_name', { ascending: true })
        .limit(1000);

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
          createdAt: p.created_at,
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

  // Get unique values for filter dropdowns
  const branches = useMemo(() => 
    [...new Set(patients.map(p => p.branch).filter(Boolean))].sort() as string[], 
    [patients]
  );
  const categories = useMemo(() => 
    [...new Set(patients.map(p => p.category).filter(Boolean))].sort() as string[], 
    [patients]
  );
  const grades = useMemo(() => 
    [...new Set(patients.map(p => p.baldnessGrade).filter(Boolean))].sort((a, b) => Number(a) - Number(b)) as string[], 
    [patients]
  );

  // Filtered and sorted patients
  const filteredAndSortedPatients = useMemo(() => {
    let result = patients.filter(p => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      let matchesSearch = true;
      
      if (searchTerm) {
        switch (searchField) {
          case 'name':
            matchesSearch = p.name.toLowerCase().includes(searchLower);
            break;
          case 'email':
            matchesSearch = p.email.toLowerCase().includes(searchLower);
            break;
          case 'cpf':
            matchesSearch = p.cpf.includes(searchTerm);
            break;
          case 'phone':
            matchesSearch = p.phone.includes(searchTerm);
            break;
          default:
            matchesSearch = 
              p.name.toLowerCase().includes(searchLower) ||
              p.email.toLowerCase().includes(searchLower) ||
              p.phone.includes(searchTerm) ||
              p.cpf.includes(searchTerm);
        }
      }
      
      // Multi-select filters
      const matchesBranch = selectedBranches.length === 0 || (p.branch && selectedBranches.includes(p.branch));
      const matchesCategory = selectedCategories.length === 0 || (p.category && selectedCategories.includes(p.category));
      const matchesGrade = selectedGrades.length === 0 || (p.baldnessGrade && selectedGrades.includes(p.baldnessGrade));
      
      return matchesSearch && matchesBranch && matchesCategory && matchesGrade;
    });

    // Sort
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
        case 'createdAt':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [patients, searchTerm, searchField, selectedBranches, selectedCategories, selectedGrades, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPatients.length / itemsPerPage);
  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedPatients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedPatients, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, searchField, selectedBranches, selectedCategories, selectedGrades]);

  // Stats
  const stats = useMemo(() => ({
    total: patients.length,
    filtered: filteredAndSortedPatients.length,
    byBranch: branches.reduce((acc, b) => {
      acc[b] = patients.filter(p => p.branch === b).length;
      return acc;
    }, {} as Record<string, number>),
    byCategory: categories.reduce((acc, c) => {
      acc[c] = patients.filter(p => p.category === c).length;
      return acc;
    }, {} as Record<string, number>),
  }), [patients, filteredAndSortedPatients, branches, categories]);

  const activeFiltersCount = selectedBranches.length + selectedCategories.length + selectedGrades.length;

  const clearAllFilters = () => {
    setSelectedBranches([]);
    setSelectedCategories([]);
    setSelectedGrades([]);
    setSearchTerm('');
    setSearchField('all');
  };

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

  const toggleBranch = (branch: string) => {
    setSelectedBranches(prev => 
      prev.includes(branch) ? prev.filter(b => b !== branch) : [...prev, branch]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const toggleGrade = (grade: string) => {
    setSelectedGrades(prev => 
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
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

      {/* Dialogs */}
      <PatientRegistrationDialog 
        open={showRegistrationDialog} 
        onOpenChange={setShowRegistrationDialog}
        onSuccess={fetchPatients}
      />
      <DocumentUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        patientId={uploadPatientId}
        patientName={uploadPatientName}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total de Pacientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-primary">{stats.filtered}</p>
            <p className="text-sm text-muted-foreground">
              {activeFiltersCount > 0 || searchTerm ? 'Filtrados' : 'Ativos'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{branches.length}</p>
            <p className="text-sm text-muted-foreground">Filiais</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{categories.length}</p>
            <p className="text-sm text-muted-foreground">Categorias</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Main Search Row */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input with Field Selector */}
            <div className="flex-1 flex gap-2">
              <Select value={searchField} onValueChange={(v) => setSearchField(v as SearchField)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Buscar em..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos campos</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={
                    searchField === 'all' ? 'Buscar por nome, email, telefone ou CPF...' :
                    searchField === 'name' ? 'Buscar por nome...' :
                    searchField === 'email' ? 'Buscar por email...' :
                    searchField === 'cpf' ? 'Buscar por CPF...' :
                    'Buscar por telefone...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
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
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant={showFilters ? "default" : "outline"} 
                className="gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros Avançados
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              
              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Ordenar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem 
                    checked={sortField === 'name'}
                    onCheckedChange={() => handleSort('name')}
                  >
                    Nome {sortField === 'name' && (sortDirection === 'asc' ? '(A-Z)' : '(Z-A)')}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem 
                    checked={sortField === 'branch'}
                    onCheckedChange={() => handleSort('branch')}
                  >
                    Filial {sortField === 'branch' && (sortDirection === 'asc' ? '(A-Z)' : '(Z-A)')}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem 
                    checked={sortField === 'category'}
                    onCheckedChange={() => handleSort('category')}
                  >
                    Categoria {sortField === 'category' && (sortDirection === 'asc' ? '(A-Z)' : '(Z-A)')}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem 
                    checked={sortField === 'baldnessGrade'}
                    onCheckedChange={() => handleSort('baldnessGrade')}
                  >
                    Grau {sortField === 'baldnessGrade' && (sortDirection === 'asc' ? '(1-7)' : '(7-1)')}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem 
                    checked={sortField === 'createdAt'}
                    onCheckedChange={() => handleSort('createdAt')}
                  >
                    Data Cadastro {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Branch Filter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Building className="h-4 w-4" />
                      Filial ({selectedBranches.length}/{branches.length})
                    </Label>
                    {selectedBranches.length > 0 && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setSelectedBranches([])}>
                        Limpar
                      </Button>
                    )}
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3 bg-muted/30">
                    {branches.map(branch => (
                      <div key={branch} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`branch-${branch}`}
                          checked={selectedBranches.includes(branch)}
                          onCheckedChange={() => toggleBranch(branch)}
                        />
                        <label 
                          htmlFor={`branch-${branch}`}
                          className="text-sm flex-1 cursor-pointer flex justify-between"
                        >
                          <span>{branch}</span>
                          <span className="text-muted-foreground">({stats.byBranch[branch]})</span>
                        </label>
                      </div>
                    ))}
                    {branches.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">Nenhuma filial</p>
                    )}
                  </div>
                </div>

                {/* Category Filter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Tag className="h-4 w-4" />
                      Categoria ({selectedCategories.length}/{categories.length})
                    </Label>
                    {selectedCategories.length > 0 && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setSelectedCategories([])}>
                        Limpar
                      </Button>
                    )}
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3 bg-muted/30">
                    {categories.map(cat => (
                      <div key={cat} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`cat-${cat}`}
                          checked={selectedCategories.includes(cat)}
                          onCheckedChange={() => toggleCategory(cat)}
                        />
                        <label 
                          htmlFor={`cat-${cat}`}
                          className="text-sm flex-1 cursor-pointer flex justify-between"
                        >
                          <span>{cat}</span>
                          <span className="text-muted-foreground">({stats.byCategory[cat]})</span>
                        </label>
                      </div>
                    ))}
                    {categories.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">Nenhuma categoria</p>
                    )}
                  </div>
                </div>

                {/* Grade Filter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <BarChart3 className="h-4 w-4" />
                      Grau de Calvície ({selectedGrades.length}/{grades.length})
                    </Label>
                    {selectedGrades.length > 0 && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setSelectedGrades([])}>
                        Limpar
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {grades.map(grade => (
                      <Button
                        key={grade}
                        variant={selectedGrades.includes(grade) ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-10"
                        onClick={() => toggleGrade(grade)}
                      >
                        {grade}
                      </Button>
                    ))}
                    {grades.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nenhum grau definido</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Filters Summary */}
              {activeFiltersCount > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                    {selectedBranches.map(b => (
                      <Badge key={b} variant="secondary" className="gap-1">
                        <Building className="h-3 w-3" />
                        {b}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => toggleBranch(b)} />
                      </Badge>
                    ))}
                    {selectedCategories.map(c => (
                      <Badge key={c} variant="secondary" className="gap-1">
                        <Tag className="h-3 w-3" />
                        {c}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => toggleCategory(c)} />
                      </Badge>
                    ))}
                    {selectedGrades.map(g => (
                      <Badge key={g} variant="secondary" className="gap-1">
                        Grau {g}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => toggleGrade(g)} />
                      </Badge>
                    ))}
                    <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={clearAllFilters}>
                      Limpar todos
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Exibindo {paginatedPatients.length} de {filteredAndSortedPatients.length} pacientes
              {activeFiltersCount > 0 || searchTerm ? ` (filtrado de ${stats.total})` : ''}
            </span>
            <div className="flex items-center gap-2">
              <span>Itens por página:</span>
              <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE_OPTIONS.map(n => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-2">
                    Paciente
                    <SortIcon field="name" />
                  </div>
                </TableHead>
                <TableHead>Contato</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('branch')}>
                  <div className="flex items-center gap-2">
                    Filial
                    <SortIcon field="branch" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-2">
                    Categoria
                    <SortIcon field="category" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('baldnessGrade')}>
                  <div className="flex items-center gap-2">
                    Grau
                    <SortIcon field="baldnessGrade" />
                  </div>
                </TableHead>
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
              ) : paginatedPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum paciente encontrado
                  </TableCell>
                </TableRow>
              ) : paginatedPatients.map((patient) => (
                <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {patient.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">{patient.cpf}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {patient.phone && (
                        <p className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {patient.phone}
                        </p>
                      )}
                      {patient.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate max-w-[200px]">
                          <Mail className="h-3 w-3" />
                          {patient.email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {patient.branch ? (
                      <Badge variant="outline" className="text-xs">
                        {patient.branch}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {patient.category ? (
                      <Badge variant="secondary" className="text-xs">
                        {patient.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {patient.baldnessGrade ? (
                      <Badge variant="outline" className="text-xs font-mono">
                        {patient.baldnessGrade}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t p-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              {/* Page numbers */}
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
      </Card>
    </div>
  );
}
