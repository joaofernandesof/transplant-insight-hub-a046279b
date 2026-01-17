import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  Clock,
  Video,
  MessageCircle,
  Star,
  CheckCircle2,
  ExternalLink,
  Stethoscope,
  Scale,
  TrendingUp,
  Megaphone
} from "lucide-react";
import { ModuleLayout } from "@/components/ModuleLayout";
import mentorsTeamImage from "@/assets/mentors-team.jpg";

const mentors = [
  { 
    id: 1, 
    name: 'Dr. Hygor Guerreiro', 
    role: 'Diretor Médico', 
    specialty: 'Técnicas Cirúrgicas',
    description: 'Médico renomado em medicina capilar, especializado em tratamentos clínicos e cirúrgicos. Membro da Sociedade Brasileira do Cabelo e da Indian Society of Hair Restoration.',
    icon: Stethoscope,
    available: true 
  },
  { 
    id: 2, 
    name: 'Larissa Guerreiro', 
    role: 'Diretora Jurídica', 
    specialty: 'Direito Médico & Compliance',
    description: 'Advogada especialista em Direito Médico e professora do IBRAMEC. Mentora e consultora em compliance para clínicas de transplante capilar.',
    icon: Scale,
    available: true 
  },
  { 
    id: 3, 
    name: 'João Fernandes', 
    role: 'CEO Neo Folic', 
    specialty: 'Gestão & Estratégia',
    description: 'Engenheiro civil e CEO da Neo Folic Saúde Capilar. Especialista em gestão de clínicas médicas e mentor de médicos que desejam atuar com transplante capilar.',
    icon: TrendingUp,
    available: true 
  },
  { 
    id: 4, 
    name: 'Edith Gomes', 
    role: 'Diretora de Marketing', 
    specialty: 'Marketing & Influência',
    description: 'Referência no marketing de influência com 17 anos de experiência. Criadora de método exclusivo que capacita empresários a se tornarem influenciadores.',
    icon: Megaphone,
    available: true 
  },
];

const upcomingMentorships = [
  { id: 1, title: 'Mentoria em Grupo', date: '25 Jan 2026', time: '19:00', type: 'Online', spots: 8 },
  { id: 2, title: 'Plantão de Dúvidas', date: '28 Jan 2026', time: '20:00', type: 'Online', spots: 15 },
  { id: 3, title: 'Mastermind Licenciados', date: '01 Fev 2026', time: '10:00', type: 'Online', spots: 12 },
];

const mentorshipHours = { total: 10, used: 4, available: 6 };

const supportChannels = [
  { id: 1, name: 'Grupo WhatsApp Suporte', description: 'Suporte diário com a equipe Neo Folic', members: 45, icon: MessageCircle },
  { id: 2, name: 'Comunidade Licenciados', description: 'Troca de experiências entre licenciados', members: 32, icon: Users },
];

export default function Mentorship() {
  return (
    <ModuleLayout>
      <div className="p-4 pt-16 lg:pt-4 lg:p-6 overflow-x-hidden w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            Mentoria & Suporte
          </h1>
          <p className="text-sm text-muted-foreground">Consultorias, comunidade e grupo exclusivo</p>
        </div>

        {/* Team Hero Image */}
        <Card className="mb-6 overflow-hidden">
          <div className="relative">
            <img 
              src={mentorsTeamImage} 
              alt="Equipe de Mentores IBRAMEC" 
              className="w-full h-auto object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <h2 className="text-white text-xl md:text-2xl font-bold">Equipe de Mentores IBRAMEC</h2>
              <p className="text-white/80 text-sm">Os melhores profissionais para guiar sua jornada</p>
            </div>
          </div>
        </Card>

        {/* Hours Available */}
        <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-indigo-900">Suas Horas de Mentoria</h2>
                <p className="text-indigo-700">Horas inclusas no seu plano de licenciamento</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-600">{mentorshipHours.available}h</p>
                  <p className="text-xs text-indigo-500">Disponíveis</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-muted-foreground">{mentorshipHours.used}h</p>
                  <p className="text-xs text-muted-foreground">Utilizadas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mentors Grid */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Nossos Mentores
            </CardTitle>
            <CardDescription>Agende uma consultoria exclusiva com nossos especialistas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mentors.map((mentor) => (
                <div key={mentor.id} className="p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <mentor.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{mentor.name}</h4>
                        {mentor.available && (
                          <Badge className="bg-green-100 text-green-700 text-xs">Disponível</Badge>
                        )}
                      </div>
                      <p className="text-sm text-primary font-medium">{mentor.role}</p>
                      <p className="text-xs text-muted-foreground mt-1">{mentor.specialty}</p>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{mentor.description}</p>
                    </div>
                  </div>
                  <Button size="sm" className="w-full mt-4 gap-2">
                    <Calendar className="h-4 w-4" />
                    Agendar Mentoria
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="h-4 w-4 text-indigo-600" />
              Próximas Mentorias em Grupo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingMentorships.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Video className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />{event.date}
                      <Clock className="h-3 w-3 ml-1" />{event.time}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs mb-1">{event.spots} vagas</Badge>
                  <br />
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">Participar</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Support Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-green-600" />
              Canais de Suporte
            </CardTitle>
            <CardDescription>Grupos exclusivos para licenciados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportChannels.map((channel) => (
                <div key={channel.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <channel.icon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{channel.name}</h4>
                    <p className="text-xs text-muted-foreground">{channel.description}</p>
                    <p className="text-xs text-primary mt-1">{channel.members} membros</p>
                  </div>
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Benefícios da Mentoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Consultoria Personalizada</p>
                  <p className="text-xs text-muted-foreground">Sessões 1:1 com mentores experientes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Suporte Diário</p>
                  <p className="text-xs text-muted-foreground">Grupo exclusivo com resposta rápida</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Networking</p>
                  <p className="text-xs text-muted-foreground">Comunidade de licenciados para troca</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
