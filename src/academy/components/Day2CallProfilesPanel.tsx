import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Phone, User, Target, Zap, Shield, DollarSign, MapPin, Briefcase, 
  Clock, TrendingUp, AlertCircle, CheckCircle, Star, MessageSquare,
  Building, Brain, Flame, Thermometer, Snowflake
} from 'lucide-react';

interface CallProfile {
  id: string;
  name: string;
  role: string;
  callDate: string;
  callDuration: string;
  avatar?: string;
  summary: string;
  
  // Profile data
  currentSituation: string;
  location: string;
  experience: string;
  
  // Commercial potential
  iaAvivarPotential: 'high' | 'medium' | 'low';
  iaAvivarNotes: string;
  licensePotential: 'high' | 'medium' | 'low';
  licenseNotes: string;
  legalPotential: 'high' | 'medium' | 'low';
  legalNotes: string;
  
  // Key insights
  painPoints: string[];
  objectives: string[];
  objections: string[];
  decisionFactors: string[];
  
  // Recommendation
  recommendedApproach: string;
  urgencyLevel: 'high' | 'medium' | 'low';
  nextSteps: string[];
}

// Hardcoded call profiles extracted from the transcriptions
const callProfiles: CallProfile[] = [
  {
    id: 'maria-pereira',
    name: 'Maria Pereira',
    role: 'Instrumentadora',
    callDate: '16/12/2025',
    callDuration: '22 min',
    summary: 'Instrumentadora experiente que trabalhou com Dr. Elvis (aluno sucesso). Busca transição para o mercado de transplante capilar como instrumentadora elite. Demonstra visão de crescimento e entende o potencial do mercado.',
    
    currentSituation: 'Trabalhou como instrumentadora em ortopedia e com Dr. Elvis em transplante. Busca especialização formal no mercado de transplante capilar.',
    location: 'Não especificado',
    experience: 'Experiência prévia com transplante capilar (Dr. Elvis), atuação em ortopedia, deu aula em escola de instrumentação.',
    
    iaAvivarPotential: 'medium',
    iaAvivarNotes: 'Como instrumentadora, não é decisora direta do uso de IA na clínica, mas pode influenciar médicos com quem trabalha. Conhece o sucesso do Dr. Elvis que usa a IA Avivar.',
    licensePotential: 'low',
    licenseNotes: 'R$ 80k não é viável para instrumentadora. Foco deve ser em conexão com médicos que podem comprar.',
    legalPotential: 'low',
    legalNotes: 'Não é decisora de assessoria jurídica. Perfil de empregada/contratada, não empresária.',
    
    painPoints: [
      'Mercado de ortopedia não paga bem',
      'Dificuldade de encontrar cursos de qualidade',
      'Precisa de credenciamento formal para o mercado'
    ],
    objectives: [
      'Ser instrumentadora elite em transplante capilar',
      'Ter carteira de médicos para trabalhar',
      'Possivelmente montar equipe neofólica própria'
    ],
    objections: [
      'Investimento de R$ 15k parece alto para instrumentador',
      'Precisa validar retorno financeiro'
    ],
    decisionFactors: [
      'ROI: 4 cirurgias/dia = R$ 8k/dia',
      'Escassez de profissionais qualificados',
      'Acesso a rede de 20+ médicos',
      'Influência de Dr. Elvis (conhece e confia)'
    ],
    
    recommendedApproach: 'Usar case do Dr. Elvis como prova social. Focar no potencial de faturamento como instrumentadora elite. Destacar a possibilidade de montar equipe neofólica futura.',
    urgencyLevel: 'medium',
    nextSteps: [
      'Follow-up após conversa com Dr. Elvis',
      'Enviar material sobre equipe neofólica',
      'Confirmar fechamento da matrícula R$ 1.000'
    ]
  },
  {
    id: 'alef-marchezi',
    name: 'Dr. Alef Marchezi',
    role: 'Médico (Estética)',
    callDate: '05/09/2025',
    callDuration: '43 min',
    summary: 'Médico já atuando com estética (harmonização, toxina, preenchimento). Esposa tem empresa de tráfego pago. Possui amigo fazendo 4 cirurgias/semana com ticket de R$ 20k. Plano de sair do interior de SP para Maringá. Perfil muito qualificado com estrutura empresarial familiar.',
    
    currentSituation: 'Atua no interior de SP com estética. Planeja migrar para Maringá no fim do ano. Já tem centro cirúrgico alugado na região atual.',
    location: 'Presidente Prudente, SP → Maringá, PR (plano)',
    experience: 'Harmonização facial, injetáveis, toxina botulínica. Não tem experiência em transplante.',
    
    iaAvivarPotential: 'high',
    iaAvivarNotes: 'Perfil ideal! Esposa tem empresa de tráfego pago e já trabalham juntos. Podem absorver 80k+ em tráfego com estrutura automatizada. Dr. Igor mencionou que gastam 80k/mês em tráfego com automação.',
    licensePotential: 'high',
    licenseNotes: 'Perfil empreendedor forte. Tem visão de escala, planeja montar clínica própria em Maringá. R$ 80k é viável considerando o ticket de R$ 20-30k por cirurgia.',
    legalPotential: 'high',
    legalNotes: 'Está estruturando negócio novo. Vai precisar de assessoria para montar clínica, contratos com equipe, regulamentação. Momento ideal para oferecer.',
    
    painPoints: [
      'Não acha profissional qualificado na região',
      'Amigo em Maringá tem dificuldade com tráfego local',
      'Precisa se planejar financeiramente para o investimento',
      'Indeciso entre residência e tricologia'
    ],
    objectives: [
      'Iniciar no mercado de transplante capilar',
      'Montar estrutura própria em Maringá',
      'Fazer pós-dermatologia em paralelo',
      'Escalar faturamento significativamente'
    ],
    objections: [
      'Ainda considerando fazer prova de residência (Enar)',
      'Precisa de tempo para decidir (fim de semana)',
      'Quer entender investimento inicial completo'
    ],
    decisionFactors: [
      'Amigo faturando 100k+ limpo com modelo similar',
      'Estrutura de mentoria contínua (não só curso)',
      'Equipe neofólica para primeiras cirurgias',
      'Esposa pode ajudar com marketing/tráfego',
      'Pode começar com R$ 20k (materiais + aluguel + marketing)'
    ],
    
    recommendedApproach: 'Enfatizar estrutura de mentoria contínua e acesso à equipe. Mostrar que não precisa escolher entre residência e tricologia (são complementares). Incluir esposa nas conversas sobre tráfego/marketing. Oferecer pacote completo: IA + mentoria + equipe.',
    urgencyLevel: 'high',
    nextSteps: [
      'Confirmação até segunda-feira sobre matrícula',
      'Enviar acesso ao Conecta Capilar (curso online)',
      'Agendar reunião com esposa sobre marketing',
      'Definir turma: novembro vs janeiro'
    ]
  }
];

