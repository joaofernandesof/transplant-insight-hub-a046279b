/**
 * CPG Advocacia Médica - Team Profiles Component
 * Perfis das sócias do CPG Advocacia Médica
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  Award,
  BookOpen,
  Shield,
  Scale,
  FileText,
  Gavel,
  Users,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  title: string;
  photo: string;
  specialties: string[];
  email?: string;
  color: string;
}

// Dados da equipe CPG Advocacia Médica
export const ipromedTeam: TeamMember[] = [
  {
    id: "larissa-guerreiro",
    name: "Larissa Guerreiro",
    role: "Sócia Fundadora",
    title: "Pós-graduação em Direito Médico",
    photo: "https://ipromed.com.br/assets/larissa-guerreiro-DDMW0ixB.jpeg",
    specialties: [
      "Fundadora do CPG Advocacia Médica",
      "Consultora jurídica de clínicas capilares",
      "Criadora de método próprio de segurança jurídica",
      "Compliance, LGPD e prontuário",
    ],
    email: "larissa@cpgadvocacia.com.br",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "isabele-cartaxo",
    name: "Isabele Cartaxo",
    role: "Especialista",
    title: "Direito Médico e Societário",
    photo: "https://ipromed.com.br/assets/isabele-cartaxo-BI-ToAkP.png",
    specialties: [
      "Atuação estratégica em contencioso",
      "Defesa ética, cível e criminal",
      "Casos de maior complexidade",
      "Representação institucional e OAB",
    ],
    email: "isabele@cpgadvocacia.com.br",
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: "caroline-parahyba",
    name: "Caroline Parahyba",
    role: "Especialista",
    title: "Mestre em Direito Constitucional, foco em saúde",
    photo: "https://ipromed.com.br/assets/caroline-parahyba-BormFpYj.png",
    specialties: [
      "Gestão de casos estratégicos",
      "Atuação em processos sensíveis",
      "Produção técnica e teses jurídicas",
      "Supervisão de qualidade das entregas",
    ],
    email: "caroline@cpgadvocacia.com.br",
    color: "bg-purple-100 text-purple-700",
  },
];

interface TeamProfileCardProps {
  member: TeamMember;
  compact?: boolean;
}

export function TeamProfileCard({ member, compact = false }: TeamProfileCardProps) {
  return (
    <Card className={`border-none shadow-md hover:shadow-lg transition-shadow ${compact ? '' : ''}`}>
      <CardContent className={compact ? 'p-4' : 'p-6'}>
        <div className="flex items-start gap-4">
          <Avatar className={compact ? 'h-12 w-12' : 'h-20 w-20'}>
            <AvatarImage src={member.photo} alt={member.name} className="object-cover" />
            <AvatarFallback className={member.color}>
              {member.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-lg'}`}>
              {member.name}
            </h3>
            <Badge className={`${member.color} mt-1`}>
              {member.role}
            </Badge>
            <p className={`text-muted-foreground mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>
              {member.title}
            </p>
            
            {!compact && (
              <ul className="mt-3 space-y-1">
                {member.specialties.map((specialty, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {specialty}
                  </li>
                ))}
              </ul>
            )}
            
            {!compact && member.email && (
              <div className="mt-3 pt-3 border-t">
                <Button variant="ghost" size="sm" className="gap-2 text-xs">
                  <Mail className="h-3 w-3" />
                  {member.email}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TeamListWidgetProps {
  showTitle?: boolean;
}

export function TeamListWidget({ showTitle = true }: TeamListWidgetProps) {
  return (
    <Card className="border shadow-sm">
      {showTitle && (
        <CardHeader className="py-3 px-4 bg-muted/50 border-b">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Equipe CPG Advocacia Médica
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-4 space-y-3">
        {ipromedTeam.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.photo} alt={member.name} className="object-cover" />
              <AvatarFallback className={member.color}>
                {member.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{member.name}</p>
              <p className="text-xs text-muted-foreground truncate">{member.role}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function TeamProfilesSection() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Equipe CPG Advocacia Médica</h2>
        <p className="text-muted-foreground mt-1">
          Advogadas especialistas dedicadas exclusivamente ao direito médico
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ipromedTeam.map((member) => (
          <TeamProfileCard key={member.id} member={member} />
        ))}
      </div>
      
      <Card className="border-none bg-gradient-to-r from-[#00629B]/10 to-[#00629B]/5">
        <CardContent className="p-6 text-center">
          <blockquote className="text-lg italic text-muted-foreground">
            "O CPG Advocacia Médica nasceu para traduzir risco em processo simples, aplicável e escalável para a sua prática médica."
          </blockquote>
          <p className="mt-2 text-sm font-medium">— Larissa Guerreiro, Fundadora</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default TeamProfilesSection;
