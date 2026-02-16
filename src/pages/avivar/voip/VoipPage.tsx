/**
 * VoipPage - Módulo de Telefonia VoIP para Portal Avivar
 * Sistema completo de call center com IA integrada
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Phone, 
  History, 
  Bot, 
  BarChart3, 
  Settings,
  Sparkles
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import VoipDashboardTab from './tabs/VoipDashboardTab';
import VoipCallCenterTab from './tabs/VoipCallCenterTab';
import VoipHistoryTab from './tabs/VoipHistoryTab';
import VoipAiAutomationTab from './tabs/VoipAiAutomationTab';
import VoipAnalyticsTab from './tabs/VoipAnalyticsTab';
import VoipSettingsTab from './tabs/VoipSettingsTab';
import VoipCallAnalysisTab from './tabs/VoipCallAnalysisTab';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'call-center', label: 'Central', icon: Phone },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'analysis', label: 'AI Analysis', icon: Sparkles },
  { id: 'ai', label: 'IA & Automação', icon: Bot },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export default function VoipPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'dashboard';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] shadow-lg shadow-purple-500/20">
            <Phone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              Central de Telefonia
              <Sparkles className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            </h1>
            <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
              VoIP inteligente com transcrição e análise por IA
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))] p-1 h-auto flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white px-4 py-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <VoipDashboardTab />
        </TabsContent>

        <TabsContent value="call-center" className="mt-6">
          <VoipCallCenterTab />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <VoipHistoryTab />
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          <VoipCallAnalysisTab />
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <VoipAiAutomationTab />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <VoipAnalyticsTab />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <VoipSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
