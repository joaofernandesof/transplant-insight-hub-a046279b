/**
 * UserApprovals - Página de Aprovação de Cadastros
 * Admin aprova ou rejeita usuários que se cadastraram
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Clock, UserPlus, Mail, Calendar, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PendingUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  cpf: string | null;
  is_active: boolean;
  created_at: string;
}

export default function UserApprovals() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-user-approvals', filter],
    queryFn: async () => {
      let query = supabase
        .from('neohub_users')
        .select('id, user_id, email, full_name, phone, cpf, is_active, created_at')
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('is_active', false);
      } else if (filter === 'approved') {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PendingUser[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('neohub_users')
        .update({ is_active: true })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Usuário aprovado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['admin-user-approvals'] });
    },
    onError: () => toast.error('Erro ao aprovar usuário'),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ userId, authUserId }: { userId: string; authUserId: string }) => {
      // Remove neohub_users record
      const { error: deleteError } = await supabase
        .from('neohub_users')
        .delete()
        .eq('id', userId);
      if (deleteError) throw deleteError;
      
      // Delete auth user via edge function
      await supabase.functions.invoke('admin-delete-user', {
        body: { user_id: authUserId },
      });
    },
    onSuccess: () => {
      toast.success('Cadastro rejeitado e removido');
      queryClient.invalidateQueries({ queryKey: ['admin-user-approvals'] });
    },
    onError: () => toast.error('Erro ao rejeitar usuário'),
  });

  const filtered = users.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.email.toLowerCase().includes(s) || u.full_name.toLowerCase().includes(s);
  });

  const pendingCount = users.filter(u => !u.is_active).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Aprovação de Cadastros</h1>
            <p className="text-sm text-slate-400">Gerencie solicitações de acesso ao sistema</p>
          </div>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="mt-2">
            {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="flex gap-2">
          {(['pending', 'approved', 'all'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
              }
            >
              {f === 'pending' ? 'Pendentes' : f === 'approved' ? 'Aprovados' : 'Todos'}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">Nenhum cadastro {filter === 'pending' ? 'pendente' : ''}</p>
          <p className="text-sm mt-1">
            {filter === 'pending' 
              ? 'Todos os cadastros foram processados.' 
              : 'Nenhum registro encontrado.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(user => (
            <div
              key={user.id}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white truncate">{user.full_name}</h3>
                  {user.is_active ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      Aprovado
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                      <Clock className="h-3 w-3 mr-1" /> Pendente
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {user.email}
                  </span>
                  {user.phone && <span>📱 {user.phone}</span>}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {!user.is_active && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(user.id)}
                    disabled={approveMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-1" /> Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectMutation.mutate({ userId: user.id, authUserId: user.user_id })}
                    disabled={rejectMutation.isPending}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <X className="h-4 w-4 mr-1" /> Rejeitar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
