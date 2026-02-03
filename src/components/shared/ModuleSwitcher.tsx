/**
 * ModuleSwitcher - Botão para alternar entre módulos/portais
 * Navega para a página de seleção de módulos filtrada por perfil
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

interface ModuleSwitcherProps {
  /** Variante de exibição */
  variant?: "icon" | "full" | "compact";
  /** Classe adicional */
  className?: string;
  /** Variante do tema (light para headers escuros) */
  theme?: "default" | "light";
  /** Se está colapsado (para sidebar) */
  isCollapsed?: boolean;
}

export function ModuleSwitcher({ 
  variant = "full",
  className,
  theme = "default",
  isCollapsed = false
}: ModuleSwitcherProps) {
  const navigate = useNavigate();
  const { isAdmin } = useUnifiedAuth();

  const handleClick = () => {
    // Admin vai para o portal-selector também para escolher ver como outro perfil
    navigate('/portal-selector');
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-9 w-9",
          theme === "light" 
            ? "text-white/80 hover:text-white hover:bg-white/10" 
            : "text-muted-foreground hover:text-foreground",
          className
        )}
        onClick={handleClick}
        title="Alternar Módulo"
      >
        <Layers className="h-5 w-5" />
      </Button>
    );
  }

  if (variant === "compact") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "gap-2",
          theme === "light" 
            ? "text-white/80 hover:text-white hover:bg-white/10" 
            : "text-muted-foreground hover:text-foreground",
          className
        )}
        onClick={handleClick}
      >
        <Layers className="h-4 w-4" />
        <span className="hidden sm:inline">Módulos</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-3 h-9 text-muted-foreground hover:text-foreground",
        isCollapsed && "justify-center px-2",
        theme === "light" && "text-white/80 hover:text-white hover:bg-white/10",
        className
      )}
      onClick={handleClick}
    >
      <Layers className="h-4 w-4 flex-shrink-0" />
      {!isCollapsed && <span className="truncate text-sm">Alternar Módulo</span>}
    </Button>
  );
}

export default ModuleSwitcher;
