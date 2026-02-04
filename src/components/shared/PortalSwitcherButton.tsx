/**
 * PortalSwitcherButton - Botão para alternar entre portais
 * Primeiro item da sidebar em TODOS os portais
 * Navega para a página de seleção de portais
 */

import { useNavigate } from "react-router-dom";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortalSwitcherButtonProps {
  /** Se o sidebar está colapsado */
  isCollapsed?: boolean;
  /** Classe adicional */
  className?: string;
  /** Variante do tema (light para sidebars escuros) */
  variant?: "default" | "light" | "avivar";
  /** Label customizado */
  label?: string;
}

export function PortalSwitcherButton({ 
  isCollapsed = false, 
  className,
  variant = "default",
  label = "Trocar Portal"
}: PortalSwitcherButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/portal-selector');
  };

  const baseStyles = cn(
    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full cursor-pointer",
    isCollapsed && "justify-center px-2"
  );

  const variantStyles = {
    default: "text-muted-foreground hover:bg-muted hover:text-foreground",
    light: "text-white/70 hover:bg-white/10 hover:text-white",
    avivar: "text-[hsl(var(--avivar-muted-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.08)] hover:text-[hsl(var(--avivar-foreground))]"
  };

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], className)}
      onClick={handleClick}
      title={isCollapsed ? label : undefined}
    >
      <Layers className={cn(
        "h-5 w-5 flex-shrink-0",
        variant === "light" && "text-current",
        variant === "avivar" && "text-[hsl(var(--avivar-primary))]"
      )} />
      {!isCollapsed && (
        <span className="text-sm font-medium">{label}</span>
      )}
    </button>
  );
}

export default PortalSwitcherButton;
