/**
 * CPG Advocacia Médica Leads - Gestão de Leads Jurídicos
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  TrendingUp, 
  Flame,
  Thermometer,
  Snowflake,
  Phone,
  Mail,
  MessageCircle,
  Loader2,
  Users,
} from "lucide-react";

interface LeadData {
  userId: string;
  name: string;
  avatarUrl: string | null;
  email: string | null;
  phone: string | null;
  scoreLegal: number;
  scoreTotal: number;
  classification: 'hot' | 'warm' | 'cold';
  feeling: string | null;
  influence: string | null;
  timing: string | null;
}

const classificationConfig = {
  hot: { 
    label: 'HOT', 
    description: 'Alta urgência - Prioridade máxima',
    icon: Flame, 
    bg: 'bg-rose-100 dark:bg-rose-900/30', 
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300',
    gradient: 'from-rose-500 to-orange-500'
  },
  warm: { 
    label: 'WARM', 
    description: 'Interesse moderado - Nutrir',
    icon: Thermometer, 
    bg: 'bg-amber-100 dark:bg-amber-900/30', 
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300',
    gradient: 'from-amber-500 to-yellow-500'
  },
  cold: { 
    label: 'COLD', 
    description: 'Baixo interesse - Acompanhar',
    icon: Snowflake, 
    bg: 'bg-blue-100 dark:bg-blue-900/30', 
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300',
    gradient: 'from-blue-500 to-cyan-500'
  },
};

export default function IpromedLeads() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'hot' | 'warm' | 'cold'>('hot');

  // Fetch leads data
  const { data: leads, isLoading } = useQuery({
    queryKey: ['ipromed-leads'],
    queryFn: async () => {
      const { data: surveys, error } = await supabase
        .from('day2_satisfaction_surveys')
        .select(`
          user_id,
          score_legal,
          score_total,
          lead_classification,
          q18_legal_feeling,
          q19_legal_influence,
          q20_legal_timing
        `)
        .eq('is_completed', true);
      
      if (error) throw error;

      // Get profiles
      const userIds = [...new Set(surveys?.map(s => s.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url, email')
        .in('user_id', userIds);

      // Get phones from neohub_users
      const { data: neohubUsers } = await supabase
        .from('neohub_users')
        .select('user_id, phone')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const phoneMap = new Map(neohubUsers?.map(u => [u.user_id, u.phone]) || []);

      return surveys?.map(s => ({
        userId: s.user_id,
        name: profileMap.get(s.user_id)?.name || 'Anônimo',
        avatarUrl: profileMap.get(s.user_id)?.avatar_url || null,
        email: profileMap.get(s.user_id)?.email || null,
        phone: phoneMap.get(s.user_id) || null,
        scoreLegal: s.score_legal || 0,
        scoreTotal: s.score_total || 0,
        classification: (s.lead_classification as 'hot' | 'warm' | 'cold') || 'cold',
        feeling: s.q18_legal_feeling,
        influence: s.q19_legal_influence,
        timing: s.q20_legal_timing,
      })) || [];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group leads by classification
  const groupedLeads = {
    hot: leads?.filter(l => l.classification === 'hot').sort((a, b) => b.scoreLegal - a.scoreLegal) || [],
    warm: leads?.filter(l => l.classification === 'warm').sort((a, b) => b.scoreLegal - a.scoreLegal) || [],
    cold: leads?.filter(l => l.classification === 'cold').sort((a, b) => b.scoreLegal - a.scoreLegal) || [],
  };

  const renderLeadCard = (lead: LeadData) => {
    const config = classificationConfig[lead.classification];
    return (
      <Card key={lead.userId} className={`border-l-4 ${config.border}`}>
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={lead.avatarUrl || undefined} />
              <AvatarFallback className={`bg-gradient-to-br ${config.gradient} text-white`}>
                {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{lead.name}</h3>
                <Badge className={`${config.bg} ${config.text} border ${config.border}`}>
                  <config.icon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <span className="font-medium">Score Legal:</span>
                  <span>{lead.scoreLegal}/18</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Score Total:</span>
                  <span>{lead.scoreTotal}/54</span>
                </div>
              </div>

              {/* Quick Info */}
              <div className="space-y-1 text-xs text-muted-foreground">
                {lead.feeling && (
                  <p><span className="font-medium">Sentimento:</span> {lead.feeling}</p>
                )}
                {lead.timing && (
                  <p><span className="font-medium">Timing:</span> {lead.timing}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                {lead.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${lead.phone}`}>
                      <Phone className="h-3 w-3 mr-1" />
                      Ligar
                    </a>
                  </Button>
                )}
                {lead.email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${lead.email}`}>
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </a>
                  </Button>
                )}
                {lead.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="font-medium">Leads Jurídicos</span>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Leads Jurídicos</h1>
        <p className="text-muted-foreground">
          Gerencie e priorize contatos por interesse em serviços jurídicos
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(['hot', 'warm', 'cold'] as const).map((type) => {
          const config = classificationConfig[type];
          return (
            <Card 
              key={type} 
              className={`cursor-pointer transition-all ${activeTab === type ? 'ring-2 ring-primary shadow-lg' : ''}`}
              onClick={() => setActiveTab(type)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`p-4 bg-gradient-to-br ${config.gradient} rounded-xl shadow-md`}>
                    <config.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{config.label}</p>
                    <p className="text-3xl font-bold">{groupedLeads[type].length}</p>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Leads Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'hot' | 'warm' | 'cold')}>
        <TabsList>
          <TabsTrigger value="hot" className="gap-2">
            <Flame className="h-4 w-4" />
            HOT ({groupedLeads.hot.length})
          </TabsTrigger>
          <TabsTrigger value="warm" className="gap-2">
            <Thermometer className="h-4 w-4" />
            WARM ({groupedLeads.warm.length})
          </TabsTrigger>
          <TabsTrigger value="cold" className="gap-2">
            <Snowflake className="h-4 w-4" />
            COLD ({groupedLeads.cold.length})
          </TabsTrigger>
        </TabsList>

        {(['hot', 'warm', 'cold'] as const).map((type) => (
          <TabsContent key={type} value={type} className="mt-4">
            {groupedLeads[type].length > 0 ? (
              <div className="grid gap-4">
                {groupedLeads[type].map(renderLeadCard)}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum lead {classificationConfig[type].label} encontrado</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
