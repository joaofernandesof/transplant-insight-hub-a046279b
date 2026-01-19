import { useState } from "react";
import { Plus, Mail, Bell, MessageSquare, Calendar, Send, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MarketplaceLayout } from "../components/MarketplaceLayout";
import { MarketplaceHeader } from "../components/MarketplaceHeader";
import { toast } from "sonner";
import type { MarketplaceCampaign, CampaignStatus, CampaignType } from "../types/marketplace";

const mockCampaigns: MarketplaceCampaign[] = [
  {
    id: "1",
    name: "Promoção de Verão",
    description: "Campanha para novos pacientes com desconto em consultas",
    type: "email",
    status: "sent",
    targetAudience: "Leads não convertidos",
    content: "Aproveite 20% de desconto na sua primeira consulta!",
    sentAt: "2026-01-15T10:00:00",
    sentCount: 245,
    openRate: 42,
    createdAt: "2026-01-10T08:00:00",
  },
  {
    id: "2",
    name: "Lembrete de Retorno",
    description: "Lembrete automático para pacientes com retorno próximo",
    type: "push",
    status: "scheduled",
    targetAudience: "Pacientes com retorno em 7 dias",
    content: "Olá! Não esqueça do seu retorno agendado.",
    scheduledAt: "2026-01-20T09:00:00",
    createdAt: "2026-01-12T14:00:00",
  },
  {
    id: "3",
    name: "Novidades do Mês",
    description: "Newsletter mensal com novidades e dicas",
    type: "email",
    status: "draft",
    targetAudience: "Todos os pacientes",
    content: "Confira as novidades deste mês...",
    createdAt: "2026-01-18T11:00:00",
  },
];

const typeConfig: Record<CampaignType, { icon: React.ElementType; label: string; color: string }> = {
  email: { icon: Mail, label: "E-mail", color: "text-blue-600" },
  push: { icon: Bell, label: "Push", color: "text-purple-600" },
  sms: { icon: MessageSquare, label: "SMS", color: "text-green-600" },
};

const statusConfig: Record<CampaignStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Rascunho", color: "text-slate-700", bgColor: "bg-slate-100" },
  scheduled: { label: "Agendada", color: "text-blue-700", bgColor: "bg-blue-100" },
  sent: { label: "Enviada", color: "text-green-700", bgColor: "bg-green-100" },
  cancelled: { label: "Cancelada", color: "text-red-700", bgColor: "bg-red-100" },
};

export function MarketplaceCampaigns() {
  const [campaigns] = useState<MarketplaceCampaign[]>(mockCampaigns);
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "scheduled" | "sent">("all");

  const filteredCampaigns = campaigns.filter((c) => {
    if (activeTab === "all") return true;
    return c.status === activeTab;
  });

  const handleCreateCampaign = () => {
    toast.info("Criação de campanha em desenvolvimento");
  };

  return (
    <MarketplaceLayout>
      <MarketplaceHeader
        title="Campanhas"
        subtitle="Comunique-se com seus pacientes"
        actions={
          <Button
            className="bg-marketplace hover:bg-marketplace/90"
            onClick={handleCreateCampaign}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nova Campanha</span>
          </Button>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Campaign Type Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {Object.entries(typeConfig).map(([type, config]) => (
            <Card
              key={type}
              className="border-marketplace-border cursor-pointer hover:shadow-md transition-shadow"
              onClick={handleCreateCampaign}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <config.icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div>
                  <p className="font-medium">Campanha {config.label}</p>
                  <p className="text-xs text-muted-foreground">Criar nova</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="all">
              Todas
              <Badge variant="secondary" className="ml-2">
                {campaigns.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="draft">Rascunhos</TabsTrigger>
            <TabsTrigger value="scheduled">Agendadas</TabsTrigger>
            <TabsTrigger value="sent">Enviadas</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Campaigns List */}
        <div className="space-y-4">
          {filteredCampaigns.length > 0 ? (
            filteredCampaigns.map((campaign) => {
              const typeInfo = typeConfig[campaign.type];
              const statusInfo = statusConfig[campaign.status];
              const TypeIcon = typeInfo.icon;

              return (
                <Card key={campaign.id} className="border-marketplace-border">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <TypeIcon className={`h-5 w-5 ${typeInfo.color}`} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{campaign.name}</h3>
                            <Badge className={`${statusInfo.bgColor} ${statusInfo.color}`}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {campaign.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Público: {campaign.targetAudience}</span>
                            {campaign.scheduledAt && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(campaign.scheduledAt), "dd/MM 'às' HH:mm", {
                                  locale: ptBR,
                                })}
                              </span>
                            )}
                            {campaign.sentAt && (
                              <span className="flex items-center gap-1">
                                <Send className="h-3 w-3" />
                                Enviada em{" "}
                                {format(new Date(campaign.sentAt), "dd/MM", {
                                  locale: ptBR,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {campaign.status === "sent" && campaign.sentCount && (
                          <div className="text-right mr-2">
                            <p className="text-sm font-medium">{campaign.sentCount}</p>
                            <p className="text-xs text-muted-foreground">enviados</p>
                          </div>
                        )}
                        {campaign.status === "sent" && campaign.openRate && (
                          <div className="text-right mr-2">
                            <p className="text-sm font-medium text-marketplace-accent">
                              {campaign.openRate}%
                            </p>
                            <p className="text-xs text-muted-foreground">abertura</p>
                          </div>
                        )}
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-marketplace/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-marketplace" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Nenhuma campanha encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Crie campanhas para se comunicar com seus pacientes.
              </p>
              <Button
                className="bg-marketplace hover:bg-marketplace/90"
                onClick={handleCreateCampaign}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar campanha
              </Button>
            </div>
          )}
        </div>
      </div>
    </MarketplaceLayout>
  );
}
