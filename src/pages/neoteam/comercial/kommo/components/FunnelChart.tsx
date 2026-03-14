import { cn } from '@/lib/utils';
import type { KommoPipeline } from '../types';

export function FunnelChart({ pipeline }: { pipeline: KommoPipeline }) {
  const maxLeads = Math.max(...pipeline.stages.map(s => s.leads));

  return (
    <div className="space-y-2">
      {pipeline.stages.map((stage, idx) => {
        const width = maxLeads > 0 ? (stage.leads / maxLeads) * 100 : 0;
        const prevLeads = idx > 0 ? pipeline.stages[idx - 1].leads : null;
        const advanceRate = prevLeads ? ((stage.leads / prevLeads) * 100).toFixed(1) : null;

        return (
          <div key={stage.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium truncate">{stage.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                {advanceRate && (
                  <span className="text-muted-foreground">{advanceRate}%</span>
                )}
                <span className="font-semibold">{stage.leads}</span>
              </div>
            </div>
            <div className="h-6 bg-muted/50 rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-500 flex items-center px-2"
                style={{ width: `${Math.max(width, 4)}%`, backgroundColor: stage.color }}
              >
                <span className="text-[10px] text-white font-medium truncate">
                  {(stage.value / 1000).toFixed(0)}k · {stage.avgDays}d
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
