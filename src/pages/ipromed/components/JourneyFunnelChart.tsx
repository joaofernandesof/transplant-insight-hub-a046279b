/**
 * Funil Visual da Jornada do Cliente
 * Barras verticais simples mostrando quantidade por etapa
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface Props {
  data: {
    novos: number;
    agendado: number;
    andamento: number;
    reuniaoAgendada: number;
    continuo: number;
  };
}

const phases = [
  { key: 'novos', name: 'Novos\nclientes', color: 'bg-gray-400' },
  { key: 'agendado', name: 'Onboarding\nagendado', color: 'bg-orange-400' },
  { key: 'andamento', name: 'Pacote Jurídico\nem andamento', color: 'bg-blue-400' },
  { key: 'reuniaoAgendada', name: 'Reunião de\nApresentação', color: 'bg-purple-400' },
  { key: 'continuo', name: 'Acompanhamento\ncontínuo', color: 'bg-emerald-400' },
] as const;

export function JourneyFunnelChart({ data }: Props) {
  const maxCount = Math.max(...Object.values(data), 1);

  return (
    <Card className="border-none shadow-md h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          Jornada do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-end pb-6">
        <div className="flex items-end justify-between gap-3 w-full" style={{ height: '100%', minHeight: '200px' }}>
          {phases.map((phase) => {
            const count = data[phase.key];
            const heightPercent = maxCount > 0 ? Math.max(8, (count / maxCount) * 100) : 8;

            return (
              <div key={phase.key} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-lg font-bold">{count}</span>
                <div className="w-full flex items-end flex-1">
                  <div
                    className={`w-full ${phase.color} rounded-t-md transition-all`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground text-center leading-tight whitespace-pre-line">
                  {phase.name}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
