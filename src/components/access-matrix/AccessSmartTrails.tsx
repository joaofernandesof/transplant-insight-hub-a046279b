import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Sparkles, 
  Building2, 
  GraduationCap, 
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Shield,
  Users
} from "lucide-react";
import { NeoHubProfile, PROFILE_NAMES } from "@/neohub/lib/permissions";
import { cn } from "@/lib/utils";

interface AccessSmartTrailsProps {
  onApplyTrail: (trailId: string, profiles: NeoHubProfile[]) => void;
}

interface Trail {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  recommendedProfiles: NeoHubProfile[];
  modules: string[];
}

const SMART_TRAILS: Trail[] = [
  {
    id: 'clinica_padrao',
    name: 'Clínica Padrão',
    description: 'Configuração padrão para operação de clínica com equipe médica e recepção.',
    icon: <Building2 className="h-5 w-5" />,
    color: 'from-blue-500 to-indigo-500',
    recommendedProfiles: ['colaborador', 'paciente'],
    modules: ['neocare_appointments', 'neocare_history', 'neoteam_schedule', 'neoteam_patients'],
  },
  {
    id: 'academy_licenciamento',
    name: 'Academy com Licenciamento',
    description: 'Configuração para unidades que operam cursos e são licenciadas da franquia.',
    icon: <GraduationCap className="h-5 w-5" />,
    color: 'from-emerald-500 to-green-500',
    recommendedProfiles: ['aluno', 'licenciado'],
    modules: ['academy_courses', 'academy_materials', 'academy_certificates', 'neolicense_dashboard'],
  },
  {
    id: 'consultoria_avivar',
    name: 'Unidade Consultoria Avivar',
    description: 'Configuração para unidades focadas em marketing e captação de leads.',
    icon: <TrendingUp className="h-5 w-5" />,
    color: 'from-orange-500 to-red-500',
    recommendedProfiles: ['cliente_avivar'],
    modules: ['avivar_dashboard', 'avivar_hotleads', 'avivar_marketing'],
  },
];

const ALL_PROFILES: NeoHubProfile[] = ['licenciado', 'colaborador', 'aluno', 'paciente', 'cliente_avivar'];

export function AccessSmartTrails({ onApplyTrail }: AccessSmartTrailsProps) {
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [selectedProfiles, setSelectedProfiles] = useState<NeoHubProfile[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  const handleSelectTrail = (trail: Trail) => {
    setSelectedTrail(trail);
    setSelectedProfiles(trail.recommendedProfiles);
  };

  const handleProfileToggle = (profile: NeoHubProfile) => {
    setSelectedProfiles(prev => 
      prev.includes(profile)
        ? prev.filter(p => p !== profile)
        : [...prev, profile]
    );
  };

  const handleApply = async () => {
    if (!selectedTrail) return;
    
    setIsApplying(true);
    try {
      await onApplyTrail(selectedTrail.id, selectedProfiles);
      setSelectedTrail(null);
      setSelectedProfiles([]);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0">
              <Lightbulb className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="font-medium text-violet-900 dark:text-violet-100 mb-1">
                Trilhas Inteligentes
              </p>
              <p className="text-sm text-violet-700 dark:text-violet-300">
                Selecione uma trilha pré-configurada para aplicar permissões de forma rápida e segura. 
                Você pode revisar e personalizar antes de aplicar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SMART_TRAILS.map(trail => (
          <Card 
            key={trail.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedTrail?.id === trail.id && "ring-2 ring-primary"
            )}
            onClick={() => handleSelectTrail(trail)}
          >
            {/* Gradient Header */}
            <div className={cn("h-2 bg-gradient-to-r rounded-t-lg", trail.color)} />
            
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-white bg-gradient-to-r",
                  trail.color
                )}>
                  {trail.icon}
                </div>
                <div>
                  <CardTitle className="text-base">{trail.name}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {trail.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {trail.recommendedProfiles.map(profile => (
                  <Badge key={profile} variant="secondary" className="text-xs">
                    {PROFILE_NAMES[profile]}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Panel */}
      {selectedTrail && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Configurar Trilha: {selectedTrail.name}
                </CardTitle>
                <CardDescription>
                  Selecione os perfis que receberão as permissões desta trilha
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTrail(null)}>
                Cancelar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Profile Selection */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-3">Aplicar para os perfis:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ALL_PROFILES.map(profile => (
                  <div
                    key={profile}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer",
                      selectedProfiles.includes(profile)
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted"
                    )}
                    onClick={() => handleProfileToggle(profile)}
                  >
                    <Checkbox
                      checked={selectedProfiles.includes(profile)}
                      onCheckedChange={() => handleProfileToggle(profile)}
                    />
                    <Label className="cursor-pointer text-sm">
                      {PROFILE_NAMES[profile]}
                    </Label>
                    {selectedTrail.recommendedProfiles.includes(profile) && (
                      <Badge variant="outline" className="text-[10px] ml-auto">
                        Recomendado
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modules Preview */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-3">Módulos que serão configurados:</p>
              <div className="flex flex-wrap gap-2">
                {selectedTrail.modules.map(mod => (
                  <Badge key={mod} variant="secondary" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {mod.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Apply Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className="w-full" 
                  disabled={selectedProfiles.length === 0 || isApplying}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Aplicar Trilha
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Aplicar Trilha Inteligente?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá atualizar as permissões de {selectedProfiles.length} perfil(is) 
                    em {selectedTrail.modules.length} módulo(s). Esta ação pode ser revertida manualmente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Revisar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleApply} disabled={isApplying}>
                    {isApplying ? 'Aplicando...' : 'Confirmar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* AI Suggestion Card */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Shield className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Sugestões Baseadas em Aprendizado
            </p>
            <p className="text-xs text-muted-foreground max-w-md">
              Outras clínicas similares geralmente não ativam determinados módulos para colaboradores. 
              <br />
              <span className="text-primary">Em breve, sugestões personalizadas.</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}