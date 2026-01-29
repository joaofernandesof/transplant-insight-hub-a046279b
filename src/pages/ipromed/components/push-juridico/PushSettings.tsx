/**
 * Push Jurídico - Configurações
 * Configurações do módulo de monitoramento
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Settings,
  Bell,
  Building2,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle2,
  Save,
  Key,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

// Tribunals by category
const tribunalCategories = [
  {
    id: 'estaduais',
    name: 'Tribunais Estaduais (TJ)',
    tribunals: [
      { id: 'tjsp', name: 'TJSP - São Paulo', enabled: true },
      { id: 'tjrj', name: 'TJRJ - Rio de Janeiro', enabled: true },
      { id: 'tjmg', name: 'TJMG - Minas Gerais', enabled: true },
      { id: 'tjrs', name: 'TJRS - Rio Grande do Sul', enabled: true },
      { id: 'tjpr', name: 'TJPR - Paraná', enabled: true },
      { id: 'tjsc', name: 'TJSC - Santa Catarina', enabled: false },
      { id: 'tjba', name: 'TJBA - Bahia', enabled: false },
      { id: 'tjpe', name: 'TJPE - Pernambuco', enabled: false },
    ],
  },
  {
    id: 'federais',
    name: 'Tribunais Regionais Federais (TRF)',
    tribunals: [
      { id: 'trf1', name: 'TRF-1 - Brasília', enabled: true },
      { id: 'trf2', name: 'TRF-2 - Rio de Janeiro', enabled: true },
      { id: 'trf3', name: 'TRF-3 - São Paulo', enabled: true },
      { id: 'trf4', name: 'TRF-4 - Porto Alegre', enabled: true },
      { id: 'trf5', name: 'TRF-5 - Recife', enabled: false },
      { id: 'trf6', name: 'TRF-6 - Belo Horizonte', enabled: false },
    ],
  },
  {
    id: 'trabalhistas',
    name: 'Tribunais Regionais do Trabalho (TRT)',
    tribunals: [
      { id: 'trt1', name: 'TRT-1 - Rio de Janeiro', enabled: true },
      { id: 'trt2', name: 'TRT-2 - São Paulo', enabled: true },
      { id: 'trt3', name: 'TRT-3 - Minas Gerais', enabled: true },
      { id: 'trt4', name: 'TRT-4 - Rio Grande do Sul', enabled: false },
      { id: 'trt15', name: 'TRT-15 - Campinas', enabled: true },
    ],
  },
  {
    id: 'superiores',
    name: 'Tribunais Superiores',
    tribunals: [
      { id: 'stf', name: 'STF - Supremo Tribunal Federal', enabled: true },
      { id: 'stj', name: 'STJ - Superior Tribunal de Justiça', enabled: true },
      { id: 'tst', name: 'TST - Tribunal Superior do Trabalho', enabled: true },
      { id: 'tse', name: 'TSE - Tribunal Superior Eleitoral', enabled: false },
      { id: 'stm', name: 'STM - Superior Tribunal Militar', enabled: false },
    ],
  },
  {
    id: 'diarios',
    name: 'Diários Oficiais',
    tribunals: [
      { id: 'dou', name: 'DOU - Diário Oficial da União', enabled: true },
      { id: 'djesp', name: 'DJE/SP - Diário da Justiça Eletrônico SP', enabled: true },
      { id: 'djerj', name: 'DJE/RJ - Diário da Justiça Eletrônico RJ', enabled: true },
      { id: 'djemg', name: 'DJE/MG - Diário da Justiça Eletrônico MG', enabled: false },
    ],
  },
];

export default function PushSettings() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [tribunals, setTribunals] = useState(tribunalCategories);
  const [scanFrequency, setScanFrequency] = useState('6h');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
  };

  const toggleTribunal = (categoryId: string, tribunalId: string) => {
    setTribunals(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          tribunals: cat.tribunals.map(t => 
            t.id === tribunalId ? { ...t, enabled: !t.enabled } : t
          ),
        };
      }
      return cat;
    }));
  };

  const toggleCategory = (categoryId: string, enabled: boolean) => {
    setTribunals(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          tribunals: cat.tribunals.map(t => ({ ...t, enabled })),
        };
      }
      return cat;
    }));
  };

  const enabledCount = tribunals.reduce(
    (sum, cat) => sum + cat.tribunals.filter(t => t.enabled).length,
    0
  );
  const totalCount = tribunals.reduce(
    (sum, cat) => sum + cat.tribunals.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-600" />
            Configurações
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure notificações, tribunais e frequência de varredura
          </p>
        </div>
        <Button className="gap-2" onClick={handleSave}>
          <Save className="h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="tribunals">Tribunais</TabsTrigger>
          <TabsTrigger value="frequency">Frequência</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configurações de Notificação
              </CardTitle>
              <CardDescription>
                Configure como deseja receber os alertas de publicações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Notificações Ativadas</p>
                  <p className="text-sm text-muted-foreground">Receber alertas de novas publicações</p>
                </div>
                <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Notificações Push</p>
                  <p className="text-sm text-muted-foreground">Receber push no aplicativo móvel</p>
                </div>
                <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Notificações por E-mail</p>
                  <p className="text-sm text-muted-foreground">Receber resumo por e-mail</p>
                </div>
                <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
              </div>

              {emailEnabled && (
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <Label>Frequência do E-mail</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Imediato (cada alerta)</SelectItem>
                      <SelectItem value="hourly">Resumo por hora</SelectItem>
                      <SelectItem value="daily">Resumo diário</SelectItem>
                      <SelectItem value="weekly">Resumo semanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="p-4 border rounded-lg space-y-3">
                <Label>Tipos de Alerta</Label>
                <div className="grid grid-cols-2 gap-3">
                  {['Intimações', 'Sentenças', 'Despachos', 'Decisões', 'Publicações DJE'].map(type => (
                    <div key={type} className="flex items-center gap-2">
                      <Checkbox defaultChecked id={type} />
                      <label htmlFor={type} className="text-sm">{type}</label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tribunals Tab */}
        <TabsContent value="tribunals" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Tribunais Monitorados
                  </CardTitle>
                  <CardDescription>
                    Selecione quais tribunais e diários deseja monitorar
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {enabledCount} de {totalCount} ativos
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {tribunals.map(category => {
                  const enabledInCategory = category.tribunals.filter(t => t.enabled).length;
                  const allEnabled = enabledInCategory === category.tribunals.length;
                  const someEnabled = enabledInCategory > 0 && !allEnabled;

                  return (
                    <AccordionItem key={category.id} value={category.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={allEnabled}
                            // @ts-ignore
                            indeterminate={someEnabled}
                            onCheckedChange={(checked) => toggleCategory(category.id, !!checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span>{category.name}</span>
                          <Badge variant="outline" className="ml-auto mr-2">
                            {enabledInCategory}/{category.tribunals.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-2 pl-8">
                          {category.tribunals.map(tribunal => (
                            <div 
                              key={tribunal.id} 
                              className="flex items-center gap-2 p-2 rounded hover:bg-muted"
                            >
                              <Checkbox 
                                id={tribunal.id}
                                checked={tribunal.enabled}
                                onCheckedChange={() => toggleTribunal(category.id, tribunal.id)}
                              />
                              <label htmlFor={tribunal.id} className="text-sm cursor-pointer flex-1">
                                {tribunal.name}
                              </label>
                              {tribunal.enabled && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Frequency Tab */}
        <TabsContent value="frequency" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Frequência de Varredura
              </CardTitle>
              <CardDescription>
                Configure a frequência das varreduras automáticas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Intervalo entre Varreduras</Label>
                <Select value={scanFrequency} onValueChange={setScanFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">A cada 1 hora</SelectItem>
                    <SelectItem value="3h">A cada 3 horas</SelectItem>
                    <SelectItem value="6h">A cada 6 horas (recomendado)</SelectItem>
                    <SelectItem value="12h">A cada 12 horas</SelectItem>
                    <SelectItem value="24h">1 vez por dia</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Varreduras mais frequentes podem consumir mais créditos da API
                </p>
              </div>

              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-800">Próxima Varredura</p>
                      <p className="text-sm text-emerald-700">
                        Programada para hoje às 18:00
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-5 w-5" />
                Integração com API
              </CardTitle>
              <CardDescription>
                Configure a chave de API para integração com o JusBrasil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Chave de API JusBrasil</Label>
                <Input type="password" placeholder="Insira sua API key" />
                <p className="text-xs text-muted-foreground">
                  Obtenha sua chave em <a href="https://api.jusbrasil.com.br" target="_blank" rel="noopener noreferrer" className="text-primary underline">api.jusbrasil.com.br</a>
                </p>
              </div>

              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Configuração Pendente</p>
                      <p className="text-sm text-amber-700">
                        O módulo está funcionando com dados de demonstração. Para ativar o monitoramento 
                        real, configure sua chave de API do JusBrasil ou outro provedor de dados judiciais.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 border rounded-lg space-y-3">
                <p className="font-medium">Status da Conexão</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-amber-700">Modo Demonstração</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
