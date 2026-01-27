/**
 * IPROMED - Astrea-style Alerts Panel
 * Painel de alertas com abas e design limpo inspirado no Astrea
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Clock,
  FileText,
  Calendar,
  Gavel,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Eye,
  Trash2,
  Star,
} from "lucide-react";

interface Alert {
  id: string;
  type: 'deadline' | 'publication' | 'progress' | 'task' | 'agenda' | 'financial';
  title: string;
  description: string;
  date: string;
  time?: string;
  isRead: boolean;
  isImportant: boolean;
  actionLabel?: string;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'deadline',
    title: 'Lembrete de prazo',
    description: 'Prazo Marcado para 25/09/2024\nDwight Schrute X Jim Halpert - 1º Grau -',
    date: 'Hoje',
    time: '12:54',
    isRead: false,
    isImportant: true,
    actionLabel: 'VISUALIZAR PRAZO',
  },
  {
    id: '2',
    type: 'task',
    title: 'Tarefa atrasada',
    description: '24/09/2024 - Análise do processo\nResponsável: Leonardo Signoretti',
    date: 'Hoje',
    isRead: false,
    isImportant: true,
    actionLabel: 'VISUALIZAR TAREFA',
  },
  {
    id: '3',
    type: 'financial',
    title: 'Contas a pagar/receber',
    description: 'Confira os lançamentos de\n2 atrasados a receber - R$',
    date: 'Hoje',
    isRead: false,
    isImportant: false,
  },
  {
    id: '4',
    type: 'publication',
    title: 'Nova publicação',
    description: 'TJSP - Processo 0002588-63.2020\nMovimentação detectada',
    date: '27/01/2026',
    isRead: false,
    isImportant: false,
    actionLabel: 'VER PUBLICAÇÃO',
  },
  {
    id: '5',
    type: 'progress',
    title: 'Andamento recebido',
    description: 'TJRJ - Processo 0002588-63.2020.8.19.0037\nNova movimentação processual',
    date: '26/01/2026',
    isRead: true,
    isImportant: false,
    actionLabel: 'TRATAR ANDAMENTOS',
  },
];

const tabs = [
  { id: 'important', label: 'Importantes', icon: Star, count: 2 },
  { id: 'all', label: 'Todos', icon: Bell, count: 5 },
  { id: 'publications', label: 'Publicações', icon: FileText, count: 1 },
  { id: 'progress', label: 'Andamentos', icon: Gavel, count: 1 },
  { id: 'tasks', label: 'Tarefas', icon: CheckCircle2, count: 1 },
  { id: 'agenda', label: 'Agenda', icon: Calendar, count: 0 },
  { id: 'financial', label: 'Financeiro', icon: AlertTriangle, count: 1 },
];

const getAlertIcon = (type: Alert['type']) => {
  switch (type) {
    case 'deadline': return Bell;
    case 'publication': return FileText;
    case 'progress': return Gavel;
    case 'task': return CheckCircle2;
    case 'agenda': return Calendar;
    case 'financial': return AlertTriangle;
    default: return Bell;
  }
};

const getAlertColor = (type: Alert['type']) => {
  switch (type) {
    case 'deadline': return 'text-blue-600 bg-blue-50';
    case 'publication': return 'text-purple-600 bg-purple-50';
    case 'progress': return 'text-emerald-600 bg-emerald-50';
    case 'task': return 'text-rose-600 bg-rose-50';
    case 'agenda': return 'text-amber-600 bg-amber-50';
    case 'financial': return 'text-green-600 bg-green-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

export default function AstreaStyleAlerts() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);

  const filteredAlerts = mockAlerts.filter(alert => {
    if (activeTab === 'all') return true;
    if (activeTab === 'important') return alert.isImportant;
    return alert.type === activeTab.replace('s', '').replace('publication', 'publication');
  });

  const toggleSelect = (id: string) => {
    setSelectedAlerts(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  return (
    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="pb-0 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#0066CC]" />
            Alertas
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            <ChevronDown className="h-4 w-4 mr-1" />
            Expandir todos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Tabs */}
        <div className="border-b px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-[#0066CC]/10 text-[#0066CC]'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.id === 'important' && <Star className="h-3.5 w-3.5" />}
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge 
                      variant="secondary" 
                      className={`ml-1 h-5 px-1.5 text-xs ${
                        isActive ? 'bg-[#0066CC] text-white' : 'bg-gray-200'
                      }`}
                    >
                      {tab.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Counter */}
        <div className="px-4 py-2 border-b bg-gray-50/50 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Mostrando {filteredAlerts.length} de {mockAlerts.length} alertas
          </span>
        </div>

        {/* Alert List */}
        <ScrollArea className="h-[400px]">
          <div className="divide-y">
            {filteredAlerts.map(alert => {
              const Icon = getAlertIcon(alert.type);
              const colorClass = getAlertColor(alert.type);
              
              return (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors ${
                    !alert.isRead ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <Checkbox
                    checked={selectedAlerts.includes(alert.id)}
                    onCheckedChange={() => toggleSelect(alert.id)}
                    className="mt-1"
                  />
                  
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          {alert.isImportant && (
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          )}
                          <span className="font-medium text-sm">{alert.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-line">
                          {alert.description}
                        </p>
                        {alert.actionLabel && (
                          <button className="text-xs font-medium text-[#0066CC] hover:underline mt-2">
                            {alert.actionLabel}
                          </button>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {alert.date}{alert.time && ` - ${alert.time}`}
                        </span>
                        {!alert.isRead && (
                          <button className="block text-xs text-rose-600 hover:underline mt-1">
                            DESCARTAR ALERTA
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
