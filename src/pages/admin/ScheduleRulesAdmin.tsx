import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useWeeklyScheduleRules, CIDADES, WeeklyScheduleRule } from '@/hooks/useWeeklyScheduleRules';

export default function ScheduleRulesAdmin() {
  const { rules, isLoading, updateRule } = useWeeklyScheduleRules();
  const [selectedCidade, setSelectedCidade] = useState<string>('Fortaleza');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cityRules = rules.filter(r => r.cidade === selectedCidade);

  const consultaRules = cityRules.filter(r => r.tipo === 'consulta');
  const transplanteRules = cityRules.filter(r => r.tipo === 'transplante');
  const retornoRules = cityRules.filter(r => r.tipo === 'retorno');

  const renderRuleRow = (rule: WeeklyScheduleRule) => (
    <div key={rule.id} className="flex items-center justify-between py-2 px-3 rounded border bg-card">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">S{rule.semana_do_mes}</Badge>
        <span className="text-sm font-medium">
          {rule.medico || rule.categoria}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium ${rule.permitido ? 'text-green-600' : 'text-destructive'}`}>
          {rule.permitido ? 'SIM' : 'NÃO'}
        </span>
        <Switch
          checked={rule.permitido}
          onCheckedChange={(checked) => updateRule.mutate({ id: rule.id, permitido: checked })}
          disabled={updateRule.isPending}
        />
      </div>
    </div>
  );

  const renderSection = (title: string, sectionRules: WeeklyScheduleRule[]) => {
    const semanas = [1, 2, 3, 4];
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {semanas.map(s => {
            const weekRules = sectionRules.filter(r => r.semana_do_mes === s);
            if (weekRules.length === 0) return null;
            return (
              <div key={s}>
                <p className="text-xs font-medium text-muted-foreground mb-2">Semana {s}</p>
                <div className="space-y-1">
                  {weekRules.map(renderRuleRow)}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="px-4 pt-16 lg:pt-6 pb-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Matriz de Rodízio Médico
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gerencie as regras de agendamento por cidade, semana e tipo.
            </p>
          </div>
          <Select value={selectedCidade} onValueChange={setSelectedCidade}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CIDADES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="consulta">
          <TabsList>
            <TabsTrigger value="consulta">Consulta</TabsTrigger>
            <TabsTrigger value="transplante">Transplante</TabsTrigger>
            <TabsTrigger value="retorno">Retorno</TabsTrigger>
          </TabsList>
          <TabsContent value="consulta" className="mt-4">
            {renderSection('Consultas - Médicos', consultaRules)}
          </TabsContent>
          <TabsContent value="transplante" className="mt-4">
            {renderSection('Transplantes - Categorias', transplanteRules)}
          </TabsContent>
          <TabsContent value="retorno" className="mt-4">
            {renderSection('Retornos - Categorias', retornoRules)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
