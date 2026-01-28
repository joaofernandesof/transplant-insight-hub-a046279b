/**
 * Styled Kanban - Componente reutilizável para Kanbans padronizados
 * Baseado no design da Jornada do Cliente IPROMED
 */

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Paleta de cores padrão para colunas (gradientes)
export const KANBAN_COLUMN_COLORS = [
  "from-blue-500 to-blue-600",
  "from-indigo-500 to-indigo-600", 
  "from-purple-500 to-purple-600",
  "from-teal-500 to-teal-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-emerald-500 to-emerald-600",
  "from-cyan-500 to-cyan-600",
  "from-pink-500 to-pink-600",
  "from-orange-500 to-orange-600",
];

// Cores para badges de status (bolinhas)
export const KANBAN_STATUS_COLORS = [
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500", 
  "bg-teal-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-emerald-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-orange-500",
];

export interface KanbanColumn<T> {
  id: string;
  title: string;
  subtitle?: string;
  items: T[];
  color?: string; // Override color
  statusColor?: string; // Override status dot color
}

interface StyledKanbanProps<T> {
  columns: KanbanColumn<T>[];
  renderCard: (item: T, columnId: string) => ReactNode;
  renderEmptyState?: (columnId: string) => ReactNode;
  onDragStart?: (item: T, columnId: string) => void;
  onDragEnd?: () => void;
  onDrop?: (item: T, targetColumnId: string) => void;
  className?: string;
  columnClassName?: string;
  showSummary?: boolean;
  summaryLabel?: string;
}

interface KanbanSummaryProps {
  columns: { id: string; title: string; subtitle?: string; count: number; statusColor: string }[];
}

export function KanbanSummary({ columns }: KanbanSummaryProps) {
  return (
    <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-xl mb-4">
      {columns.map((col, idx) => (
        <div 
          key={col.id}
          className="flex-1 min-w-[100px] bg-background rounded-lg p-3 text-center shadow-sm"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className={cn("w-2 h-2 rounded-full", col.statusColor)} />
            <span className="text-xs font-medium text-muted-foreground">{col.title}</span>
          </div>
          {col.subtitle && (
            <p className="text-[10px] text-muted-foreground mb-1">{col.subtitle}</p>
          )}
          <span className="text-2xl font-bold">{col.count}</span>
        </div>
      ))}
    </div>
  );
}

interface KanbanColumnHeaderProps {
  title: string;
  subtitle?: string;
  color: string;
}

export function KanbanColumnHeader({ title, subtitle, color }: KanbanColumnHeaderProps) {
  return (
    <div className={cn(
      "px-4 py-3 rounded-t-xl bg-gradient-to-r text-white text-center",
      color
    )}>
      <h3 className="font-semibold text-sm">{title}</h3>
      {subtitle && (
        <p className="text-xs opacity-90">{subtitle}</p>
      )}
    </div>
  );
}

export function StyledKanban<T extends { id: string }>({
  columns,
  renderCard,
  renderEmptyState,
  className,
  columnClassName,
  showSummary = true,
}: StyledKanbanProps<T>) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary Row */}
      {showSummary && (
        <KanbanSummary
          columns={columns.map((col, idx) => ({
            id: col.id,
            title: col.title,
            subtitle: col.subtitle,
            count: col.items.length,
            statusColor: col.statusColor || KANBAN_STATUS_COLORS[idx % KANBAN_STATUS_COLORS.length],
          }))}
        />
      )}

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column, idx) => {
          const columnColor = column.color || KANBAN_COLUMN_COLORS[idx % KANBAN_COLUMN_COLORS.length];
          
          return (
            <div 
              key={column.id}
              className={cn(
                "flex-shrink-0 w-[220px] lg:w-[240px]",
                columnClassName
              )}
            >
              <Card className="border-none shadow-sm overflow-hidden">
                <KanbanColumnHeader
                  title={column.title}
                  subtitle={column.subtitle}
                  color={columnColor}
                />
                <CardContent className="p-3 bg-muted/20 min-h-[300px]">
                  {column.items.length === 0 ? (
                    renderEmptyState ? (
                      renderEmptyState(column.id)
                    ) : (
                      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                        Nenhum item
                      </div>
                    )
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2 pr-2">
                        {column.items.map((item) => renderCard(item, column.id))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Componente de Card padrão para Kanban
interface StyledKanbanCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function StyledKanbanCard({
  children,
  onClick,
  className,
  draggable,
  onDragStart,
  onDragEnd,
}: StyledKanbanCardProps) {
  return (
    <div
      className={cn(
        "bg-background rounded-lg p-3 shadow-sm border border-border/50",
        "hover:shadow-md hover:border-primary/30 transition-all cursor-pointer",
        draggable && "cursor-grab active:cursor-grabbing",
        className
      )}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {children}
    </div>
  );
}

export default StyledKanban;
