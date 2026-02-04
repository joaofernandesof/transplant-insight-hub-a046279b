/**
 * PortalBanner - Faixa de identificação visual de cada portal
 * Exibe logo, nome do portal e data atual com a cor predominante
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Configuração de portais
export type PortalType = 
  | 'admin'
  | 'neoteam'
  | 'neocare'
  | 'academy'
  | 'neolicense'
  | 'avivar'
  | 'ipromed'
  | 'vision'
  | 'postvenda';

interface PortalConfig {
  name: string;
  subtitle?: string;
  gradient: string;
  textClass?: string;
}

export const PORTAL_CONFIGS: Record<PortalType, PortalConfig> = {
  admin: {
    name: 'Administrador',
    subtitle: 'Painel de Controle',
    gradient: 'from-slate-700 via-slate-600 to-slate-700',
  },
  neoteam: {
    name: 'NeoTeam',
    subtitle: 'Portal do Colaborador',
    gradient: 'from-blue-600 via-blue-500 to-cyan-500',
  },
  neocare: {
    name: 'NeoCare',
    subtitle: 'Portal do Paciente',
    gradient: 'from-rose-600 via-rose-500 to-pink-500',
  },
  academy: {
    name: 'IBRAMEC',
    subtitle: 'Portal do Aluno',
    gradient: 'from-emerald-600 via-emerald-500 to-green-500',
  },
  neolicense: {
    name: 'Licenciado',
    subtitle: 'Portal do Licenciado',
    gradient: 'from-amber-500 via-amber-400 to-yellow-400',
    textClass: 'text-amber-950',
  },
  avivar: {
    name: 'Avivar',
    subtitle: 'Marketing & Crescimento',
    gradient: 'from-violet-600 via-purple-500 to-violet-500',
  },
  ipromed: {
    name: 'CPG Advocacia Médica',
    subtitle: 'Jurídico',
    gradient: 'from-cyan-700 via-cyan-600 to-teal-500',
  },
  vision: {
    name: 'Vision',
    subtitle: 'Diagnóstico IA',
    gradient: 'from-pink-500 via-rose-500 to-orange-500',
  },
  postvenda: {
    name: 'Pós-Venda',
    subtitle: 'Atendimento ao Cliente',
    gradient: 'from-indigo-600 via-indigo-500 to-blue-500',
  },
};

interface PortalBannerProps {
  portal: PortalType;
  userName?: string;
  icon?: ReactNode;
  rightContent?: ReactNode;
  className?: string;
}

export function PortalBanner({ 
  portal, 
  userName,
  icon,
  rightContent,
  className 
}: PortalBannerProps) {
  const config = PORTAL_CONFIGS[portal];
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  
  // Capitalizar primeira letra
  const capitalizedDate = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <div 
      className={cn(
        'relative overflow-hidden rounded-xl bg-gradient-to-r p-4 sm:p-5',
        config.gradient,
        className
      )}
    >
      {/* Efeito de brilho decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative flex items-center justify-between gap-4">
        {/* Lado esquerdo - Logo/Ícone + Texto */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Ícone/Logo do Portal */}
          {icon && (
            <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              {icon}
            </div>
          )}
          
          {/* Textos */}
          <div className={cn("min-w-0", config.textClass || "text-white")}>
            <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2 truncate">
              {userName ? (
                <>
                  Olá, {userName.split(' ')[0]}! 
                  <span className="hidden sm:inline">👋</span>
                </>
              ) : (
                <>
                  {config.name}
                  {config.subtitle && (
                    <span className="hidden sm:inline text-sm font-normal opacity-80">
                      • {config.subtitle}
                    </span>
                  )}
                </>
              )}
            </h1>
            <p className={cn(
              "text-xs sm:text-sm",
              config.textClass ? "opacity-70" : "text-white/70"
            )}>
              {capitalizedDate}
            </p>
          </div>
        </div>

        {/* Lado direito - Conteúdo customizado */}
        {rightContent && (
          <div className="flex items-center gap-2 shrink-0">
            {rightContent}
          </div>
        )}
      </div>
    </div>
  );
}
