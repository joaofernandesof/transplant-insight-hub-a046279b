/**
 * BPMN 2.0.2 Standard Shapes
 * Implementação das figuras técnicas padrão da notação BPMN 2.0.2
 */

import React from 'react';
import { cn } from '@/lib/utils';

// ==================== EVENTOS (Círculos) ====================

interface EventProps {
  type: 'start' | 'intermediate' | 'end';
  variant?: 'simple' | 'message' | 'timer' | 'error' | 'terminate';
  label?: string;
  status?: 'complete' | 'current' | 'future' | 'inactive';
  className?: string;
}

export function BpmnEvent({ type, variant = 'simple', label, status = 'future', className }: EventProps) {
  const getStrokeWidth = () => {
    switch (type) {
      case 'start': return 2;
      case 'intermediate': return 2;
      case 'end': return 3;
    }
  };

  const getStatusStyles = () => {
    switch (status) {
      case 'complete':
        return { stroke: 'hsl(var(--primary))', fill: 'hsl(var(--primary) / 0.15)' };
      case 'current':
        return { stroke: 'hsl(45, 93%, 47%)', fill: 'hsl(45, 93%, 47% / 0.2)' };
      case 'future':
        return { stroke: 'hsl(var(--muted-foreground))', fill: 'transparent' };
      case 'inactive':
        return { stroke: 'hsl(var(--muted-foreground) / 0.4)', fill: 'transparent' };
    }
  };

  const styles = getStatusStyles();

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <svg width="40" height="40" viewBox="0 0 40 40">
        {/* Círculo externo */}
        <circle
          cx="20"
          cy="20"
          r="16"
          fill={styles.fill}
          stroke={styles.stroke}
          strokeWidth={getStrokeWidth()}
        />
        {/* Círculo duplo para evento intermediário */}
        {type === 'intermediate' && (
          <circle
            cx="20"
            cy="20"
            r="13"
            fill="none"
            stroke={styles.stroke}
            strokeWidth={1.5}
          />
        )}
        {/* Ícones internos por variante */}
        {variant === 'message' && (
          <path
            d="M12 15h16v10H12z M12 15l8 6 8-6"
            fill="none"
            stroke={styles.stroke}
            strokeWidth={1.5}
          />
        )}
        {variant === 'timer' && (
          <>
            <circle cx="20" cy="20" r="8" fill="none" stroke={styles.stroke} strokeWidth={1.5} />
            <path d="M20 15v5l3 3" fill="none" stroke={styles.stroke} strokeWidth={1.5} />
          </>
        )}
        {variant === 'terminate' && type === 'end' && (
          <circle cx="20" cy="20" r="8" fill={styles.stroke} />
        )}
        {variant === 'error' && (
          <path d="M14 26l6-12 6 12z" fill="none" stroke={styles.stroke} strokeWidth={1.5} />
        )}
      </svg>
      {label && (
        <span className={cn(
          "text-[10px] text-center max-w-[60px] leading-tight",
          status === 'current' ? 'font-semibold text-amber-600' : 'text-muted-foreground'
        )}>
          {label}
        </span>
      )}
    </div>
  );
}

// ==================== TAREFAS (Retângulos arredondados) ====================

interface TaskProps {
  type: 'user' | 'service' | 'manual' | 'script' | 'send' | 'receive';
  label: string;
  status?: 'complete' | 'current' | 'future' | 'inactive';
  sla?: string;
  className?: string;
  onClick?: () => void;
}

export function BpmnTask({ type, label, status = 'future', sla, className, onClick }: TaskProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'complete':
        return {
          bg: 'bg-primary/10',
          border: 'border-primary',
          text: 'text-primary',
          icon: 'text-primary'
        };
      case 'current':
        return {
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          border: 'border-amber-500 ring-2 ring-amber-300/50',
          text: 'text-amber-700 dark:text-amber-400 font-semibold',
          icon: 'text-amber-600'
        };
      case 'future':
        return {
          bg: 'bg-card',
          border: 'border-border',
          text: 'text-foreground',
          icon: 'text-muted-foreground'
        };
      case 'inactive':
        return {
          bg: 'bg-muted/30',
          border: 'border-muted/50',
          text: 'text-muted-foreground/50',
          icon: 'text-muted-foreground/30'
        };
    }
  };

  const getTaskIcon = () => {
    switch (type) {
      case 'user':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="7" r="4" />
            <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
          </svg>
        );
      case 'service':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
        );
      case 'manual':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
          </svg>
        );
      case 'send':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3l18 9-18 9V3z" />
          </svg>
        );
      case 'receive':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        );
    }
  };

  const styles = getStatusStyles();

  return (
    <div
      className={cn(
        "relative flex flex-col items-center min-w-[100px] max-w-[120px] px-3 py-2",
        "rounded-lg border-2 transition-all cursor-pointer",
        styles.bg,
        styles.border,
        status === 'inactive' && 'opacity-50',
        className
      )}
      onClick={onClick}
    >
      <div className={cn("flex items-center gap-1.5 mb-1", styles.icon)}>
        {getTaskIcon()}
      </div>
      <span className={cn("text-[11px] text-center leading-tight", styles.text)}>
        {label}
      </span>
      {sla && status !== 'inactive' && (
        <span className="absolute -bottom-5 text-[9px] text-amber-600 flex items-center gap-0.5">
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          {sla}
        </span>
      )}
      {status === 'current' && (
        <span className="absolute -top-2 -right-2 text-[8px] px-1.5 py-0.5 bg-amber-500 text-white rounded-full font-medium">
          Atual
        </span>
      )}
    </div>
  );
}

