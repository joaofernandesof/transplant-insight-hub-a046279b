/**
 * CPG Advocacia Médica - Push Jurídico
 * Módulo de monitoramento automatizado de publicações judiciais
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Search,
  Settings,
  History,
  Radar,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Submodules
import PushDashboard from "./components/push-juridico/PushDashboard";
import PushAlerts from "./components/push-juridico/PushAlerts";
import PushSettings from "./components/push-juridico/PushSettings";
import PushHistory from "./components/push-juridico/PushHistory";
import PushMonitoring from "./components/push-juridico/PushMonitoring";
import AstreaPublicationsView from "./components/push-juridico/AstreaPublicationsView";

const tabs = [
  { id: 'publications', label: 'Publicações', icon: FileText, badge: 2 },
  { id: 'dashboard', label: 'Dashboard', icon: Radar },
  { id: 'alerts', label: 'Alertas', icon: Bell, badge: 5 },
  { id: 'monitoring', label: 'Monitoramento', icon: Search },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export default function IpromedPushJuridico() {
  const [activeTab, setActiveTab] = useState('publications');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radar className="h-7 w-7 text-rose-600" />
            Push Jurídico
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitoramento automatizado de publicações judiciais e alertas em tempo real
          </p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          <Bell className="h-3 w-3 mr-1" />
          Monitoramento Ativo
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-muted/50 p-2 rounded-lg">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 text-sm relative",
                  "data-[state=active]:bg-white data-[state=active]:shadow-sm"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="publications" className="mt-6">
          <AstreaPublicationsView />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <PushDashboard />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <PushAlerts />
        </TabsContent>

        <TabsContent value="monitoring" className="mt-6">
          <PushMonitoring />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <PushHistory />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <PushSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
