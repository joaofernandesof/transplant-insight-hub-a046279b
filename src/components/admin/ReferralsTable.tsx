import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Gift,
  Search,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Calendar,
  Clock,
  MessageCircle,
  Send,
  ChevronUp,
  ChevronDown,
  Filter,
  X,
  DollarSign,
  User,
  MapPin,
  FileText,
  ChevronsUpDown
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Commission constants
const INDICADOR_COMMISSION_RATE = 0.05; // 5%
const INDICADO_DISCOUNT_RATE = 0.05; // 5%
const COURSE_VALUE = 35000; // R$ 35.000

// Unified Referral type
export interface UnifiedReferral {
  id: string;
  source: 'student' | 'lead';
  name: string;
  email: string;
  phone: string;
  referrer_user_id: string;
  referrer_name: string;
  referrer_code?: string;
  status: string;
  interest?: string;
  city?: string;
  state?: string;
  has_crm?: boolean;
  crm?: string;
  commission_rate?: number;
  commission_value?: number;
  commission_paid: boolean;
  converted_value?: number;
  created_at: string;
  converted_at: string | null;
}

type SortField = 'name' | 'email' | 'phone' | 'referrer_name' | 'source' | 'status' | 'created_at' | 'ganho_indicador' | 'ganho_indicado';
type SortDirection = 'asc' | 'desc';

interface ColumnFilter {
  name: string;
  email: string;
  phone: string;
  referrer_name: string;
  source: string;
  status: string;
}

interface ReferralsTableProps {
  referrals: UnifiedReferral[];
  onStatusChange: (referral: UnifiedReferral, newStatus: string) => void;
  onOpenWhatsApp: (phone: string, name: string) => void;
  onResendEmail: (referral: UnifiedReferral) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  pending: { 
    label: 'Pendente', 
    color: 'text-amber-700 dark:text-amber-400', 
    bgColor: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
    icon: <Clock className="h-3 w-3" />
  },
  contacted: { 
    label: 'Contatado', 
    color: 'text-blue-700 dark:text-blue-400', 
    bgColor: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    icon: <Phone className="h-3 w-3" />
  },
  enrolled: { 
    label: 'Matriculado', 
    color: 'text-purple-700 dark:text-purple-400', 
    bgColor: 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800',
    icon: <Users className="h-3 w-3" />
  },
  converted: { 
    label: 'Convertido', 
    color: 'text-emerald-700 dark:text-emerald-400', 
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
    icon: <CheckCircle className="h-3 w-3" />
  },
  cancelled: { 
    label: 'Cancelado', 
    color: 'text-rose-700 dark:text-rose-400', 
    bgColor: 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800',
    icon: <XCircle className="h-3 w-3" />
  }
};

const SOURCE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  student: { 
    label: 'Indicador', 
    color: 'text-emerald-700 dark:text-emerald-400', 
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800'
  },
  lead: { 
    label: 'Indicado', 
    color: 'text-slate-700 dark:text-slate-400', 
    bgColor: 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
  }
};

