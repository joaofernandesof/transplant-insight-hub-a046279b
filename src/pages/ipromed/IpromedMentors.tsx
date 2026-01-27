/**
 * IPROMED Mentors - Avaliação das Mentoras Jurídicas
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  UserCheck, 
  Star,
  MessageSquare,
  ThumbsUp,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { FeedbackCard, type FeedbackWithAuthor } from "@/neohub/components/academy/FeedbackCard";

interface MentorMetrics {
  name: string;
  initials: string;
  expectations: number;
  clarity: number;
  time: number;
  overall: number;
  totalResponses: number;
  feedbacksPositive: FeedbackWithAuthor[];
  feedbacksImprove: FeedbackWithAuthor[];
}

export default function IpromedMentors() {
  const navigate = useNavigate();

  // Fetch mentor evaluation data
  const { data, isLoading } = useQuery({
    queryKey: ['ipromed-mentors'],
    queryFn: async () => {
      const { data: surveys, error } = await supabase
        .from('day2_satisfaction_surveys')
        .select(`
          user_id,
          q7_larissa_expectations, 
          q8_larissa_clarity, 
          q9_larissa_time, 
          q10_larissa_liked_most, 
          q11_larissa_improve
        `)
        .eq('is_completed', true);
      
      if (error) throw error;

      // Get profiles for feedback attribution
      const userIds = [...new Set(surveys?.map(s => s.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Calculate metrics
      const mapExpectation = (val: string | null) => {
        if (!val) return null;
        const v = val.toLowerCase();
        if (v.includes('superou') || v.includes('totalmente')) return 10;
        if (v.includes('atendeu') && !v.includes('parcial')) return 8;
        if (v.includes('parcial')) return 6;
        return 5;
      };

      const mapClarity = (val: string | null) => {
        if (!val) return null;
        const v = val.toLowerCase();
        if (v.includes('totalmente') || v.includes('excelente')) return 10;
        if (v.includes('concordo') && !v.includes('totalmente')) return 8;
        if (v.includes('neutro') || v.includes('razoável')) return 6;
        if (v.includes('discordo')) return 4;
        return 5;
      };

      const mapTime = (val: string | null) => {
        if (!val) return null;
        const v = val.toLowerCase();
        if (v.includes('mais do que') || v.includes('ideal')) return 10;
        if (v.includes('adequado')) return 9;
        if (v.includes('curto')) return 6;
        return 7;
      };

      const expectations = surveys?.map(d => mapExpectation(d.q7_larissa_expectations)).filter(Boolean) as number[] || [];
      const clarity = surveys?.map(d => mapClarity(d.q8_larissa_clarity)).filter(Boolean) as number[] || [];
      const time = surveys?.map(d => mapTime(d.q9_larissa_time)).filter(Boolean) as number[] || [];

      const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      const larissaMetrics: MentorMetrics = {
        name: 'Dra. Larissa',
        initials: 'DL',
        expectations: avg(expectations),
        clarity: avg(clarity),
        time: avg(time),
        overall: (avg(expectations) + avg(clarity) + avg(time)) / 3,
        totalResponses: surveys?.length || 0,
        feedbacksPositive: surveys
          ?.filter(d => d.q10_larissa_liked_most && d.q10_larissa_liked_most.length > 2)
          .map(d => ({
            feedback: d.q10_larissa_liked_most as string,
            userName: profileMap.get(d.user_id)?.name || 'Anônimo',
            avatarUrl: profileMap.get(d.user_id)?.avatar_url
          })) || [],
        feedbacksImprove: surveys
          ?.filter(d => d.q11_larissa_improve && d.q11_larissa_improve.length > 2)
          .map(d => ({
            feedback: d.q11_larissa_improve as string,
            userName: profileMap.get(d.user_id)?.name || 'Anônimo',
            avatarUrl: profileMap.get(d.user_id)?.avatar_url
          })) || []
      };

      return { larissa: larissaMetrics };
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { larissa } = data || {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/ipromed')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          IPROMED
        </Button>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-primary" />
          <span className="font-medium">Mentoras</span>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Avaliação das Mentoras</h1>
        <p className="text-muted-foreground">
          Métricas de satisfação com as mentoras do módulo jurídico
        </p>
      </div>

      {/* Mentor Cards */}
      {larissa && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl">
                  {larissa.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{larissa.name}</CardTitle>
                <CardDescription>Mentora Jurídica • Direito Médico</CardDescription>
              </div>
              <div className="ml-auto text-right">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="text-2xl font-bold">{larissa.overall.toFixed(1)}</span>
                  <span className="text-muted-foreground">/10</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {larissa.totalResponses} avaliações
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Expectativas</span>
                  <span className="text-sm text-muted-foreground">{larissa.expectations.toFixed(1)}/10</span>
                </div>
                <Progress value={larissa.expectations * 10} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Clareza</span>
                  <span className="text-sm text-muted-foreground">{larissa.clarity.toFixed(1)}/10</span>
                </div>
                <Progress value={larissa.clarity * 10} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Gestão do Tempo</span>
                  <span className="text-sm text-muted-foreground">{larissa.time.toFixed(1)}/10</span>
                </div>
                <Progress value={larissa.time * 10} className="h-2" />
              </div>
            </div>

            {/* Feedbacks */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Positive */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">
                    O que mais gostaram
                  </h3>
                  <Badge variant="secondary">{larissa.feedbacksPositive.length}</Badge>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {larissa.feedbacksPositive.slice(0, 5).map((fb, idx) => (
                    <FeedbackCard key={idx} item={fb} variant="positive" />
                  ))}
                </div>
              </div>

              {/* Improvements */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  <h3 className="font-semibold text-amber-700 dark:text-amber-400">
                    Sugestões de melhoria
                  </h3>
                  <Badge variant="secondary">{larissa.feedbacksImprove.length}</Badge>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {larissa.feedbacksImprove.slice(0, 5).map((fb, idx) => (
                    <FeedbackCard key={idx} item={fb} variant="improvement" />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
