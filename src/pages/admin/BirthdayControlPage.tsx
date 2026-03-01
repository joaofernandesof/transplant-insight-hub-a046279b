/**
 * BirthdayControlPage - Módulo de Controle de Aniversários do NeoHub
 * Exibe aniversariantes de todos os portais com filtros por mês e busca
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { Cake, Search, Users, CalendarDays, Gift, PartyPopper, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isToday, parseISO, getDaysInMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BirthdayUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  birth_date: string;
  source: string;
  age: number;
  isToday: boolean;
  dayOfMonth: number;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const SOURCE_LABELS: Record<string, string> = {
  neohub_users: 'NeoHub',
  ipromed_legal_clients: 'CPG Advocacia',
  profiles: 'Perfis',
};

const SOURCE_COLORS: Record<string, string> = {
  neohub_users: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  ipromed_legal_clients: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  profiles: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

export default function BirthdayControlPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [search, setSearch] = useState('');

  const { data: allBirthdays = [], isLoading } = useQuery({
    queryKey: ['admin-all-birthdays'],
    queryFn: async () => {
      const results: BirthdayUser[] = [];

      // 1. neohub_users
      const { data: neohub } = await supabase
        .from('neohub_users')
        .select('id, full_name, email, phone, birth_date')
        .not('birth_date', 'is', null);

      for (const u of neohub || []) {
        if (!u.birth_date) continue;
        const bd = new Date(u.birth_date + 'T12:00:00');
        const age = calcAge(u.birth_date);
        results.push({
          id: u.id,
          name: u.full_name || u.email || 'Sem nome',
          email: u.email,
          phone: u.phone,
          birth_date: u.birth_date,
          source: 'neohub_users',
          age,
          isToday: bd.getMonth() === now.getMonth() && bd.getDate() === now.getDate(),
          dayOfMonth: bd.getDate(),
        });
      }

      // 2. ipromed_legal_clients
      const { data: ipromed } = await supabase
        .from('ipromed_legal_clients')
        .select('id, name, email, phone, birth_date')
        .not('birth_date', 'is', null);

      for (const u of ipromed || []) {
        if (!u.birth_date) continue;
        const bd = new Date(u.birth_date + 'T12:00:00');
        const age = calcAge(u.birth_date);
        results.push({
          id: `ipromed-${u.id}`,
          name: u.name || 'Sem nome',
          email: u.email,
          phone: u.phone,
          birth_date: u.birth_date,
          source: 'ipromed_legal_clients',
          age,
          isToday: bd.getMonth() === now.getMonth() && bd.getDate() === now.getDate(),
          dayOfMonth: bd.getDate(),
        });
      }

      // 3. profiles (com birth_date)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, birth_date')
        .not('birth_date', 'is', null);

      for (const u of profiles || []) {
        if (!u.birth_date) continue;
        // Evitar duplicatas com neohub_users
        if (results.some(r => r.email === u.email && r.source === 'neohub_users')) continue;
        const bd = new Date(u.birth_date + 'T12:00:00');
        const age = calcAge(u.birth_date);
        results.push({
          id: `profile-${u.id}`,
          name: u.full_name || u.email || 'Sem nome',
          email: u.email,
          phone: null,
          birth_date: u.birth_date,
          source: 'profiles',
          age,
          isToday: bd.getMonth() === now.getMonth() && bd.getDate() === now.getDate(),
          dayOfMonth: bd.getDate(),
        });
      }

      return results;
    },
    staleTime: 1000 * 60 * 10,
  });

  const filtered = useMemo(() => {
    return allBirthdays
      .filter((u) => {
        const bd = new Date(u.birth_date + 'T12:00:00');
        if (bd.getMonth() !== selectedMonth) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            u.name.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.source.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => a.dayOfMonth - b.dayOfMonth);
  }, [allBirthdays, selectedMonth, search]);

  const todayCount = allBirthdays.filter((u) => u.isToday).length;
  const monthCount = filtered.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-3 lg:p-4 space-y-4">
      <GlobalBreadcrumb />

      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-900/40 via-orange-900/30 to-slate-800 border border-amber-700/30 p-4">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Cake className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Aniversários NeoHub</h1>
              <p className="text-sm text-slate-400">Controle centralizado de aniversários de todos os portais</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
              <p className="text-xs text-amber-300">Hoje</p>
              <p className="text-lg font-bold text-amber-400">{todayCount}</p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50">
              <p className="text-xs text-slate-400">{MONTHS[selectedMonth]}</p>
              <p className="text-lg font-bold text-white">{monthCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aniversariantes do dia */}
      {todayCount > 0 && (
        <Card className="bg-gradient-to-r from-amber-900/30 to-orange-900/20 border-amber-700/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-300 text-base">
              <PartyPopper className="h-5 w-5" />
              Aniversariantes de Hoje! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allBirthdays.filter(u => u.isToday).map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="p-2 rounded-full bg-amber-500/20">
                    <Gift className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{u.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{u.age} anos</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${SOURCE_COLORS[u.source]}`}>
                        {SOURCE_LABELS[u.source]}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white h-8 w-8"
            onClick={() => setSelectedMonth((m) => (m === 0 ? 11 : m - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white h-8 w-8"
            onClick={() => setSelectedMonth((m) => (m === 11 ? 0 : m + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Carregando aniversários...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum aniversariante em {MONTHS[selectedMonth]}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((u) => {
            const bd = new Date(u.birth_date + 'T12:00:00');
            return (
              <Card
                key={u.id}
                className={`border-slate-700/50 transition-all ${
                  u.isToday
                    ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20'
                    : 'bg-slate-800/50 hover:bg-slate-800/80'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${u.isToday ? 'bg-amber-500/20' : 'bg-slate-700/50'}`}>
                      <Cake className={`h-4 w-4 ${u.isToday ? 'text-amber-400' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white truncate">{u.name}</p>
                      {u.email && <p className="text-xs text-slate-400 truncate">{u.email}</p>}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs text-slate-400">
                          {format(bd, "dd 'de' MMMM", { locale: ptBR })} • {u.age} anos
                        </span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${SOURCE_COLORS[u.source]}`}>
                          {SOURCE_LABELS[u.source]}
                        </Badge>
                      </div>
                    </div>
                    {u.isToday && <span className="text-lg">🎂</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function calcAge(birthDate: string): number {
  const bd = new Date(birthDate + 'T12:00:00');
  const now = new Date();
  let age = now.getFullYear() - bd.getFullYear();
  const m = now.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
  return age;
}
