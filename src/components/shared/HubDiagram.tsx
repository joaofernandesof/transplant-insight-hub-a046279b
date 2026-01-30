/**
 * HubDiagram - Diagrama visual do ecossistema NeoHub
 * Mostra todos os portais conectados ao HUB central
 */

import React from 'react';
import { Heart, Users, GraduationCap, Building2, Sparkles, Scale, CreditCard, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VisionIcon } from '@/components/icons/VisionIcon';

interface PortalNode {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}

const portals: PortalNode[] = [
  {
    id: 'neocare',
    name: 'NeoCare',
    subtitle: 'Pacientes',
    icon: <Heart className="h-6 w-6" />,
    color: 'bg-rose-500',
  },
  {
    id: 'neoteam',
    name: 'NeoTeam',
    subtitle: 'Colaboradores',
    icon: <Users className="h-6 w-6" />,
    color: 'bg-blue-500',
  },
  {
    id: 'ibramec',
    name: 'IBRAMEC',
    subtitle: 'Alunos',
    icon: <GraduationCap className="h-6 w-6" />,
    color: 'bg-emerald-500',
  },
  {
    id: 'neolicense',
    name: 'Licença',
    subtitle: 'Licenciados',
    icon: <Building2 className="h-6 w-6" />,
    color: 'bg-amber-500',
  },
  {
    id: 'avivar',
    name: 'Avivar',
    subtitle: 'Marketing',
    icon: <Sparkles className="h-6 w-6" />,
    color: 'bg-violet-500',
  },
  {
    id: 'ipromed',
    name: 'IPROMED',
    subtitle: 'Jurídico',
    icon: <Scale className="h-6 w-6" />,
    color: 'bg-cyan-600',
  },
  {
    id: 'vision',
    name: 'Vision',
    subtitle: 'Diagnóstico IA',
    icon: <VisionIcon className="h-6 w-6 text-white" />,
    color: 'bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500',
  },
  {
    id: 'neopay',
    name: 'NeoPay',
    subtitle: 'Pagamentos',
    icon: <CreditCard className="h-6 w-6" />,
    color: 'bg-gradient-to-br from-green-500 to-emerald-600',
  },
  {
    id: 'neocrm',
    name: 'NeoCRM',
    subtitle: 'Vendas',
    icon: <Target className="h-6 w-6" />,
    color: 'bg-gradient-to-br from-orange-500 to-red-500',
  },
];

interface HubDiagramProps {
  className?: string;
  highlightPortal?: string;
}

export function HubDiagram({ className, highlightPortal }: HubDiagramProps) {
  // Positions for each portal around the hub (in degrees)
  // 7 portals = evenly distributed around 360 degrees
  const getPosition = (index: number, total: number) => {
    const startAngle = -90; // Start from top
    const angle = startAngle + (360 / total) * index;
    const radian = (angle * Math.PI) / 180;
    const radius = 120; // Distance from center
    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
    };
  };

  return (
    <div className={cn('relative w-full max-w-[340px] h-[340px] mx-auto', className)}>
      {/* Connection lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full" viewBox="-170 -170 340 340">
        {portals.map((_, index) => {
          const pos = getPosition(index, portals.length);
          return (
            <line
              key={index}
              x1="0"
              y1="0"
              x2={pos.x}
              y2={pos.y}
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted-foreground/30"
            />
          );
        })}
      </svg>

      {/* Central HUB */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="w-16 h-16 rounded-full bg-muted border-4 border-muted-foreground/30 flex items-center justify-center shadow-lg">
          <span className="text-sm font-bold text-muted-foreground">HUB</span>
        </div>
      </div>

      {/* Portal nodes */}
      {portals.map((portal, index) => {
        const pos = getPosition(index, portals.length);
        const isHighlighted = highlightPortal === portal.id;
        
        return (
          <div
            key={portal.id}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md transition-all overflow-hidden',
                  portal.color,
                  isHighlighted && 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110'
                )}
              >
                {portal.icon}
              </div>
              <span className="text-xs font-semibold text-foreground whitespace-nowrap text-center">
                {portal.name}
              </span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap text-center">
                {portal.subtitle}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
