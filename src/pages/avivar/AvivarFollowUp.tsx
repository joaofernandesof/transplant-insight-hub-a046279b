 /**
  * AvivarFollowUp - Sistema de Follow-up Automático
  * Configuração de tentativas automáticas com prazos e agendamento
  * Suporte a tema claro e escuro
  * Integração real com banco de dados
  */
 
 import React, { useState } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Skeleton } from '@/components/ui/skeleton';
 import { 
   Sparkles, 
   Clock, 
   Zap,
   Calendar,
   Plus,
   TrendingUp,
   Timer,
   FileText,
   Brain,
   AlertCircle,
 } from 'lucide-react';
 import { useFollowupRules, type FollowupRule, type CreateFollowupRuleInput } from '@/hooks/useFollowupRules';
 import { useFollowupExecutions } from '@/hooks/useFollowupExecutions';
 import { useFollowupTemplates } from '@/hooks/useFollowupTemplates';
 import { FollowupRuleCard } from './followup/FollowupRuleCard';
 import { FollowupRuleDialog } from './followup/FollowupRuleDialog';
 import { FollowupExecutionCard } from './followup/FollowupExecutionCard';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';
 
 export default function AvivarFollowUp() {
   const { rules, isLoading: isLoadingRules, createRule, updateRule, toggleRule, deleteRule } = useFollowupRules();
   const { executions, history, stats, isLoadingExecutions, isLoadingStats, cancelExecution, sendNow } = useFollowupExecutions();
   const { templates, initializeDefaults } = useFollowupTemplates();
 
   const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
   const [editingRule, setEditingRule] = useState<FollowupRule | null>(null);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
 
   const handleCreateRule = () => {
     setEditingRule(null);
     setRuleDialogOpen(true);
   };
 
   const handleEditRule = (rule: FollowupRule) => {
     setEditingRule(rule);
     setRuleDialogOpen(true);
   };
 
   const handleSaveRule = (data: CreateFollowupRuleInput | (Partial<FollowupRule> & { id: string })) => {
     if ('id' in data) {
       updateRule.mutate(data, {
         onSuccess: () => setRuleDialogOpen(false),
       });
     } else {
       createRule.mutate(data, {
         onSuccess: () => setRuleDialogOpen(false),
       });
     }
   };
 
   const handleDeleteRule = (id: string) => {
     setRuleToDelete(id);
     setDeleteDialogOpen(true);
   };
 
   const confirmDeleteRule = () => {
     if (ruleToDelete) {
       deleteRule.mutate(ruleToDelete);
       setRuleToDelete(null);
       setDeleteDialogOpen(false);
     }
   };
 
   const handleToggleRule = (id: string, isActive: boolean) => {
     toggleRule.mutate({ id, is_active: isActive });
   };
 
   return (
     <div className="p-6 space-y-6">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
         <div>
           <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
             Follow-up Automático
             <Sparkles className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
           </h1>
           <p className="text-[hsl(var(--avivar-muted-foreground))]">Nunca perca um lead! Sistema inteligente de follow-up com IA</p>
         </div>
         <Button 
           onClick={handleCreateRule}
           className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white shadow-lg shadow-[hsl(var(--avivar-primary)/0.25)]"
         >
           <Plus className="h-4 w-4 mr-2" />
           Nova Regra
         </Button>
       </div>
 
       {/* Stats Cards */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Follow-ups Agendados</p>
                 {isLoadingStats ? (
                   <Skeleton className="h-8 w-16 mt-1" />
                 ) : (
                   <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{stats?.total_scheduled || 0}</p>
                 )}
               </div>
               <Calendar className="h-8 w-8 text-[hsl(var(--avivar-primary))]" />
             </div>
             <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">Próximas 24 horas</p>
           </CardContent>
         </Card>
 
         <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Para Hoje</p>
                 {isLoadingStats ? (
                   <Skeleton className="h-8 w-16 mt-1" />
                 ) : (
                   <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{stats?.today_scheduled || 0}</p>
                 )}
               </div>
               <Clock className="h-8 w-8 text-amber-500" />
             </div>
             {stats?.pending_now ? (
               <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{stats.pending_now} pendentes agora</p>
             ) : (
               <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">Nenhum pendente</p>
             )}
           </CardContent>
         </Card>
 
         <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Taxa de Sucesso</p>
                 {isLoadingStats ? (
                   <Skeleton className="h-8 w-16 mt-1" />
                 ) : (
                   <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{stats?.success_rate || 0}%</p>
                 )}
               </div>
               <TrendingUp className="h-8 w-8 text-emerald-500" />
             </div>
             <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Leads que responderam</p>
           </CardContent>
         </Card>
 
         <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Tempo de Resposta</p>
                 {isLoadingStats ? (
                   <Skeleton className="h-8 w-16 mt-1" />
                 ) : (
                   <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
                     {stats?.avg_response_time_minutes ? `${Math.round(stats.avg_response_time_minutes)} min` : '-'}
                   </p>
                 )}
               </div>
               <Timer className="h-8 w-8 text-blue-500" />
             </div>
             <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Média após follow-up</p>
           </CardContent>
         </Card>
       </div>
 
       <Tabs defaultValue="config" className="space-y-4">
         <TabsList className="bg-[hsl(var(--avivar-secondary))] border border-[hsl(var(--avivar-border))]">
           <TabsTrigger value="config" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
             <Zap className="h-4 w-4 mr-2" />
             Configuração
           </TabsTrigger>
           <TabsTrigger value="scheduled" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
             <Calendar className="h-4 w-4 mr-2" />
             Agendados ({executions.length})
           </TabsTrigger>
           <TabsTrigger value="history" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
             <Clock className="h-4 w-4 mr-2" />
             Histórico
           </TabsTrigger>
           <TabsTrigger value="templates" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
             <FileText className="h-4 w-4 mr-2" />
             Templates
           </TabsTrigger>
         </TabsList>
 
         {/* Configuração de Regras */}
         <TabsContent value="config">
           <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
             <CardHeader>
               <CardTitle className="text-[hsl(var(--avivar-foreground))]">Configuração de Follow-up</CardTitle>
               <CardDescription className="text-[hsl(var(--avivar-muted-foreground))]">
                 Defina as regras de follow-up automático para leads que não respondem
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               {isLoadingRules ? (
                 <div className="space-y-4">
                   {[1, 2, 3].map((i) => (
                     <Skeleton key={i} className="h-32 w-full" />
                   ))}
                 </div>
               ) : rules.length === 0 ? (
                 <div className="text-center py-12">
                   <AlertCircle className="h-12 w-12 mx-auto text-[hsl(var(--avivar-muted-foreground))] mb-4" />
                   <h3 className="text-lg font-medium text-[hsl(var(--avivar-foreground))] mb-2">
                     Nenhuma regra configurada
                   </h3>
                   <p className="text-[hsl(var(--avivar-muted-foreground))] mb-4">
                     Crie sua primeira regra de follow-up para começar a automatizar seus contatos
                   </p>
                   <Button onClick={handleCreateRule} className="bg-[hsl(var(--avivar-primary))]">
                     <Plus className="h-4 w-4 mr-2" />
                     Criar Primeira Regra
                   </Button>
                 </div>
               ) : (
                 <>
                   {rules.map((rule) => (
                     <FollowupRuleCard
                       key={rule.id}
                       rule={rule}
                       onToggle={handleToggleRule}
                       onEdit={handleEditRule}
                       onDelete={handleDeleteRule}
                     />
                   ))}
 
                   <Button 
                     variant="outline" 
                     onClick={handleCreateRule}
                     className="w-full border-dashed border-[hsl(var(--avivar-primary)/0.3)] text-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
                   >
                     <Plus className="h-4 w-4 mr-2" />
                     Adicionar Nova Tentativa
                   </Button>
                 </>
               )}
             </CardContent>
           </Card>
         </TabsContent>
 
         {/* Follow-ups Agendados */}
         <TabsContent value="scheduled">
           <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
             <CardHeader>
               <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                 Follow-ups Agendados
                 <Badge className="bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))] border-[hsl(var(--avivar-primary)/0.3)]">
                   {executions.length} pendentes
                 </Badge>
               </CardTitle>
               <CardDescription className="text-[hsl(var(--avivar-muted-foreground))]">
                 Mensagens automáticas programadas para os próximos dias
               </CardDescription>
             </CardHeader>
             <CardContent>
               {isLoadingExecutions ? (
                 <div className="space-y-3">
                   {[1, 2, 3].map((i) => (
                     <Skeleton key={i} className="h-20 w-full" />
                   ))}
                 </div>
               ) : executions.length === 0 ? (
                 <div className="text-center py-12 text-[hsl(var(--avivar-muted-foreground))]">
                   <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                   <p>Nenhum follow-up agendado no momento</p>
                   <p className="text-sm mt-1">Os follow-ups serão agendados automaticamente quando leads não responderem</p>
                 </div>
               ) : (
                 <ScrollArea className="h-[400px]">
                   <div className="space-y-3 pr-4">
                     {executions.map((execution) => (
                       <FollowupExecutionCard
                         key={execution.id}
                         execution={execution}
                         onCancel={(id) => cancelExecution.mutate(id)}
                         onSendNow={(id) => sendNow.mutate(id)}
                       />
                     ))}
                   </div>
                 </ScrollArea>
               )}
             </CardContent>
           </Card>
         </TabsContent>
 
         {/* Histórico */}
         <TabsContent value="history">
           <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
             <CardHeader>
               <CardTitle className="text-[hsl(var(--avivar-foreground))]">Histórico de Follow-ups</CardTitle>
               <CardDescription className="text-[hsl(var(--avivar-muted-foreground))]">
                 Mensagens enviadas automaticamente nos últimos 7 dias
               </CardDescription>
             </CardHeader>
             <CardContent>
               {history.length === 0 ? (
                 <div className="text-center py-12 text-[hsl(var(--avivar-muted-foreground))]">
                   <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                   <p>Nenhum follow-up enviado ainda</p>
                 </div>
               ) : (
                 <ScrollArea className="h-[400px]">
                   <div className="space-y-3 pr-4">
                     {history.map((execution) => (
                       <FollowupExecutionCard
                         key={execution.id}
                         execution={execution}
                         onCancel={() => {}}
                         onSendNow={() => {}}
                       />
                     ))}
                   </div>
                 </ScrollArea>
               )}
             </CardContent>
           </Card>
         </TabsContent>
 
         {/* Templates */}
         <TabsContent value="templates">
           <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
             <CardHeader>
               <div className="flex items-center justify-between">
                 <div>
                   <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                     Templates de Mensagem
                     <Brain className="h-5 w-5 text-purple-500" />
                   </CardTitle>
                   <CardDescription className="text-[hsl(var(--avivar-muted-foreground))]">
                     Modelos de mensagens prontos para usar com variáveis dinâmicas
                   </CardDescription>
                 </div>
                 {templates.length === 0 && (
                   <Button 
                     onClick={() => initializeDefaults.mutate()}
                     className="bg-[hsl(var(--avivar-primary))]"
                   >
                     <Plus className="h-4 w-4 mr-2" />
                     Carregar Templates Padrão
                   </Button>
                 )}
               </div>
             </CardHeader>
             <CardContent>
               {templates.length === 0 ? (
                 <div className="text-center py-12 text-[hsl(var(--avivar-muted-foreground))]">
                   <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                   <p>Nenhum template criado ainda</p>
                   <p className="text-sm mt-1">Clique no botão acima para carregar templates prontos</p>
                 </div>
               ) : (
                 <div className="grid gap-4 md:grid-cols-2">
                   {templates.map((template) => (
                     <div 
                       key={template.id}
                       className="p-4 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-secondary))]"
                     >
                       <div className="flex items-center justify-between mb-2">
                         <h4 className="font-medium text-[hsl(var(--avivar-foreground))]">{template.name}</h4>
                       </div>
                       <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">{template.message_template}</p>
                       <div className="flex gap-2 mt-3">
                         {template.variables_used.map((v) => (
                           <Badge key={v} variant="outline" className="text-xs border-[hsl(var(--avivar-border))]">
                             {`{{${v}}}`}
                           </Badge>
                         ))}
                       </div>
                       {template.usage_count > 0 && (
                         <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-2">
                           Usado {template.usage_count}x • {template.success_rate}% sucesso
                         </p>
                       )}
                     </div>
                   ))}
                 </div>
               )}
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>
 
       {/* Rule Dialog */}
       <FollowupRuleDialog
         open={ruleDialogOpen}
         onOpenChange={setRuleDialogOpen}
         rule={editingRule}
         onSave={handleSaveRule}
         isLoading={createRule.isPending || updateRule.isPending}
         existingRulesCount={rules.length}
       />
 
       {/* Delete Confirmation Dialog */}
       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
         <AlertDialogContent className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
           <AlertDialogHeader>
             <AlertDialogTitle className="text-[hsl(var(--avivar-foreground))]">Excluir Regra</AlertDialogTitle>
             <AlertDialogDescription className="text-[hsl(var(--avivar-muted-foreground))]">
               Tem certeza que deseja excluir esta regra de follow-up? Esta ação não pode ser desfeita.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel className="border-[hsl(var(--avivar-border))]">Cancelar</AlertDialogCancel>
             <AlertDialogAction 
               onClick={confirmDeleteRule}
               className="bg-red-500 hover:bg-red-600"
             >
               Excluir
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </div>
   );
 }