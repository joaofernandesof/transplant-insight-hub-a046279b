import { useState } from 'react';
import { 
  Stethoscope, Settings, TrendingUp, Star, Megaphone, 
  DollarSign, BarChart, Users, Crown, Search, Filter,
  Building, ChevronDown, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useStaffRoles, DEPARTMENT_COLORS } from '@/neohub/hooks/useStaffRoles';
import { cn } from '@/lib/utils';

const DEPARTMENT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  clinico: Stethoscope,
  operacoes: Settings,
  comercial: TrendingUp,
  sucesso_paciente: Star,
  marketing: Megaphone,
  financeiro: DollarSign,
  ti_dados: BarChart,
  gestao: Users,
  executivo: Crown,
};

export default function NeoTeamStaffRoles() {
  const { roles, rolesByDepartment, departmentLabels, isLoading } = useStaffRoles();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDepts, setExpandedDepts] = useState<string[]>(Object.keys(departmentLabels));

  const toggleDepartment = (dept: string) => {
    setExpandedDepts(prev => 
      prev.includes(dept) 
        ? prev.filter(d => d !== dept)
        : [...prev, dept]
    );
  };

  const filteredRolesByDept = Object.entries(rolesByDepartment).reduce((acc, [dept, deptRoles]) => {
    const filtered = deptRoles.filter(role => 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) acc[dept] = filtered;
    return acc;
  }, {} as Record<string, typeof roles>);

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
            Gerencie os cargos e permissões por departamento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-[250px]"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-xs text-muted-foreground">Total de Cargos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{Object.keys(rolesByDepartment).length}</div>
            <p className="text-xs text-muted-foreground">Departamentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-cyan-500">
              {rolesByDepartment['clinico']?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Cargos Clínicos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">
              {rolesByDepartment['comercial']?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Cargos Comerciais</p>
          </CardContent>
        </Card>
      </div>

      {/* Departments */}
      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="space-y-4">
          {Object.entries(filteredRolesByDept).map(([dept, deptRoles]) => {
            const DeptIcon = DEPARTMENT_ICON_MAP[dept] || Building;
            const isExpanded = expandedDepts.includes(dept);
            const bgColor = DEPARTMENT_COLORS[dept] || 'bg-gray-500';

            return (
              <Collapsible
                key={dept}
                open={isExpanded}
                onOpenChange={() => toggleDepartment(dept)}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn('p-2 rounded-lg', bgColor)}>
                            <DeptIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {departmentLabels[dept] || dept}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {deptRoles.length} cargo{deptRoles.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {deptRoles.map((role) => (
                          <div
                            key={role.id}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <Badge 
                              variant="outline" 
                              className={cn('shrink-0', role.color)}
                            >
                              {role.icon}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{role.name}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {role.description}
                              </p>
                              {role.default_route && (
                                <code className="text-xs text-muted-foreground mt-1 block truncate">
                                  {role.default_route}
                                </code>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
