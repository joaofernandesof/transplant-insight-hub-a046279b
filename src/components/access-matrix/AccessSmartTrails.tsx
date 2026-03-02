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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RbacRole } from "@/hooks/useAccessMatrix";

interface AccessSmartTrailsProps {
  roles: RbacRole[];
  onApplyTrail: (trailId: string, roleIds: string[]) => void;
}

interface Trail {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  recommendedRoleNames: string[];
  modules: string[];
}

const SMART_TRAILS: Trail[] = [
  {
    id: 'clinica_padrao',
    name: 'Clínica Padrão',
    description: 'Configuração padrão para operação de clínica com equipe médica e recepção.',
    icon: <Building2 className="h-5 w-5" />,
    color: 'from-blue-500 to-indigo-500',
    recommendedRoleNames: ['operador', 'coordenador'],
    modules: ['neocare_appointments', 'neocare_history', 'neoteam_schedule', 'neoteam_patients'],
  },
  {
    id: 'academy_licenciamento',
    name: 'Academy com Licenciamento',
    description: 'Configuração para unidades que operam cursos e são licenciadas.',
    icon: <GraduationCap className="h-5 w-5" />,
    color: 'from-emerald-500 to-green-500',
    recommendedRoleNames: ['gerente', 'operador'],
    modules: ['academy_courses', 'academy_materials', 'academy_certificates', 'neolicense_dashboard'],
  },
  {
    id: 'consultoria_avivar',
    name: 'Unidade Consultoria Avivar',
    description: 'Configuração para unidades focadas em marketing e captação de leads.',
    icon: <TrendingUp className="h-5 w-5" />,
    color: 'from-orange-500 to-red-500',
    recommendedRoleNames: ['gerente', 'operador'],
    modules: ['avivar_dashboard', 'avivar_hotleads', 'avivar_marketing'],
  },
];

export function AccessSmartTrails({ roles, onApplyTrail }: AccessSmartTrailsProps) {
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  // Exclude super_admin from selectable roles
  const selectableRoles = roles.filter(r => r.name !== 'super_administrador');

  const handleSelectTrail = (trail: Trail) => {
    setSelectedTrail(trail);
    // Auto-select recommended roles
    const recommended = roles.filter(r => trail.recommendedRoleNames.includes(r.name)).map(r => r.id);
    setSelectedRoleIds(recommended);
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const handleApply = async () => {
    if (!selectedTrail) return;
    setIsApplying(true);
    try {
      await onApplyTrail(selectedTrail.id, selectedRoleIds);
      setSelectedTrail(null);
      setSelectedRoleIds([]);
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
              <p className="font-medium text-violet-900 dark:text-violet-100 mb-1">Trilhas Inteligentes</p>
              <p className="text-sm text-violet-700 dark:text-violet-300">
                Selecione uma trilha pré-configurada para aplicar permissões rapidamente. Você pode personalizar antes de aplicar.
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
            className={cn("cursor-pointer transition-all hover:shadow-md", selectedTrail?.id === trail.id && "ring-2 ring-primary")}
            onClick={() => handleSelectTrail(trail)}
          >
            <div className={cn("h-2 bg-gradient-to-r rounded-t-lg", trail.color)} />
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white bg-gradient-to-r", trail.color)}>
                  {trail.icon}
                </div>
                <CardTitle className="text-base">{trail.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{trail.description}</p>
              <div className="flex flex-wrap gap-1">
                {trail.recommendedRoleNames.map(name => {
                  const role = roles.find(r => r.name === name);
                  return role ? <Badge key={name} variant="secondary" className="text-xs">{role.displayName}</Badge> : null;
                })}
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
                <CardDescription>Selecione as funções que receberão as permissões</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTrail(null)}>Cancelar</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <p className="text-sm font-medium mb-3">Aplicar para as funções:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {selectableRoles.map(role => (
                  <div
                    key={role.id}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer",
                      selectedRoleIds.includes(role.id) ? "border-primary bg-primary/5" : "hover:bg-muted"
                    )}
                    onClick={() => handleRoleToggle(role.id)}
                  >
                    <Checkbox checked={selectedRoleIds.includes(role.id)} onCheckedChange={() => handleRoleToggle(role.id)} />
                    <Label className="cursor-pointer text-sm">{role.displayName}</Label>
                    {selectedTrail.recommendedRoleNames.includes(role.name) && (
                      <Badge variant="outline" className="text-[10px] ml-auto">Rec.</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium mb-3">Módulos configurados:</p>
              <div className="flex flex-wrap gap-2">
                {selectedTrail.modules.map(mod => (
                  <Badge key={mod} variant="secondary" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {mod.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full" disabled={selectedRoleIds.length === 0 || isApplying}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Aplicar Trilha
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Aplicar Trilha Inteligente?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá atualizar as permissões de {selectedRoleIds.length} função(ões) em {selectedTrail.modules.length} módulo(s).
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
    </div>
  );
}
