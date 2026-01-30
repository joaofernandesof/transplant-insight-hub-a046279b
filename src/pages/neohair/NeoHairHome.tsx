import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Scan, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Stethoscope,
  ArrowRight,
  CheckCircle2,
  Clock,
  Star,
  Sparkles
} from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function NeoHairHome() {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();

  // Buscar última avaliação do usuário
  const { data: evaluation, isLoading: loadingEval } = useQuery({
    queryKey: ['neohair-evaluation', user?.authUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neohair_evaluations')
        .select('*')
        .eq('user_id', user?.authUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.authUserId,
  });

  // Buscar pedidos do usuário
  const { data: orders } = useQuery({
    queryKey: ['neohair-orders', user?.authUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neohair_orders')
        .select('*')
        .eq('user_id', user?.authUserId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.authUserId,
  });

  const hasEvaluation = !!evaluation;
  const hasActiveOrder = orders?.some(o => o.payment_status === 'paid' && o.is_recurring);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-teal-500" />
            Olá, {user?.fullName?.split(' ')[0] || 'Paciente'}!
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu painel de tratamento capilar
          </p>
        </div>
        {!hasEvaluation && (
          <Button 
            onClick={() => navigate('/neohair/avaliacao')}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
          >
            <Scan className="mr-2 h-4 w-4" />
            Fazer Avaliação
          </Button>
        )}
      </div>

      {/* Status da Avaliação */}
      {hasEvaluation ? (
        <Card className="border-teal-500/30 bg-teal-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-teal-500" />
                Sua Avaliação Capilar
              </CardTitle>
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
                Grau {evaluation.baldness_grade || '?'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Classificação</p>
                <p className="font-medium">{evaluation.baldness_pattern || 'Analisando...'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score de Transplante</p>
                <div className="flex items-center gap-2">
                  <Progress value={evaluation.transplant_score || 0} className="flex-1 h-2" />
                  <span className="text-sm font-medium">{evaluation.transplant_score || 0}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recomendação</p>
                <p className="font-medium capitalize">{evaluation.treatment_recommendation?.replace('_', ' ') || 'Pendente'}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/neohair/evolucao')}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Ver Evolução
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/neohair/avaliacao')}
              >
                Nova Reavaliação
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="py-12 text-center">
            <Scan className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Faça sua Avaliação Capilar</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Descubra seu grau de calvície e receba uma recomendação personalizada de tratamento
            </p>
            <Button 
              onClick={() => navigate('/neohair/avaliacao')}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            >
              Iniciar Avaliação
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:border-teal-500/50 transition-colors"
          onClick={() => navigate('/neohair/loja')}
        >
          <CardContent className="pt-6">
            <ShoppingCart className="h-8 w-8 text-teal-500 mb-3" />
            <h3 className="font-semibold mb-1">Loja de Tratamentos</h3>
            <p className="text-sm text-muted-foreground">Kits personalizados para seu caso</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-teal-500/50 transition-colors"
          onClick={() => navigate('/neohair/evolucao')}
        >
          <CardContent className="pt-6">
            <TrendingUp className="h-8 w-8 text-cyan-500 mb-3" />
            <h3 className="font-semibold mb-1">Minha Evolução</h3>
            <p className="text-sm text-muted-foreground">Acompanhe seu progresso mensal</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-teal-500/50 transition-colors"
          onClick={() => navigate('/neohair/pedidos')}
        >
          <CardContent className="pt-6">
            <Package className="h-8 w-8 text-emerald-500 mb-3" />
            <h3 className="font-semibold mb-1">Meus Pedidos</h3>
            <p className="text-sm text-muted-foreground">
              {orders?.length || 0} pedido(s) realizados
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-teal-500/50 transition-colors"
          onClick={() => navigate('/neohair/consulta')}
        >
          <CardContent className="pt-6">
            <Stethoscope className="h-8 w-8 text-blue-500 mb-3" />
            <h3 className="font-semibold mb-1">Agendar Consulta</h3>
            <p className="text-sm text-muted-foreground">Avaliação médica especializada</p>
          </CardContent>
        </Card>
      </div>

      {/* Tratamento Ativo */}
      {hasActiveOrder && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Seu Tratamento Ativo
            </CardTitle>
            <CardDescription>
              Você está em dia com seu tratamento recorrente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Kit Tratamento Mensal</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Próxima cobrança em 15 dias
                </p>
              </div>
              <Button variant="outline" size="sm">
                Gerenciar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      {hasEvaluation && evaluation.transplant_score >= 60 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="h-6 w-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Consulta Médica Recomendada</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Baseado no seu score de transplante ({evaluation.transplant_score}%), recomendamos uma 
                  avaliação com um especialista para discutir suas opções.
                </p>
                <Button 
                  onClick={() => navigate('/neohair/consulta')}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Agendar Consulta
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
