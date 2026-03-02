/**
 * TeamRosterPage - Visão de Equipe para o Setor de RH
 * Exibe os membros da equipe NeoTeam com dados de ficha
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users, Search, Filter, UserCog, Building,
  Mail, Phone, MapPin, Briefcase,
} from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  branch_id: string | null;
  created_at: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  branch_name: string | null;
  rh_cargo: string | null;
  rh_area: string | null;
  rh_modelo: string | null;
  rh_status: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  MASTER: 'Master',
  ADMIN: 'Administrador',
  PROFISSIONAL: 'Profissional',
  OPERACIONAL: 'Operacional',
};

const ROLE_COLORS: Record<string, string> = {
  MASTER: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  PROFISSIONAL: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  OPERACIONAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function TeamRosterPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-roster'],
    queryFn: async (): Promise<TeamMember[]> => {
      // Fetch team members with user info
      const { data: teamData, error } = await supabase
        .from('neoteam_team_members')
        .select(`
          id, user_id, role, is_active, branch_id, created_at
        `)
        .eq('is_active', true)
        .order('role')
        .order('created_at');

      if (error) throw error;
      if (!teamData?.length) return [];

      // Get user IDs to fetch profiles
      const userIds = teamData.map(t => t.user_id);
      
      const [usersRes, branchesRes] = await Promise.all([
        supabase
          .from('neohub_users')
          .select('user_id, full_name, email, avatar_url, phone')
          .in('user_id', userIds),
        supabase
          .from('neoteam_branches')
          .select('id, name'),
      ]);

      const usersMap = new Map(
        (usersRes.data || []).map(u => [u.user_id, u])
      );
      const branchesMap = new Map(
        (branchesRes.data || []).map(b => [b.id, b.name])
      );

      // Try to get RH data
      const { data: rhData } = await supabase
        .from('rh_colaboradores')
        .select('email, cargo_id, area_id, modelo_contratacao, status')
        .in('email', (usersRes.data || []).map(u => u.email).filter(Boolean));

      const rhMap = new Map(
        (rhData || []).map(r => [r.email, r])
      );

      // Get cargo names
      const cargoIds = (rhData || []).map(r => r.cargo_id).filter(Boolean);
      const { data: cargos } = cargoIds.length > 0
        ? await supabase.from('rh_cargos').select('id, nome').in('id', cargoIds)
        : { data: [] };
      const cargoMap = new Map((cargos || []).map(c => [c.id, c.nome]));

      return teamData.map(tm => {
        const user = usersMap.get(tm.user_id);
        const rh = user ? rhMap.get(user.email) : null;
        return {
          ...tm,
          full_name: user?.full_name || 'Usuário',
          email: user?.email || '',
          avatar_url: user?.avatar_url || null,
          phone: user?.phone || null,
          branch_name: tm.branch_id ? branchesMap.get(tm.branch_id) || null : null,
          rh_cargo: rh?.cargo_id ? cargoMap.get(rh.cargo_id) || null : null,
          rh_area: null,
          rh_modelo: rh?.modelo_contratacao || null,
          rh_status: rh?.status || null,
        };
      });
    },
  });

  const filtered = members.filter(m => {
    if (roleFilter !== 'todos' && m.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.full_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.rh_cargo || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const roleStats = members.reduce((acc, m) => {
    acc[m.role] = (acc[m.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-6">
      <GlobalBreadcrumb />

      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Equipe NeoTeam</h1>
            <p className="opacity-90 text-sm">{members.length} colaboradores ativos</p>
          </div>
        </div>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(roleStats).map(([role, count]) => (
          <Card key={role} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <UserCog className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABELS[role] || role}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="MASTER">Master</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="PROFISSIONAL">Profissional</SelectItem>
            <SelectItem value="OPERACIONAL">Operacional</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum colaborador encontrado
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(member => (
            <Card key={member.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{member.full_name}</h3>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${ROLE_COLORS[member.role] || 'bg-muted text-muted-foreground'}`}>
                        {ROLE_LABELS[member.role] || member.role}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                      {member.branch_name && (
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3 w-3" />
                          <span>{member.branch_name}</span>
                        </div>
                      )}
                      {member.rh_cargo && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3 w-3" />
                          <span>{member.rh_cargo}</span>
                        </div>
                      )}
                      {member.rh_modelo && (
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {member.rh_modelo.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
