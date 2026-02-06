 import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { useAvivarAccount } from '@/hooks/useAvivarAccount';
 import { toast } from 'sonner';
 
 export interface FollowupTemplate {
   id: string;
   user_id: string;
   name: string;
   category: string;
   urgency_level: 'soft' | 'medium' | 'urgent';
   message_template: string;
   variables_used: string[];
   is_active: boolean;
   usage_count: number;
   success_rate: number;
   created_at: string;
   updated_at: string;
 }
 
 // Variáveis disponíveis para templates
 export const TEMPLATE_VARIABLES = [
   { key: '{{nome}}', description: 'Nome do lead', example: 'Maria' },
   { key: '{{primeiro_nome}}', description: 'Primeiro nome do lead', example: 'Maria' },
   { key: '{{procedimento}}', description: 'Procedimento de interesse', example: 'Botox' },
   { key: '{{empresa}}', description: 'Nome da empresa/clínica', example: 'Clínica Estética' },
   { key: '{{profissional}}', description: 'Nome do profissional', example: 'Dra. Ana' },
   { key: '{{data_contato}}', description: 'Data do último contato', example: '15/01' },
   { key: '{{horario}}', description: 'Horário comercial atual', example: '14:30' },
   { key: '{{dia_semana}}', description: 'Dia da semana', example: 'segunda-feira' },
 ];
 
 // Templates padrão sugeridos
 export const DEFAULT_TEMPLATES: Omit<FollowupTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'usage_count' | 'success_rate'>[] = [
   {
     name: 'Primeira abordagem suave',
     category: 'primeiro_contato',
     urgency_level: 'soft',
     message_template: 'Oi {{primeiro_nome}}! 😊 Vi que você demonstrou interesse. Posso te ajudar com alguma informação sobre {{procedimento}}?',
     variables_used: ['primeiro_nome', 'procedimento'],
     is_active: true,
   },
   {
     name: 'Lembrete amigável',
     category: 'lembrete',
     urgency_level: 'soft',
     message_template: 'Olá {{primeiro_nome}}, tudo bem? Ainda está interessado(a) em saber mais sobre nossos procedimentos? Estou à disposição! 💫',
     variables_used: ['primeiro_nome'],
     is_active: true,
   },
   {
     name: 'Oferta especial',
     category: 'promocao',
     urgency_level: 'medium',
     message_template: '{{primeiro_nome}}, temos uma condição especial para {{procedimento}} essa semana! Posso te contar mais? 🎁',
     variables_used: ['primeiro_nome', 'procedimento'],
     is_active: true,
   },
   {
     name: 'Última tentativa',
     category: 'urgente',
     urgency_level: 'urgent',
     message_template: '{{primeiro_nome}}, essa é minha última tentativa de contato. Caso ainda tenha interesse, me responda aqui que te ajudo! Qualquer dúvida, estou disponível. 🙏',
     variables_used: ['primeiro_nome'],
     is_active: true,
   },
   {
     name: 'Reagendamento',
     category: 'reagendamento',
     urgency_level: 'medium',
     message_template: 'Oi {{primeiro_nome}}! Vi que não conseguimos confirmar seu horário. Que tal remarcarmos para um dia mais conveniente? 📅',
     variables_used: ['primeiro_nome'],
     is_active: true,
   },
 ];
 
 export function useFollowupTemplates() {
    const { user } = useAuth();
    const { accountId } = useAvivarAccount();
    const queryClient = useQueryClient();
 
   const { data: templates = [], isLoading } = useQuery({
     queryKey: ['followup-templates', user?.id],
     queryFn: async () => {
       if (!user?.id) return [];
 
       const { data, error } = await supabase
         .from('avivar_followup_templates')
         .select('*')
         .eq('user_id', user.id)
         .order('usage_count', { ascending: false });
 
       if (error) throw error;
       return data as FollowupTemplate[];
     },
     enabled: !!user?.id,
   });
 
   const createTemplate = useMutation({
     mutationFn: async (input: Omit<FollowupTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'usage_count' | 'success_rate'>) => {
        if (!user?.id || !accountId) throw new Error('Usuário não autenticado');

        const { data, error } = await supabase
          .from('avivar_followup_templates')
          .insert({
            user_id: user.id,
            account_id: accountId,
            ...input,
          })
          .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['followup-templates'] });
       toast.success('Template criado!');
     },
     onError: () => {
       toast.error('Erro ao criar template');
     },
   });
 
   const updateTemplate = useMutation({
     mutationFn: async ({ id, ...updates }: Partial<FollowupTemplate> & { id: string }) => {
       const { data, error } = await supabase
         .from('avivar_followup_templates')
         .update(updates)
         .eq('id', id)
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['followup-templates'] });
       toast.success('Template atualizado!');
     },
     onError: () => {
       toast.error('Erro ao atualizar template');
     },
   });
 
   const deleteTemplate = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('avivar_followup_templates')
         .delete()
         .eq('id', id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['followup-templates'] });
       toast.success('Template excluído!');
     },
     onError: () => {
       toast.error('Erro ao excluir template');
     },
   });
 
   // Initialize default templates if none exist
   const initializeDefaults = useMutation({
      mutationFn: async () => {
        if (!user?.id || !accountId) throw new Error('Usuário não autenticado');

        const templatesWithUserId = DEFAULT_TEMPLATES.map(t => ({
          ...t,
          user_id: user.id,
          account_id: accountId,
        }));

        const { error } = await supabase
          .from('avivar_followup_templates')
          .insert(templatesWithUserId);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['followup-templates'] });
       toast.success('Templates padrão criados!');
     },
   });
 
   // Replace variables in template with actual values
   const replaceVariables = (template: string, variables: Record<string, string>): string => {
     let result = template;
     Object.entries(variables).forEach(([key, value]) => {
       result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
     });
     return result;
   };
 
   return {
     templates,
     isLoading,
     createTemplate,
     updateTemplate,
     deleteTemplate,
     initializeDefaults,
     replaceVariables,
     defaultTemplates: DEFAULT_TEMPLATES,
     availableVariables: TEMPLATE_VARIABLES,
   };
 }