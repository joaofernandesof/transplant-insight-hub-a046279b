/**
 * AdminBackButton - Botão para voltar ao Portal do Administrador
 * Só aparece quando o usuário é administrador
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { cn } from "@/lib/utils";

interface AdminBackButtonProps {
  /** Se o sidebar está colapsado */
  isCollapsed?: boolean;
  /** Classe adicional */
  className?: string;
  /** Variante do tema (light para sidebars escuros) */
  variant?: "default" | "light";
}

export function AdminBackButton({ 
  isCollapsed = false, 
  className,
  variant = "default" 
}: AdminBackButtonProps) {
  const { isAdmin } = useUnifiedAuth();
  const navigate = useNavigate();

  // Só exibe se for admin
  if (!isAdmin) return null;

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-3 h-10",
        isCollapsed && "justify-center px-2",
        variant === "light" 
          ? "text-white/80 hover:text-white hover:bg-white/10" 
          : "text-primary hover:text-primary hover:bg-primary/10",
        className
      )}
      onClick={() => navigate("/admin-portal")}
    >
      <Shield className="h-4 w-4 flex-shrink-0" />
      {!isCollapsed && <span className="truncate">Voltar ao Admin</span>}
    </Button>
  );
}

export default AdminBackButton;