export function ReferralsTable({ 
  referrals, 
  onStatusChange, 
  onOpenWhatsApp, 
  onResendEmail 
}: ReferralsTableProps) {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({
    name: '',
    email: '',
    phone: '',
    referrer_name: '',
    source: 'all',
    status: 'all'
  });
  const [selectedReferral, setSelectedReferral] = useState<UnifiedReferral | null>(null);

  // Calculate gains
  const calculateGains = (referral: UnifiedReferral) => {
    const isConverted = referral.status === 'converted' || referral.status === 'enrolled';
    const baseValue = referral.converted_value || COURSE_VALUE;
    
    return {
      indicador: isConverted ? baseValue * INDICADOR_COMMISSION_RATE : 0,
      indicado: isConverted ? baseValue * INDICADO_DISCOUNT_RATE : 0,
      potentialIndicador: baseValue * INDICADOR_COMMISSION_RATE,
      potentialIndicado: baseValue * INDICADO_DISCOUNT_RATE
    };
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = referrals.filter(r => {
      const matchName = !columnFilters.name || r.name.toLowerCase().includes(columnFilters.name.toLowerCase());
      const matchEmail = !columnFilters.email || r.email.toLowerCase().includes(columnFilters.email.toLowerCase());
      const matchPhone = !columnFilters.phone || r.phone.includes(columnFilters.phone);
      const matchReferrer = !columnFilters.referrer_name || r.referrer_name.toLowerCase().includes(columnFilters.referrer_name.toLowerCase());
      const matchSource = columnFilters.source === 'all' || r.source === columnFilters.source;
      const matchStatus = columnFilters.status === 'all' || r.status === columnFilters.status;
      
      return matchName && matchEmail && matchPhone && matchReferrer && matchSource && matchStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'phone':
          comparison = a.phone.localeCompare(b.phone);
          break;
        case 'referrer_name':
          comparison = a.referrer_name.localeCompare(b.referrer_name);
          break;
        case 'source':
          comparison = a.source.localeCompare(b.source);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'ganho_indicador':
          comparison = calculateGains(a).indicador - calculateGains(b).indicador;
          break;
        case 'ganho_indicado':
          comparison = calculateGains(a).indicado - calculateGains(b).indicado;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [referrals, columnFilters, sortField, sortDirection]);

  // Clear all filters
  const clearFilters = () => {
    setColumnFilters({
      name: '',
      email: '',
      phone: '',
      referrer_name: '',
      source: 'all',
      status: 'all'
    });
  };

  const hasActiveFilters = Object.entries(columnFilters).some(([key, value]) => 
    key !== 'source' && key !== 'status' ? value !== '' : value !== 'all'
  );

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Sort icon component
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-3 w-3 opacity-30" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-3 w-3 text-primary" /> : 
      <ChevronDown className="h-3 w-3 text-primary" />;
  };

  // Column header component
  const ColumnHeader = ({ 
    field, 
    label,
    className = ''
  }: { 
    field: SortField; 
    label: string;
    className?: string;
  }) => (
    <TableHead className={className}>
      <button 
        onClick={() => handleSort(field)}
        className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
      >
        {label}
        <SortIcon field={field} />
      </button>
    </TableHead>
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Indicações ({filteredAndSortedData.length})
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                <X className="h-3 w-3 mr-1" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Filters Row - Always visible */}
          <div className="p-4 border-b bg-muted/30 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 border-b bg-muted/30 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Indicado</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={columnFilters.name}
                    onChange={(e) => setColumnFilters(prev => ({ ...prev, name: e.target.value }))}
                    className="h-8 pl-7 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={columnFilters.email}
                    onChange={(e) => setColumnFilters(prev => ({ ...prev, email: e.target.value }))}
                    className="h-8 pl-7 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Telefone</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={columnFilters.phone}
                    onChange={(e) => setColumnFilters(prev => ({ ...prev, phone: e.target.value }))}
                    className="h-8 pl-7 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Indicador</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={columnFilters.referrer_name}
                    onChange={(e) => setColumnFilters(prev => ({ ...prev, referrer_name: e.target.value }))}
                    className="h-8 pl-7 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Origem</label>
                <Select 
                  value={columnFilters.source} 
                  onValueChange={(v) => setColumnFilters(prev => ({ ...prev, source: v }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="student">Indicador</SelectItem>
                    <SelectItem value="lead">Indicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                <Select 
                  value={columnFilters.status} 
                  onValueChange={(v) => setColumnFilters(prev => ({ ...prev, status: v }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="contacted">Contatado</SelectItem>
                    <SelectItem value="enrolled">Matriculado</SelectItem>
                    <SelectItem value="converted">Convertido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {filteredAndSortedData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma indicação encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <ScrollArea className="h-[550px]">
                <div className="min-w-[1200px]">
                  <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <ColumnHeader field="name" label="Indicado" />
                    <ColumnHeader field="email" label="Email" className="hidden md:table-cell" />
                    <ColumnHeader field="phone" label="Telefone" className="hidden lg:table-cell" />
                    <ColumnHeader field="referrer_name" label="Indicador" />
                    <ColumnHeader field="source" label="Origem" className="hidden sm:table-cell" />
                    <ColumnHeader field="status" label="Status" />
                    <ColumnHeader field="created_at" label="Data/Hora" />
                    <ColumnHeader field="ganho_indicador" label="Ganho Indicador" className="hidden xl:table-cell" />
                    <ColumnHeader field="ganho_indicado" label="Ganho Indicado" className="hidden xl:table-cell" />
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedData.map((referral) => {
                    const gains = calculateGains(referral);
                    const statusConfig = STATUS_CONFIG[referral.status] || STATUS_CONFIG.pending;
                    const sourceConfig = SOURCE_CONFIG[referral.source] || SOURCE_CONFIG.lead;
                    const isConverted = referral.status === 'converted' || referral.status === 'enrolled';
                    
                    return (
                      <TableRow 
                        key={`${referral.source}-${referral.id}`}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedReferral(referral)}
                      >
                        <TableCell>
                          <div className="font-medium">{referral.name}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm text-muted-foreground truncate max-w-[180px]">
                            {referral.email}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="text-sm">{referral.phone}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{referral.referrer_name}</div>
                            {referral.referrer_code && (
                              <div className="text-xs text-muted-foreground font-mono">{referral.referrer_code}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge 
                            variant="outline" 
                            className={`${sourceConfig.bgColor} ${sourceConfig.color} border text-xs`}
                          >
                            {sourceConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`${statusConfig.bgColor} ${statusConfig.color} border text-xs flex items-center gap-1 w-fit`}
                          >
                            {statusConfig.icon}
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {format(new Date(referral.created_at), "dd/MM/yy", { locale: ptBR })}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(referral.created_at), "HH:mm", { locale: ptBR })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <div className={`text-sm font-medium ${isConverted ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                            <span className="flex items-center gap-1">
                              5%
                              {isConverted && <span className="text-xs">(aplicado)</span>}
                              {!isConverted && <span className="text-xs italic">(potencial)</span>}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <div className={`text-sm font-medium ${isConverted ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                            <span className="flex items-center gap-1">
                              5%
                              {isConverted && <span className="text-xs">(aplicado)</span>}
                              {!isConverted && <span className="text-xs italic">(potencial)</span>}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Select 
                              value={referral.status} 
                              onValueChange={(value) => onStatusChange(referral, value)}
                            >
                              <SelectTrigger className="w-[100px] h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="contacted">Contatado</SelectItem>
                                <SelectItem value="enrolled">Matriculado</SelectItem>
                                <SelectItem value="converted">Convertido</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onOpenWhatsApp(referral.phone, referral.name)}
                              title="WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onResendEmail(referral)}
                              title="Reenviar e-mail"
                            >
                              <Send className="h-3.5 w-3.5 text-blue-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedReferral} onOpenChange={() => setSelectedReferral(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Detalhes da Indicação
            </DialogTitle>
            <DialogDescription>
              Informações completas sobre esta indicação
            </DialogDescription>
          </DialogHeader>
          
          {selectedReferral && (
            <div className="space-y-4">
              {/* Indicado Info */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Indicado</h4>
                <div className="grid gap-2 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedReferral.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedReferral.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedReferral.phone}</span>
                  </div>
                  {(selectedReferral.city || selectedReferral.state) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {[selectedReferral.city, selectedReferral.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {selectedReferral.crm && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">CRM: {selectedReferral.crm}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Indicador Info */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Indicador</h4>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedReferral.referrer_name}</span>
                  </div>
                  {selectedReferral.referrer_code && (
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      Código: {selectedReferral.referrer_code}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Status & Timing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Status</h4>
                  <Badge 
                    variant="outline" 
                    className={`${STATUS_CONFIG[selectedReferral.status]?.bgColor} ${STATUS_CONFIG[selectedReferral.status]?.color} border flex items-center gap-1 w-fit`}
                  >
                    {STATUS_CONFIG[selectedReferral.status]?.icon}
                    {STATUS_CONFIG[selectedReferral.status]?.label}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Origem</h4>
                  <Badge 
                    variant="outline" 
                    className={`${SOURCE_CONFIG[selectedReferral.source]?.bgColor} ${SOURCE_CONFIG[selectedReferral.source]?.color} border`}
                  >
                    {SOURCE_CONFIG[selectedReferral.source]?.label}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Dates */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Datas</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground mb-1">Criação</div>
                    <div className="font-medium">
                      {format(new Date(selectedReferral.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  {selectedReferral.converted_at && (
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                      <div className="text-xs text-muted-foreground mb-1">Conversão</div>
                      <div className="font-medium text-emerald-600 dark:text-emerald-400">
                        {format(new Date(selectedReferral.converted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Financial */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Valores</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg ${
                    selectedReferral.status === 'converted' || selectedReferral.status === 'enrolled'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-muted/50'
                  }`}>
                    <div className="text-xs text-muted-foreground mb-1">Ganho Indicador</div>
                    <div className={`text-lg font-bold ${
                      selectedReferral.status === 'converted' || selectedReferral.status === 'enrolled'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-muted-foreground'
                    }`}>
                      {formatCurrency(calculateGains(selectedReferral).indicador || calculateGains(selectedReferral).potentialIndicador)}
                    </div>
                    {selectedReferral.status !== 'converted' && selectedReferral.status !== 'enrolled' && (
                      <div className="text-xs text-muted-foreground">(potencial)</div>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${
                    selectedReferral.status === 'converted' || selectedReferral.status === 'enrolled'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'bg-muted/50'
                  }`}>
                    <div className="text-xs text-muted-foreground mb-1">Desconto Indicado</div>
                    <div className={`text-lg font-bold ${
                      selectedReferral.status === 'converted' || selectedReferral.status === 'enrolled'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-muted-foreground'
                    }`}>
                      {formatCurrency(calculateGains(selectedReferral).indicado || calculateGains(selectedReferral).potentialIndicado)}
                    </div>
                    {selectedReferral.status !== 'converted' && selectedReferral.status !== 'enrolled' && (
                      <div className="text-xs text-muted-foreground">(potencial)</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    onOpenWhatsApp(selectedReferral.phone, selectedReferral.name);
                    setSelectedReferral(null);
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                  WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    onResendEmail(selectedReferral);
                    setSelectedReferral(null);
                  }}
                >
                  <Send className="h-4 w-4 mr-2 text-blue-600" />
                  Enviar Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