// ==================== GATEWAYS (Losangos) ====================

interface GatewayProps {
  type: 'exclusive' | 'parallel' | 'inclusive' | 'event';
  label?: string;
  status?: 'complete' | 'current' | 'future' | 'inactive';
  className?: string;
}

export function BpmnGateway({ type, label, status = 'future', className }: GatewayProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'complete':
        return { stroke: 'hsl(var(--primary))', fill: 'hsl(var(--primary) / 0.15)' };
      case 'current':
        return { stroke: 'hsl(45, 93%, 47%)', fill: 'hsl(45, 93%, 47% / 0.2)' };
      case 'future':
        return { stroke: 'hsl(var(--muted-foreground))', fill: 'hsl(var(--card))' };
      case 'inactive':
        return { stroke: 'hsl(var(--muted-foreground) / 0.4)', fill: 'transparent' };
    }
  };

  const getGatewaySymbol = () => {
    const styles = getStatusStyles();
    switch (type) {
      case 'exclusive':
        return (
          <path d="M15 10l10 10M25 10l-10 10" stroke={styles.stroke} strokeWidth="3" fill="none" />
        );
      case 'parallel':
        return (
          <>
            <path d="M20 10v20" stroke={styles.stroke} strokeWidth="3" />
            <path d="M10 20h20" stroke={styles.stroke} strokeWidth="3" />
          </>
        );
      case 'inclusive':
        return (
          <circle cx="20" cy="20" r="8" stroke={styles.stroke} strokeWidth="3" fill="none" />
        );
      case 'event':
        return (
          <>
            <circle cx="20" cy="20" r="8" stroke={styles.stroke} strokeWidth="2" fill="none" />
            <circle cx="20" cy="20" r="5" stroke={styles.stroke} strokeWidth="2" fill="none" />
          </>
        );
    }
  };

  const styles = getStatusStyles();

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <svg width="44" height="44" viewBox="0 0 44 44">
        {/* Losango (rotacionado 45°) */}
        <rect
          x="8"
          y="8"
          width="24"
          height="24"
          rx="2"
          transform="rotate(45 20 20)"
          fill={styles.fill}
          stroke={styles.stroke}
          strokeWidth="2"
        />
        {/* Símbolo interno */}
        {getGatewaySymbol()}
      </svg>
      {label && (
        <span className={cn(
          "text-[10px] text-center max-w-[80px] leading-tight",
          status === 'current' ? 'font-semibold text-amber-600' : 'text-muted-foreground'
        )}>
          {label}
        </span>
      )}
    </div>
  );
}

// ==================== CONECTORES (Setas) ====================

interface FlowProps {
  direction: 'right' | 'down' | 'up' | 'left' | 'down-right' | 'down-left' | 'up-right';
  label?: string;
  type?: 'sequence' | 'message' | 'association';
  length?: number;
  className?: string;
}

export function BpmnFlow({ direction, label, type = 'sequence', length = 40, className }: FlowProps) {
  const isHorizontal = direction === 'right' || direction === 'left';
  const isVertical = direction === 'down' || direction === 'up';
  
  const width = isHorizontal ? length : 20;
  const height = isVertical ? length : 20;

  const getPath = () => {
    switch (direction) {
      case 'right':
        return `M0 10 L${length - 8} 10 L${length - 8} 5 L${length} 10 L${length - 8} 15 L${length - 8} 10`;
      case 'left':
        return `M${length} 10 L8 10 L8 5 L0 10 L8 15 L8 10`;
      case 'down':
        return `M10 0 L10 ${length - 8} L5 ${length - 8} L10 ${length} L15 ${length - 8} L10 ${length - 8}`;
      case 'up':
        return `M10 ${length} L10 8 L5 8 L10 0 L15 8 L10 8`;
      default:
        return `M0 10 L${length - 8} 10`;
    }
  };

  const getStrokeDasharray = () => {
    switch (type) {
      case 'message': return '5,3';
      case 'association': return '2,2';
      default: return 'none';
    }
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path
          d={getPath()}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1.5"
          strokeDasharray={getStrokeDasharray()}
        />
      </svg>
      {label && (
        <span className="absolute text-[9px] text-muted-foreground bg-background px-1">
          {label}
        </span>
      )}
    </div>
  );
}

// ==================== POOL / LANE (Raias) ====================

interface LaneProps {
  label: string;
  color?: string;
  children: React.ReactNode;
  className?: string;
}

export function BpmnLane({ label, color = 'bg-primary', children, className }: LaneProps) {
  return (
    <div className={cn("flex border-b border-border/50 last:border-b-0", className)}>
      {/* Rótulo vertical da raia */}
      <div className={cn(
        "w-10 shrink-0 flex items-center justify-center",
        color
      )}>
        <span className="text-white text-xs font-medium whitespace-nowrap transform -rotate-90 origin-center">
          {label}
        </span>
      </div>
      {/* Conteúdo da raia */}
      <div className="flex-1 p-4 min-h-[100px] bg-muted/20">
        {children}
      </div>
    </div>
  );
}

interface PoolProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function BpmnPool({ label, children, className }: PoolProps) {
  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Rótulo vertical do pool */}
      <div className="flex">
        <div className="w-8 shrink-0 bg-slate-800 flex items-center justify-center">
          <span className="text-white text-sm font-semibold whitespace-nowrap transform -rotate-90 origin-center">
            {label}
          </span>
        </div>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
