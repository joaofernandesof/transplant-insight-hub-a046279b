import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Thermometer, Snowflake, Zap, Target, Shield, MessageSquare, User } from 'lucide-react';

interface SurveyUser {
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface Day2Survey {
  id: string;
  user_id: string;
  is_completed: boolean;
  current_section: number;
  score_ia_avivar: number;
  score_license: number;
  score_legal: number;
  score_total: number;
  lead_classification: string;
  completed_at: string | null;
  // All question fields
  q1_satisfaction_level?: string | null;
  q2_joao_expectations?: string | null;
  q3_joao_clarity?: string | null;
  q4_joao_time?: string | null;
  q5_joao_liked_most?: string | null;
  q6_joao_improve?: string | null;
  q7_larissa_expectations?: string | null;
  q8_larissa_clarity?: string | null;
  q9_larissa_time?: string | null;
  q10_larissa_liked_most?: string | null;
  q11_larissa_improve?: string | null;
  q12_avivar_current_process?: string | null;
  q13_avivar_opportunity_loss?: string | null;
  q14_avivar_timing?: string | null;
  q15_license_path?: string | null;
  q16_license_pace?: string | null;
  q17_license_timing?: string | null;
  q18_legal_feeling?: string | null;
  q19_legal_influence?: string | null;
  q20_legal_timing?: string | null;
  neohub_users: SurveyUser;
}

interface Day2SurveyDetailsDialogProps {
  survey: Day2Survey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const questionLabels: Record<string, string> = {
  q1_satisfaction_level: 'Qual é o seu nível de satisfação geral com a formação até agora?',
  q2_joao_expectations: 'João atendeu às suas expectativas?',
  q3_joao_clarity: 'A didática de João foi clara?',
  q4_joao_time: 'O tempo de João foi adequado?',
  q5_joao_liked_most: 'O que você mais gostou na apresentação do João?',
  q6_joao_improve: 'O que João pode melhorar?',
  q7_larissa_expectations: 'Larissa atendeu às suas expectativas?',
  q8_larissa_clarity: 'A didática de Larissa foi clara?',
  q9_larissa_time: 'O tempo de Larissa foi adequado?',
  q10_larissa_liked_most: 'O que você mais gostou na apresentação da Larissa?',
  q11_larissa_improve: 'O que Larissa pode melhorar?',
  q12_avivar_current_process: 'Como é seu processo de follow-up atual?',
  q13_avivar_opportunity_loss: 'Você sente que perde oportunidades por falta de automação?',
  q14_avivar_timing: 'Quando você pretende implementar automação?',
  q15_license_path: 'Montar uma clínica própria é viável para você?',
  q16_license_pace: 'O ritmo atual de crescimento te expõe?',
  q17_license_timing: 'Quando você pensa em expandir/escalar?',
  q18_legal_feeling: 'Como você se sente em relação à parte jurídica?',
  q19_legal_influence: 'Dúvidas jurídicas influenciam suas decisões?',
  q20_legal_timing: 'Quando você pensa em organizar a parte jurídica?',
};

const sectionConfig = [
  { title: 'Satisfação Geral', icon: MessageSquare, keys: ['q1_satisfaction_level'], color: 'text-primary' },
  { title: 'Avaliação João', icon: User, keys: ['q2_joao_expectations', 'q3_joao_clarity', 'q4_joao_time', 'q5_joao_liked_most', 'q6_joao_improve'], color: 'text-blue-500' },
  { title: 'Avaliação Larissa', icon: User, keys: ['q7_larissa_expectations', 'q8_larissa_clarity', 'q9_larissa_time', 'q10_larissa_liked_most', 'q11_larissa_improve'], color: 'text-purple-500' },
  { title: 'IA Avivar', icon: Zap, keys: ['q12_avivar_current_process', 'q13_avivar_opportunity_loss', 'q14_avivar_timing'], color: 'text-yellow-500' },
  { title: 'Licença', icon: Target, keys: ['q15_license_path', 'q16_license_pace', 'q17_license_timing'], color: 'text-green-500' },
  { title: 'Jurídico', icon: Shield, keys: ['q18_legal_feeling', 'q19_legal_influence', 'q20_legal_timing'], color: 'text-red-500' },
];

export function Day2SurveyDetailsDialog({ survey, open, onOpenChange }: Day2SurveyDetailsDialogProps) {
  if (!survey) return null;

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'hot':
        return <Badge className="bg-destructive text-destructive-foreground"><Flame className="h-3 w-3 mr-1" />Quente</Badge>;
      case 'warm':
        return <Badge className="bg-warning text-warning-foreground"><Thermometer className="h-3 w-3 mr-1" />Morno</Badge>;
      case 'cold':
        return <Badge className="bg-accent text-accent-foreground"><Snowflake className="h-3 w-3 mr-1" />Frio</Badge>;
      default:
        return <Badge variant="outline">{classification}</Badge>;
    }
  };

  const getValue = (key: string): string | null => {
    return (survey as any)[key] || null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={survey.neohub_users.avatar_url || ''} />
              <AvatarFallback>
                {survey.neohub_users.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span>{survey.neohub_users.full_name}</span>
                {getClassificationBadge(survey.lead_classification)}
              </div>
              <p className="text-sm font-normal text-muted-foreground">{survey.neohub_users.email}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Score Summary */}
        <div className="grid grid-cols-4 gap-3 py-4">
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="p-3 text-center">
              <Zap className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">IA Avivar</p>
              <p className="text-lg font-bold">{survey.score_ia_avivar}/18</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-3 text-center">
              <Target className="h-4 w-4 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Licença</p>
              <p className="text-lg font-bold">{survey.score_license}/18</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-3 text-center">
              <Shield className="h-4 w-4 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Jurídico</p>
              <p className="text-lg font-bold">{survey.score_legal}/18</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-primary">{survey.score_total}/54</p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* All Answers */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {sectionConfig.map((section) => {
              const Icon = section.icon;
              const hasAnswers = section.keys.some(key => getValue(key));
              
              return (
                <div key={section.title}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`h-4 w-4 ${section.color}`} />
                    <h3 className="font-semibold">{section.title}</h3>
                    {!hasAnswers && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Não respondido
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-3 pl-6">
                    {section.keys.map((key) => {
                      const answer = getValue(key);
                      
                      return (
                        <div key={key} className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {questionLabels[key]}
                          </p>
                          {answer ? (
                            <p className="text-sm font-medium bg-muted/50 px-3 py-2 rounded-lg">
                              {answer}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">—</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
