/**
 * Procedures Module - Main Page
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabFromUrl } from '@/hooks/useTabFromUrl';
import { 
  ListOrdered, 
  PlayCircle, 
  Search, 
  BarChart3, 
  Settings,
  DollarSign
} from 'lucide-react';

// Tab components
import { ProceduresKitsTab } from './tabs/ProceduresKitsTab';
import { ExecutionsTab } from './tabs/ExecutionsTab';
import { AuditTab } from './tabs/AuditTab';
import { ReportsTab } from './tabs/ReportsTab';
import { SettingsTab } from './tabs/SettingsTab';
import { CostsTab } from './tabs/CostsTab';

const TABS = [
  { id: 'kits', label: 'Procedimentos e Kits', icon: ListOrdered },
  { id: 'executions', label: 'Aplicações', icon: PlayCircle },
  { id: 'costs', label: 'Custos', icon: DollarSign },
  { id: 'audit', label: 'Auditoria', icon: Search },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export default function ProceduresPage() {
  const { activeTab: tab, setActiveTab: setTab } = useTabFromUrl({ defaultTab: 'kits' });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Controle de Consumo por Procedimento
          </h1>
          <p className="text-muted-foreground">
            Gerencie kits, aplicações e consumo de materiais
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          {TABS.map(({ id, label, icon: Icon }) => (
            <TabsTrigger 
              key={id} 
              value={id}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden lg:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="kits" className="space-y-6">
          <ProceduresKitsTab />
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <ExecutionsTab />
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <CostsTab />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <AuditTab />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ReportsTab />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
