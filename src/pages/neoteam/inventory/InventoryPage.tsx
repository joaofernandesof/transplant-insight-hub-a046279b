/**
 * Inventory Module - Main Page
 * Módulo de Gestão de Estoque separado do módulo de Procedimentos
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabFromUrl } from '@/hooks/useTabFromUrl';
import { 
  Package, 
  TrendingDown, 
  ArrowLeftRight,
  BarChart3, 
  Settings,
  AlertTriangle
} from 'lucide-react';
import { StockOverviewTab } from './tabs/StockOverviewTab';
import { StockMovementsTab } from './tabs/StockMovementsTab';
import { LowStockTab } from './tabs/LowStockTab';
import { StockReportsTab } from './tabs/StockReportsTab';
import { StockSettingsTab } from './tabs/StockSettingsTab';

const TABS = [
  { id: 'overview', label: 'Visão Geral', icon: Package },
  { id: 'movements', label: 'Movimentações', icon: ArrowLeftRight },
  { id: 'low-stock', label: 'Estoque Baixo', icon: AlertTriangle },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export default function InventoryPage() {
  const { activeTab: tab, setActiveTab: setTab } = useTabFromUrl({ defaultTab: 'overview' });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Gestão de Estoque
          </h1>
          <p className="text-muted-foreground">
            Controle de materiais, medicamentos e insumos
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
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

        <TabsContent value="overview" className="space-y-6">
          <StockOverviewTab />
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <StockMovementsTab />
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-6">
          <LowStockTab />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <StockReportsTab />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <StockSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
