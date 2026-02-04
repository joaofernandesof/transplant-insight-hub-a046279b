/**
 * PortalSwitcherButton - Menu expansível para alternar entre portais
 * Primeiro item da sidebar em TODOS os portais
 * Mostra lista de todos os portais disponíveis
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Layers, 
  ChevronDown, 
  ChevronRight,
  GraduationCap,
  Award,
  Heart,
  Users,
  Stethoscope,
  Zap,
  Scale,
  Eye,
  CreditCard,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Lista de portais disponíveis
const portals = [
  { id: 'academy', label: 'Aluno', icon: GraduationCap, href: '/academy', gradient: 'from-emerald-500 to-green-600' },
  { id: 'license', label: 'Licenciado', icon: Award, href: '/neolicense', gradient: 'from-amber-400 to-yellow-500' },
  { id: 'patient', label: 'Paciente', icon: Heart, href: '/neocare', gradient: 'from-rose-500 to-pink-600' },
  { id: 'staff', label: 'Colaborador', icon: Users, href: '/neoteam', gradient: 'from-blue-500 to-cyan-600' },
  { id: 'doctor', label: 'Médico', icon: Stethoscope, href: '/neoteam/doctor-view', gradient: 'from-teal-500 to-cyan-600' },
  { id: 'avivar', label: 'Avivar', icon: Zap, href: '/avivar', gradient: 'from-purple-500 to-violet-600' },
  { id: 'ipromed', label: 'IPROMED', icon: Scale, href: '/ipromed', gradient: 'from-blue-600 to-indigo-700' },
  { id: 'vision', label: 'Vision', icon: Eye, href: '/vision', gradient: 'from-pink-500 to-rose-500' },
  { id: 'neopay', label: 'NeoPay', icon: CreditCard, href: '/neopay', gradient: 'from-green-500 to-emerald-600' },
  { id: 'neocrm', label: 'NeoCRM', icon: Flame, href: '/neocrm', gradient: 'from-orange-500 to-red-500' },
];

interface PortalSwitcherButtonProps {
  /** Se o sidebar está colapsado */
  isCollapsed?: boolean;
  /** Classe adicional */
  className?: string;
  /** Variante do tema (light para sidebars escuros) */
  variant?: "default" | "light" | "avivar";
  /** Label customizado */
  label?: string;
  /** Callback quando navegar (útil para fechar mobile menu) */
  onNavigate?: () => void;
}

export function PortalSwitcherButton({ 
  isCollapsed = false, 
  className,
  variant = "default",
  label = "Acessar Portal",
  onNavigate
}: PortalSwitcherButtonProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (href: string) => {
    navigate(href);
    onNavigate?.();
    setIsOpen(false);
  };

  // Estilos base para o trigger
  const triggerStyles = cn(
    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
    isCollapsed && "justify-center px-2"
  );

  // Estilos por variante
  const variantStyles = {
    default: cn(
      "text-muted-foreground hover:bg-muted hover:text-foreground",
      isOpen && "bg-muted/50 text-foreground"
    ),
    light: cn(
      "text-white/70 hover:bg-white/10 hover:text-white",
      isOpen && "bg-white/5 text-white"
    ),
    avivar: cn(
      "text-[hsl(var(--avivar-muted-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.08)] hover:text-[hsl(var(--avivar-foreground))]",
      isOpen && "bg-[hsl(var(--avivar-primary)/0.05)] text-[hsl(var(--avivar-foreground))]"
    )
  };

  // Se estiver colapsado, mostrar apenas ícone que navega para seletor
  if (isCollapsed) {
    return (
      <button
        className={cn(triggerStyles, variantStyles[variant], className)}
        onClick={() => navigate('/portal-selector')}
        title={label}
      >
        <Layers className={cn(
          "h-5 w-5 flex-shrink-0",
          variant === "light" && "text-current",
          variant === "avivar" && "text-[hsl(var(--avivar-primary))]"
        )} />
      </button>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <button className={cn(triggerStyles, variantStyles[variant])}>
          <Layers className={cn(
            "h-5 w-5 flex-shrink-0",
            variant === "light" && "text-current",
            variant === "avivar" && "text-[hsl(var(--avivar-primary))]"
          )} />
          <span className="flex-1 text-sm font-medium text-left">{label}</span>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform duration-200",
            variant === "light" ? "text-white/50" : "text-muted-foreground",
            isOpen && "rotate-180"
          )} />
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-1 space-y-1 pl-2">
        {portals.map((portal) => {
          const Icon = portal.icon;
          return (
            <button
              key={portal.id}
              onClick={() => handleNavigate(portal.href)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                variant === "light" 
                  ? "text-white/60 hover:bg-white/10 hover:text-white"
                  : variant === "avivar"
                  ? "text-[hsl(var(--avivar-muted-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.08)] hover:text-[hsl(var(--avivar-foreground))]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-md bg-gradient-to-br flex-shrink-0",
                portal.gradient
              )}>
                <Icon className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm">{portal.label}</span>
              <ChevronRight className={cn(
                "h-3.5 w-3.5 ml-auto",
                variant === "light" 
                  ? "text-white/30 group-hover:text-white/50"
                  : "text-muted-foreground/50 group-hover:text-muted-foreground"
              )} />
            </button>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default PortalSwitcherButton;
