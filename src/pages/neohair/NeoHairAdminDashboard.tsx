import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Package, 
  TrendingUp, 
  DollarSign, 
  Settings,
  ArrowUpRight,
  Target,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export default function NeoHairAdminDashboard() {
  const { isAdmin } = useUnifiedAuth();

  // Stats gerais
  const { data: stats } = useQuery({
    queryKey: ['neohair-admin-stats'],
    queryFn: async () => {
      const [evaluations, leads, orders, products] = await Promise.all([
        supabase.from('neohair_evaluations').select('id, status, transplant_score', { count: 'exact' }),
        supabase.from('neohair_leads').select('id, status', { count: 'exact' }),
        supabase.from('neohair_orders').select('id, total, payment_status', { count: 'exact' }),
        supabase.from('neohair_products').select('id', { count: 'exact' }),
      ]);

      const paidOrders = orders.data?.filter(o => o.payment_status === 'paid') || [];
      const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      
      const convertedLeads = leads.data?.filter(l => l.status === 'converted') || [];
      const conversionRate = leads.data?.length 
        ? Math.round((convertedLeads.length / leads.data.length) * 100)
        : 0;

      return {
        totalEvaluations: evaluations.count || 0,
        totalLeads: leads.count || 0,
        totalOrders: orders.count || 0,
        totalProducts: products.count || 0,
        totalRevenue,
        conversionRate,
        newLeads: leads.data?.filter(l => l.status === 'new').length || 0,
        pendingOrders: orders.data?.filter(o => o.payment_status === 'pending').length || 0,
      };
    },
    enabled: isAdmin,
  });

  // Leads recentes
  const { data: recentLeads } = useQuery({
    queryKey: ['neohair-recent-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neohair_leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
        <p>Acesso restrito a administradores</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Painel Administrativo NeoHair</h1>
          <p className="text-muted-foreground">Visão geral do portal de tratamento capilar</p>
        </div>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Configurações
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avaliações</p>
                <p className="text-3xl font-bold">{stats?.totalEvaluations || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-teal-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads</p>
                <p className="text-3xl font-bold">{stats?.totalLeads || 0}</p>
                {stats?.newLeads ? (
                  <Badge className="mt-1 bg-blue-500/20 text-blue-400">{stats.newLeads} novos</Badge>
                ) : null}
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pedidos</p>
                <p className="text-3xl font-bold">{stats?.totalOrders || 0}</p>
                {stats?.pendingOrders ? (
                  <Badge className="mt-1 bg-amber-500/20 text-amber-400">{stats.pendingOrders} pendentes</Badge>
                ) : null}
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Package className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita</p>
                <p className="text-3xl font-bold">
                  R$ {(stats?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button variant="outline" className="h-auto py-4 justify-start" asChild>
          <a href="/neohair/admin/produtos">
            <Package className="mr-3 h-5 w-5 text-teal-500" />
            <div className="text-left">
              <p className="font-medium">Produtos</p>
              <p className="text-xs text-muted-foreground">{stats?.totalProducts || 0} produtos</p>
            </div>
          </a>
        </Button>

        <Button variant="outline" className="h-auto py-4 justify-start" asChild>
          <a href="/neohair/admin/leads">
            <Users className="mr-3 h-5 w-5 text-blue-500" />
            <div className="text-left">
              <p className="font-medium">Gestão de Leads</p>
              <p className="text-xs text-muted-foreground">Distribuição e atribuição</p>
            </div>
          </a>
        </Button>

        <Button variant="outline" className="h-auto py-4 justify-start" asChild>
          <a href="/neohair/admin/distribuicao">
            <TrendingUp className="mr-3 h-5 w-5 text-purple-500" />
            <div className="text-left">
              <p className="font-medium">Distribuição</p>
              <p className="text-xs text-muted-foreground">Regras e prioridades</p>
            </div>
          </a>
        </Button>

        <Button variant="outline" className="h-auto py-4 justify-start" asChild>
          <a href="/neohair/admin/relatorios">
            <BarChart3 className="mr-3 h-5 w-5 text-emerald-500" />
            <div className="text-left">
              <p className="font-medium">Relatórios</p>
              <p className="text-xs text-muted-foreground">Métricas e análises</p>
            </div>
          </a>
        </Button>
      </div>

      {/* Leads Recentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Leads Recentes</CardTitle>
            <CardDescription>Últimos leads gerados pelo sistema</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/neohair/admin/leads">
              Ver Todos
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardHeader>
        <CardContent>
          {recentLeads?.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum lead ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentLeads?.map((lead: any) => (
                <div 
                  key={lead.id} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {lead.patient_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{lead.patient_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{lead.patient_city}, {lead.patient_state}</span>
                        <span>•</span>
                        <span>Score {lead.transplant_score}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {lead.assigned_to ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Atribuído
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-400">
                        <Clock className="h-3 w-3 mr-1" />
                        Pendente
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Taxa de Conversão */}
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Taxa de Conversão Geral</p>
              <p className="text-4xl font-bold">{stats?.conversionRate || 0}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Meta: 15%</p>
              <p className={`font-medium ${(stats?.conversionRate || 0) >= 15 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {(stats?.conversionRate || 0) >= 15 ? 'Dentro da meta ✓' : 'Abaixo da meta'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
