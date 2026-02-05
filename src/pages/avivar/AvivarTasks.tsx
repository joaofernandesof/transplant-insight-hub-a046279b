/**
 * AvivarTasks - Gestão de tarefas e follow-ups com suporte a tema claro/escuro
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Clock, CheckCircle2, AlertTriangle, CalendarDays, Sparkles, Loader2 } from 'lucide-react';
import { useAvivarTasks } from '@/hooks/useAvivarTasks';
import { AvivarTasksPanel } from '@/components/avivar/AvivarTasksPanel';
import { CreateTaskDialog } from '@/components/avivar/CreateTaskDialog';

export default function AvivarTasks() {
  const { stats, isLoading, leads, createTask } = useAvivarTasks();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--avivar-primary))]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            Tarefas & Follow-ups
            <Sparkles className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
          </h1>
          <p className="text-[hsl(var(--avivar-muted-foreground))]">Gerencie suas atividades de vendas</p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white shadow-lg shadow-[hsl(var(--avivar-primary)/0.25)]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] border-l-4 border-l-amber-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{stats.pending}</p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{stats.overdue}</p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Atrasadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{stats.today}</p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Para Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] border-l-4 border-l-emerald-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{stats.completedThisMonth}</p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Concluídas (mês)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Panel with themed wrapper */}
      <div className="[&_.bg-background]:bg-[hsl(var(--avivar-card))] [&_.border]:border-[hsl(var(--avivar-border))] [&_.text-muted-foreground]:text-[hsl(var(--avivar-muted-foreground))]">
        <AvivarTasksPanel />
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        leads={leads}
        onCreate={(data) => {
          createTask.mutate(data, {
            onSuccess: () => setShowCreateDialog(false),
          });
        }}
        isCreating={createTask.isPending}
      />
    </div>
  );
}