const getPotentialBadge = (potential: 'high' | 'medium' | 'low') => {
  switch (potential) {
    case 'high':
      return <Badge className="bg-primary/10 text-primary border-primary/30"><TrendingUp className="h-3 w-3 mr-1" />Alto</Badge>;
    case 'medium':
      return <Badge className="bg-warning/10 text-warning border-warning/30"><Thermometer className="h-3 w-3 mr-1" />Médio</Badge>;
    case 'low':
      return <Badge className="bg-muted text-muted-foreground border-muted-foreground/30"><Snowflake className="h-3 w-3 mr-1" />Baixo</Badge>;
  }
};

const getUrgencyBadge = (urgency: 'high' | 'medium' | 'low') => {
  switch (urgency) {
    case 'high':
      return <Badge className="bg-destructive/10 text-destructive border-destructive/30"><Flame className="h-3 w-3 mr-1" />Urgente</Badge>;
    case 'medium':
      return <Badge className="bg-warning/10 text-warning border-warning/30"><Clock className="h-3 w-3 mr-1" />Moderado</Badge>;
    case 'low':
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Baixa</Badge>;
  }
};

interface Day2CallProfilesPanelProps {
  className?: string;
}

export function Day2CallProfilesPanel({ className }: Day2CallProfilesPanelProps) {
  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/20">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Perfil de Calls de Vendas</CardTitle>
              <CardDescription>
                Insights extraídos das transcrições de calls para qualificação comercial
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Cards */}
      {callProfiles.map((profile) => (
        <Card key={profile.id} className="overflow-hidden">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{profile.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>{profile.role}</span>
                    <span>•</span>
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{profile.location}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>Call em {profile.callDate} ({profile.callDuration})</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getUrgencyBadge(profile.urgencyLevel)}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mt-4 p-3 bg-background/50 rounded-lg border">
              <MessageSquare className="h-4 w-4 inline mr-2 text-primary" />
              {profile.summary}
            </p>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            {/* Commercial Potential Grid */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Potencial Comercial
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                {/* IA Avivar */}
                <div className="p-4 rounded-lg border bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">IA Avivar</span>
                    </div>
                    {getPotentialBadge(profile.iaAvivarPotential)}
                  </div>
                  <p className="text-xs text-muted-foreground">{profile.iaAvivarNotes}</p>
                </div>
                
                {/* Licença */}
                <div className="p-4 rounded-lg border bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Licença R$ 80k</span>
                    </div>
                    {getPotentialBadge(profile.licensePotential)}
                  </div>
                  <p className="text-xs text-muted-foreground">{profile.licenseNotes}</p>
                </div>
                
                {/* Jurídico */}
                <div className="p-4 rounded-lg border bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-warning" />
                      <span className="font-medium text-sm">Assessoria Jurídica</span>
                    </div>
                    {getPotentialBadge(profile.legalPotential)}
                  </div>
                  <p className="text-xs text-muted-foreground">{profile.legalNotes}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Pain Points & Objectives */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Dores Identificadas
                </h4>
                <ul className="space-y-2">
                  {profile.painPoints.map((pain, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-destructive mt-1">•</span>
                      <span>{pain}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  Objetivos do Lead
                </h4>
                <ul className="space-y-2">
                  {profile.objectives.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Separator />

            {/* Objections & Decision Factors */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-warning" />
                  Objeções Levantadas
                </h4>
                <ul className="space-y-2">
                  {profile.objections.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-warning mt-1">!</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Fatores de Decisão
                </h4>
                <ul className="space-y-2">
                  {profile.decisionFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">✓</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Separator />

            {/* Recommended Approach & Next Steps */}
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Abordagem Recomendada
              </h4>
              <p className="text-sm text-muted-foreground mb-4">{profile.recommendedApproach}</p>
              
              <h4 className="font-medium text-sm mb-2">Próximos Passos:</h4>
              <div className="flex flex-wrap gap-2">
                {profile.nextSteps.map((step, idx) => (
                  <Badge key={idx} variant="outline" className="bg-background">
                    {idx + 1}. {step}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Resumo das Calls</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total de Calls Analisadas</p>
                  <p className="text-2xl font-bold text-primary">{callProfiles.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Leads com Alto Potencial (IA)</p>
                  <p className="text-2xl font-bold text-primary">
                    {callProfiles.filter(p => p.iaAvivarPotential === 'high').length}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Leads com Alto Potencial (Licença)</p>
                  <p className="text-2xl font-bold text-primary">
                    {callProfiles.filter(p => p.licensePotential === 'high').length}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                <strong>Dr. Alef Marchezi</strong> é o lead mais qualificado: médico empreendedor com estrutura familiar de marketing, 
                amigo já operando com sucesso, e plano claro de expansão. Foco máximo!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
