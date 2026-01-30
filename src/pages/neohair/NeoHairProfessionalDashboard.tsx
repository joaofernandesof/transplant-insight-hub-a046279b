import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target,
  UserCheck,
  Phone,
  Calendar,
  ArrowUpRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

interface NeoHairLead {
  id: string;
  patient_name: string;
  patient_phone: string | null;
  patient_city: string | null;
  patient_state: string | null;
  transplant_score: number;
  baldness_grade: number | null;
  lead_priority: string;
  status: string;
  created_at: string;
  scheduled_date: string | null;
}

export default function NeoHairProfessionalDashboard() {
  const { user } = useUnifiedAuth();

  const { data: leads } = useQuery({
    queryKey: ['neohair-my-leads', user?.authUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neohair_leads')
        .select('*')
        .eq('assigned_to', user?.authUserId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as NeoHairLead[];
    },
    enabled: !!user?.authUserId,
  });

  const newLeads = leads?.filter(l => l.status === 'new') || [];
  const contactedLeads = leads?.filter(l => l.status === 'contacted') || [];
  const scheduledLeads = leads?.filter(l => l.status === 'scheduled') || [];
  const convertedLeads = leads?.filter(l => l.status === 'converted') || [];

  const conversionRate = leads?.length 
    ? Math.round((convertedLeads.length / leads.length) * 100) 
    : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <Badge className="bg-blue-500/20 text-blue-400">Novo</Badge>;
      case 'contacted': return <Badge className="bg-amber-500/20 text-amber-400">Contatado</Badge>;
      case 'scheduled': return <Badge className="bg-purple-500/20 text-purple-400">Agendado</Badge>;
      case 'converted': return <Badge className="bg-emerald-500/20 text-emerald-400">Convertido</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityIndicator = (priority: string) => {
    if (priority === 'high' || priority === 'urgent') {
      return <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />;
    }
    return null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard Profissional</h1>
        <p className="text-muted-foreground">Gerencie seus leads de transplante capilar</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Novos Leads</p>
                <p className="text-3xl font-bold">{newLeads.length}</p>
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
                <p className="text-sm text-muted-foreground">Agendados</p>
                <p className="text-3xl font-bold">{scheduledLeads.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Convertidos</p>
                <p className="text-3xl font-bold">{convertedLeads.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                <p className="text-3xl font-bold">{conversionRate}%</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-teal-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-teal-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads Prioritários */}
      {newLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-teal-500" />
              Leads Prioritários
            </CardTitle>
            <CardDescription>Leads que precisam de contato imediato</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {newLeads.slice(0, 5).map((lead) => (
                <div 
                  key={lead.id} 
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getPriorityIndicator(lead.lead_priority)}
                    <div>
                      <p className="font-medium">{lead.patient_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {lead.patient_city}, {lead.patient_state} • Score: {lead.transplant_score}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(lead.status)}
                    {lead.patient_phone && (
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4 mr-1" />
                        Ligar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Todos os Leads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Todos os Leads</CardTitle>
            <CardDescription>{leads?.length || 0} leads no total</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Ver Todos
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {leads?.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum lead atribuído ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leads?.slice(0, 10).map((lead) => (
                <div 
                  key={lead.id} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {lead.patient_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{lead.patient_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Grau {lead.baldness_grade || '?'}</span>
                        <span>•</span>
                        <span>Score {lead.transplant_score}%</span>
                        {lead.scheduled_date && (
                          <>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>{new Date(lead.scheduled_date).toLocaleDateString('pt-BR')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(lead.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
