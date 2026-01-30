/**
 * AvivarTasks - Gestão de tarefas e follow-ups com visual IA roxo/violeta
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Clock, CheckCircle2, AlertTriangle, CalendarDays, Sparkles } from 'lucide-react';
import { CrmTasksPanel } from '@/components/crm/CrmTasksPanel';

export default function AvivarTasks() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Tarefas & Follow-ups
            <Sparkles className="h-5 w-5 text-purple-400" />
          </h1>
          <p className="text-slate-400">Gerencie suas atividades de vendas</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-500/25">
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 border-slate-700/50 border-l-4 border-l-amber-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">12</p>
                <p className="text-xs text-slate-400">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/80 border-slate-700/50 border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-white">3</p>
                <p className="text-xs text-slate-400">Atrasadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/80 border-slate-700/50 border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">5</p>
                <p className="text-xs text-slate-400">Para Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/80 border-slate-700/50 border-l-4 border-l-emerald-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-white">28</p>
                <p className="text-xs text-slate-400">Concluídas (mês)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Panel */}
      <div className="[&_.bg-background]:bg-slate-900/80 [&_.border]:border-slate-700/50 [&_.text-muted-foreground]:text-slate-400">
        <CrmTasksPanel />
      </div>
    </div>
  );
}
