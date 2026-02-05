import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams } from 'react-router-dom';
import { 
  Sparkles, ClipboardCheck, BarChart3, Building2, 
  ListChecks, Package, History, AlertTriangle 
} from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useStaffRoles } from '@/neohub/hooks/useStaffRoles';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Tabs
import { DailyRoutineTab } from './tabs/DailyRoutineTab';
import { InspectionTab } from './tabs/InspectionTab';
import { MonitoringTab } from './tabs/MonitoringTab';
import { EnvironmentsTab } from './tabs/EnvironmentsTab';
import { ChecklistsTab } from './tabs/ChecklistsTab';
import { SuppliesTab } from './tabs/SuppliesTab';
import { HistoryTab } from './tabs/HistoryTab';

// Hooks
import { useCleaningRoutine, useCleaningSupplies } from './hooks';

export default function CleaningRoutinePage() {
  const { user, isAdmin } = useUnifiedAuth();
  const { myRoles } = useStaffRoles();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'routine';
  
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Buscar branches disponíveis para o usuário
  const { data: branches = [] } = useQuery({
    queryKey: ['neoteam-branches-cleaning'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoteam_branches')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Selecionar primeira branch automaticamente
  React.useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  // Verificar permissões do usuário
  const hasCleaningRole = myRoles.some(r => r.role_code === 'limpeza');
  const hasFiscalRole = myRoles.some(r => r.role_code === 'fiscal_limpeza');
  const hasGestorRole = myRoles.some(r => r.role_code === 'gestor_limpeza');
  const hasAnyCleaningAccess = isAdmin || hasCleaningRole || hasFiscalRole || hasGestorRole;

  // Dados da rotina
  const { stats, executions } = useCleaningRoutine(selectedBranchId);
  const { lowStockSupplies } = useCleaningSupplies(selectedBranchId);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Definir tabs disponíveis por perfil
  const availableTabs = React.useMemo(() => {
    const tabs = [];

    // Limpeza pode ver rotina
    if (isAdmin || hasCleaningRole || hasGestorRole) {
      tabs.push({ id: 'routine', label: 'Rotina do Dia', icon: Sparkles });
    }

    // Fiscal e Gestor podem fiscalizar
    if (isAdmin || hasFiscalRole || hasGestorRole) {
      tabs.push({ id: 'inspection', label: 'Fiscalização', icon: ClipboardCheck });
    }

    // Gestor e Admin podem ver monitoramento
    if (isAdmin || hasGestorRole) {
      tabs.push({ id: 'monitoring', label: 'Monitoramento', icon: BarChart3 });
    }

    // Gestor pode gerenciar
    if (isAdmin || hasGestorRole) {
      tabs.push({ id: 'environments', label: 'Ambientes', icon: Building2 });
      tabs.push({ id: 'checklists', label: 'Checklists', icon: ListChecks });
      tabs.push({ id: 'supplies', label: 'Insumos', icon: Package });
    }

    // Fiscal e Gestor podem ver histórico
    if (isAdmin || hasFiscalRole || hasGestorRole) {
      tabs.push({ id: 'history', label: 'Histórico', icon: History });
    }

    return tabs;
  }, [isAdmin, hasCleaningRole, hasFiscalRole, hasGestorRole]);

  if (!hasAnyCleaningAccess) {
    return (
      <div className="p-6">
        <NeoTeamBreadcrumb />
        <Card className="mt-4">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Você não possui permissão para acessar o módulo de limpeza.
              <br />
              Entre em contato com o gestor para solicitar acesso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <NeoTeamBreadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-cyan-500" />
            Rotina de Limpeza
          </h1>
          <p className="text-muted-foreground">
            Gerenciamento da limpeza diária dos ambientes
          </p>
        </div>

        {/* Seletor de Branch */}
        <div className="flex items-center gap-3">
          {lowStockSupplies.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {lowStockSupplies.length} insumo(s) baixo
            </Badge>
          )}
          
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione a unidade" />
            </SelectTrigger>
            <SelectContent>
              {branches.map(branch => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card className="p-3">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </Card>
          <Card className="p-3 border-gray-300">
            <div className="text-2xl font-bold text-gray-600">{stats.pendente}</div>
            <div className="text-xs text-muted-foreground">Pendentes</div>
          </Card>
          <Card className="p-3 border-blue-300">
            <div className="text-2xl font-bold text-blue-600">{stats.em_execucao}</div>
            <div className="text-xs text-muted-foreground">Em Execução</div>
          </Card>
          <Card className="p-3 border-yellow-300">
            <div className="text-2xl font-bold text-yellow-600">{stats.aguardando_fiscalizacao}</div>
            <div className="text-xs text-muted-foreground">Aguardando</div>
          </Card>
          <Card className="p-3 border-red-300">
            <div className="text-2xl font-bold text-red-600">{stats.reprovado + stats.corrigido}</div>
            <div className="text-xs text-muted-foreground">Correção</div>
          </Card>
          <Card className="p-3 border-green-300">
            <div className="text-2xl font-bold text-green-600">{stats.aprovado}</div>
            <div className="text-xs text-muted-foreground">Aprovados</div>
          </Card>
          <Card className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
            <div className="text-2xl font-bold">{stats.percentComplete}%</div>
            <div className="text-xs opacity-90">Concluído</div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {availableTabs.map(tab => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="flex items-center gap-2"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="routine">
          <DailyRoutineTab branchId={selectedBranchId} />
        </TabsContent>

        <TabsContent value="inspection">
          <InspectionTab branchId={selectedBranchId} />
        </TabsContent>

        <TabsContent value="monitoring">
          <MonitoringTab branchId={selectedBranchId} />
        </TabsContent>

        <TabsContent value="environments">
          <EnvironmentsTab branchId={selectedBranchId} />
        </TabsContent>

        <TabsContent value="checklists">
          <ChecklistsTab branchId={selectedBranchId} />
        </TabsContent>

        <TabsContent value="supplies">
          <SuppliesTab branchId={selectedBranchId} />
        </TabsContent>

        <TabsContent value="history">
          <HistoryTab branchId={selectedBranchId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
