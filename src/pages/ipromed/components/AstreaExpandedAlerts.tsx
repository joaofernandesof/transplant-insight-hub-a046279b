/**
 * CPG Advocacia Médica - Astrea-style Expanded Alerts
 * Alertas expandidos com andamentos importantes e badges de IA
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Star,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Bell,
  RefreshCw,
  LayoutList,
} from "lucide-react";
import AstreaAndamentoDetail from "./AstreaAndamentoDetail";

interface AlertItem {
  id: string;
  type: 'andamento' | 'publication' | 'task' | 'deadline';
  title: string;
  description: string;
  date: string;
  time?: string;
  isImportant: boolean;
  hasIA: boolean;
  caseInfo?: string;
  movements?: Movement[];
}

interface Movement {
  id: string;
  date: string;
  title: string;
  hasIA: boolean;
}

const mockAlerts: AlertItem[] = [
  {
    id: '1',
    type: 'andamento',
    title: 'Andamento recebido',
    description: '- Concurso de Credores (5000)\nQUESTÕES DE ALTA COMPLEXIDADE, GRANDE IMPACTO E REPERCUSSÃO (12467) - 123 Milhas (Linha Promo) (50025)',
    date: '11/08/2025',
    time: '10:15',
    isImportant: true,
    hasIA: true,
    caseInfo: '- DIREITO CIVIL (899) - Empresas (9616) - Recuperação judicial e Falência (4993) -',
    movements: [
      { id: 'm1', date: '04/06/2025', title: 'Juntada de Outros documentos', hasIA: true },
      { id: 'm2', date: '08/05/2025', title: 'Decorrido prazo de INSTITUTO NACIONAL DE DEFESA DO CONSUMIDOR em 07/05/2025 23:59.', hasIA: true },
      { id: 'm3', date: '08/05/2025', title: 'Decorrido prazo de AUTARQUIA DE PROTECAO E DEFESA DO CONSUMIDOR DO ESTADO DO RIO DE JANEIRO em 07/05/2025 23:59.', hasIA: true },
      { id: 'm4', date: '08/05/2025', title: 'Decorrido prazo de FUNDACAO DE PROTECAO E DEFESA DO CONSUMIDOR PROCON em 07/05/2025 23:59.', hasIA: true },
      { id: 'm5', date: '02/04/2025', title: 'Decorrido prazo de FUNDACAO DE PROTECAO E DEFESA DO CONSUMIDOR PROCON em 01/04/2025 23:59.', hasIA: true },
      { id: 'm6', date: '20/03/2025', title: 'Registrada a inclusão de dados de GVM SERVICE ADMINISTRADORA LTDA - ME no BNDT sem garantia ou suspensão da exigibilidade do débito importante 2', hasIA: true },
    ],
  },
];

const tabs = [
  { id: 'important', label: 'Importantes', count: 1, icon: Star },
  { id: 'all', label: 'Todos', count: '99+' },
  { id: 'publications', label: 'Publicações', count: '99+' },
  { id: 'andamentos', label: 'Andamentos', count: 1 },
  { id: 'processes', label: 'Processos' },
  { id: 'tasks', label: 'Tarefas' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'financial', label: 'Financeiro' },
  { id: 'portal', label: 'Portal do Cliente' },
  { id: 'integration', label: 'Integração' },
  { id: 'others', label: 'Outros' },
];

export default function AstreaExpandedAlerts() {
  const [activeTab, setActiveTab] = useState('important');
  const [expandedAlerts, setExpandedAlerts] = useState<string[]>(['1']);
  const [selectedAndamento, setSelectedAndamento] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedAlerts(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Alertas</h1>
          <Button variant="ghost" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b pb-0">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-[#0066CC] text-[#0066CC]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {Icon && <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-amber-500 fill-amber-500' : ''}`} />}
                {tab.label}
                {tab.count && (
                  <Badge 
                    variant="secondary" 
                    className={`ml-1 h-5 px-1.5 text-xs ${
                      isActive ? 'bg-rose-500 text-white' : 'bg-gray-200'
                    }`}
                  >
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Counter and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox />
            <span className="text-sm text-muted-foreground">
              Mostrando 1 de 1 alertas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs">
              Expandir todos
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {mockAlerts.map(alert => {
            const isExpanded = expandedAlerts.includes(alert.id);
            
            return (
              <Card key={alert.id} className="border-0 shadow-sm overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(alert.id)}>
                  {/* Alert Header */}
                  <div className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors">
                    <Checkbox className="mt-1" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="font-medium">{alert.title}</span>
                        <div className="ml-auto text-sm text-muted-foreground">
                          {alert.date} - {alert.time}
                        </div>
                      </div>
                      
                      {/* Case Info Badge */}
                      <div className="bg-amber-100 text-amber-900 text-xs px-2 py-1 rounded inline-block mb-2">
                        {alert.caseInfo}
                      </div>
                      
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {alert.description}
                      </p>
                      
                      <div className="text-sm text-muted-foreground mt-2">
                        {alert.movements?.length} andamento(s) importante(s)
                      </div>
                      
                      {/* Action Links */}
                      <div className="flex items-center gap-4 mt-3">
                        <button className="text-xs font-medium text-[#0066CC] hover:underline uppercase">
                          Tratar Andamentos
                        </button>
                        <button className="text-xs font-medium text-[#0066CC] hover:underline uppercase">
                          Ver Processo
                        </button>
                        <CollapsibleTrigger asChild>
                          <button className="text-xs font-medium text-[#0066CC] hover:underline uppercase flex items-center gap-1">
                            {isExpanded ? 'Ocultar' : 'Exibir'} Andamentos
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        </CollapsibleTrigger>
                        <button className="text-xs font-medium text-gray-400 hover:underline uppercase ml-auto">
                          Descartar Alerta
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Movements */}
                  <CollapsibleContent>
                    <div className="bg-amber-50/50 border-t">
                      {alert.movements?.map(movement => (
                        <div
                          key={movement.id}
                          className="flex items-center gap-3 px-4 py-3 border-b border-amber-100 last:border-b-0 hover:bg-amber-100/50 cursor-pointer"
                          onClick={() => setSelectedAndamento(movement.id)}
                        >
                          <span className="text-sm text-muted-foreground w-24 flex-shrink-0">
                            {movement.date}
                          </span>
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                          <span className="text-sm flex-1">
                            {movement.title}
                          </span>
                          {movement.hasIA && (
                            <Badge className="bg-purple-100 text-purple-700 text-[10px] gap-1">
                              <Sparkles className="h-3 w-3" />
                              IA
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Andamento Detail Modal */}
      <AstreaAndamentoDetail
        isOpen={!!selectedAndamento}
        onClose={() => setSelectedAndamento(null)}
      />
    </>
  );
}
