import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Settings,
  ExternalLink,
  MessageSquare,
  Calendar,
  DollarSign,
  Bot,
  Plug,
  HelpCircle
} from "lucide-react";
import { ModuleLayout } from "@/components/ModuleLayout";

const systems = [
  { id: 'kommo', name: 'Kommo CRM', description: 'Gestão completa de leads e pipeline de vendas', category: 'Vendas', status: 'connected', features: ['Funil de vendas', 'Automações', 'Relatórios', 'Integração WhatsApp'], icon: DollarSign, color: 'bg-blue-100 text-blue-600' },
  { id: 'whatsapp', name: 'WhatsApp API Oficial', description: 'Atendimento profissional via WhatsApp Business', category: 'Comunicação', status: 'connected', features: ['Mensagens em massa', 'Templates', 'Chatbot', 'Métricas'], icon: MessageSquare, color: 'bg-green-100 text-green-600' },
  { id: 'feegow', name: 'Feegow Clinic', description: 'Prontuário eletrônico e agenda médica', category: 'Clínico', status: 'pending', features: ['Prontuário digital', 'Agendamento', 'Financeiro', 'Laudos'], icon: Calendar, color: 'bg-purple-100 text-purple-600' },
  { id: 'contaazul', name: 'Conta Azul', description: 'Gestão financeira e contábil', category: 'Financeiro', status: 'pending', features: ['Fluxo de caixa', 'Notas fiscais', 'Relatórios', 'Conciliação'], icon: DollarSign, color: 'bg-amber-100 text-amber-600' },
  { id: 'chatbot', name: 'Robô de Atendimento', description: 'Automação de atendimento inicial', category: 'Automação', status: 'connected', features: ['Qualificação de leads', 'Agendamento automático', 'Respostas 24/7'], icon: Bot, color: 'bg-indigo-100 text-indigo-600' },
];

const statusConfig = {
  connected: { label: 'Conectado', color: 'bg-green-100 text-green-700' },
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  disconnected: { label: 'Desconectado', color: 'bg-red-100 text-red-700' },
};

const integrations = [
  { id: 1, name: 'Instagram', status: 'connected' },
  { id: 2, name: 'Facebook Ads', status: 'connected' },
  { id: 3, name: 'Google Ads', status: 'pending' },
  { id: 4, name: 'RD Station', status: 'disconnected' },
];

export default function Systems() {
  const connectedCount = systems.filter(s => s.status === 'connected').length;

  return (
    <ModuleLayout>
      <div className="p-4 lg:p-6 lg:pt-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-slate-600" />
            Sistemas & Ferramentas
          </h1>
          <p className="text-sm text-muted-foreground">CRM, WhatsApp API, Feegow e robôs</p>
        </div>

        {/* Overview */}
        <Card className="mb-6 bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <Plug className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold">Status das Integrações</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="text-green-600 font-medium">{connectedCount}</span> de {systems.length} sistemas conectados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Systems Grid */}
        <h3 className="text-lg font-semibold mb-4">Sistemas Principais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {systems.map((system) => {
            const status = statusConfig[system.status as keyof typeof statusConfig];
            return (
              <Card key={system.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${system.color} flex items-center justify-center`}>
                      <system.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{system.name}</h4>
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{system.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {system.features.slice(0, 3).map((feature, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{feature}</Badge>
                        ))}
                        {system.features.length > 3 && <Badge variant="outline" className="text-xs">+{system.features.length - 3}</Badge>}
                      </div>
                      <div className="flex gap-2">
                        {system.status === 'connected' ? (
                          <Button size="sm" variant="outline" className="gap-2">
                            <ExternalLink className="h-4 w-4" />Acessar
                          </Button>
                        ) : (
                          <Button size="sm" className="gap-2">
                            <Plug className="h-4 w-4" />Configurar
                          </Button>
                        )}
                        <Button size="sm" variant="ghost"><HelpCircle className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outras Integrações</CardTitle>
            <CardDescription>Conexões com plataformas de marketing e anúncios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {integrations.map((integration) => {
                const status = statusConfig[integration.status as keyof typeof statusConfig];
                return (
                  <div key={integration.id} className="p-4 rounded-lg border text-center hover:bg-muted/50 transition-colors cursor-pointer">
                    <p className="font-medium text-sm mb-2">{integration.name}</p>
                    <Badge className={`${status.color} text-xs`}>{status.label}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <HelpCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Precisa de ajuda com as configurações?</h4>
                <p className="text-sm text-muted-foreground">Nossa equipe pode auxiliar na configuração e integração de todos os sistemas</p>
              </div>
              <Button className="gap-2">
                <MessageSquare className="h-4 w-4" />Solicitar Suporte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
