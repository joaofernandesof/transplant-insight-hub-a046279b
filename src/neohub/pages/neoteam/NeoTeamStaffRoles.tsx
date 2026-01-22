import { useState } from 'react';
import { 
  Stethoscope, Settings, TrendingUp, Star, Megaphone, 
  DollarSign, BarChart, Users, Crown, Search, Plus,
  Workflow, Phone, Target, Heart, HeartPulse, Syringe,
  Briefcase, Building, Edit, Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStaffRoles, DEPARTMENT_COLORS } from '@/neohub/hooks/useStaffRoles';
import { cn } from '@/lib/utils';

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Stethoscope,
  Settings,
  TrendingUp,
  Star,
  Megaphone,
  DollarSign,
  BarChart,
  Users,
  Crown,
  Workflow,
  Phone,
  Target,
  Heart,
  HeartPulse,
  Syringe,
  Briefcase,
  Building,
  PhoneCall: Phone,
  Calculator: DollarSign,
  Network: Settings,
  Scale: Building,
};

export default function NeoTeamStaffRoles() {
  const { roles, rolesByDepartment, departmentLabels, isLoading } = useStaffRoles();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');

  const filteredRoles = roles.filter(role => {
    const matchesSearch = 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'all' || role.department === filterDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // Group for stats
  const deptStats = Object.entries(rolesByDepartment).map(([dept, deptRoles]) => ({
    dept,
    label: departmentLabels[dept] || dept,
    count: deptRoles.length,
    color: DEPARTMENT_COLORS[dept] || 'bg-muted',
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cargos & Funções</h1>
          <p className="text-muted-foreground">
            {roles.length} cargos em {Object.keys(rolesByDepartment).length} departamentos
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Cargo
        </Button>
      </div>

      {/* Department Stats */}
      <div className="flex flex-wrap gap-2">
        {deptStats.map(({ dept, label, count, color }) => (
          <Badge 
            key={dept} 
            variant="outline" 
            className={cn(
              "cursor-pointer transition-all",
              filterDepartment === dept && "ring-2 ring-primary"
            )}
            onClick={() => setFilterDepartment(filterDepartment === dept ? 'all' : dept)}
          >
            <span className={cn("w-2 h-2 rounded-full mr-2", color)} />
            {label}: {count}
          </Badge>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cargo, descrição ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos departamentos</SelectItem>
                {Object.entries(departmentLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Lista de Cargos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Ícone</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead className="hidden md:table-cell">Descrição</TableHead>
                <TableHead className="hidden lg:table-cell">Rota Padrão</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum cargo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => {
                  const IconComponent = ICON_MAP[role.icon] || Users;
                  const deptColor = DEPARTMENT_COLORS[role.department] || 'bg-muted';
                  
                  return (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          deptColor
                        )}>
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{role.name}</p>
                          <code className="text-xs text-muted-foreground">{role.code}</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {departmentLabels[role.department] || role.department}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[300px]">
                        <p className="text-sm text-muted-foreground truncate">
                          {role.description || '—'}
                        </p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {role.default_route || '/neoteam'}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
