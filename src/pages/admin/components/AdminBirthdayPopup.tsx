/**
 * AdminBirthdayPopup - Popup de aniversariantes do dia para o Portal Administrativo
 * Busca aniversariantes de todos os portais do NeoHub
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cake, PartyPopper, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface BirthdayPerson {
  id: string;
  name: string;
  age: number;
  source: string;
}

const SOURCE_LABELS: Record<string, string> = {
  neohub_users: 'NeoHub',
  ipromed_legal_clients: 'CPG',
  profiles: 'Perfis',
};

export function AdminBirthdayPopup() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const todayKey = format(new Date(), 'yyyy-MM-dd');

  const { data: birthdayPeople = [] } = useQuery({
    queryKey: ['admin-birthday-popup', todayKey],
    queryFn: async () => {
      const todayMonth = new Date().getMonth();
      const todayDay = new Date().getDate();
      const results: BirthdayPerson[] = [];

      // neohub_users
      const { data: neohub } = await supabase
        .from('neohub_users')
        .select('id, full_name, email, birth_date')
        .not('birth_date', 'is', null);

      for (const u of neohub || []) {
        if (!u.birth_date) continue;
        const bd = new Date(u.birth_date + 'T12:00:00');
        if (bd.getMonth() === todayMonth && bd.getDate() === todayDay) {
          results.push({
            id: u.id,
            name: u.full_name || u.email || 'Sem nome',
            age: calcAge(u.birth_date),
            source: 'neohub_users',
          });
        }
      }

      // ipromed_legal_clients
      const { data: ipromed } = await supabase
        .from('ipromed_legal_clients')
        .select('id, name, birth_date')
        .not('birth_date', 'is', null);

      for (const u of ipromed || []) {
        if (!u.birth_date) continue;
        const bd = new Date(u.birth_date + 'T12:00:00');
        if (bd.getMonth() === todayMonth && bd.getDate() === todayDay) {
          results.push({
            id: `ipromed-${u.id}`,
            name: u.name || 'Sem nome',
            age: calcAge(u.birth_date),
            source: 'ipromed_legal_clients',
          });
        }
      }

      // profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, birth_date')
        .not('birth_date', 'is', null);

      for (const u of profiles || []) {
        if (!u.birth_date) continue;
        if (results.some(r => r.name === (u.name || u.email))) continue;
        const bd = new Date(u.birth_date + 'T12:00:00');
        if (bd.getMonth() === todayMonth && bd.getDate() === todayDay) {
          results.push({
            id: `profile-${u.id}`,
            name: u.name || u.email || 'Sem nome',
            age: calcAge(u.birth_date),
            source: 'profiles',
          });
        }
      }

      return results;
    },
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    if (birthdayPeople.length > 0) {
      const key = `admin-birthday-dismissed-${todayKey}`;
      if (!sessionStorage.getItem(key)) {
        setOpen(true);
      }
    }
  }, [birthdayPeople, todayKey]);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem(`admin-birthday-dismissed-${todayKey}`, 'true');
  };

  if (birthdayPeople.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg text-white">
            <PartyPopper className="h-6 w-6 text-amber-400" />
            Aniversariante{birthdayPeople.length > 1 ? 's' : ''} do Dia! 🎉
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} — {birthdayPeople.length} pessoa{birthdayPeople.length > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 my-2 max-h-64 overflow-y-auto">
          {birthdayPeople.map((person) => (
            <div
              key={person.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
            >
              <div className="p-2 rounded-full bg-amber-500/20">
                <Cake className="h-4 w-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">{person.name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Gift className="h-3 w-3" />
                    {person.age} anos
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-600 text-slate-400">
                    {SOURCE_LABELS[person.source] || person.source}
                  </Badge>
                </div>
              </div>
              <span className="text-lg">🎂</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-500 text-center">
          Não esqueça de parabenizar! 🎂
        </p>

        <div className="flex justify-center gap-2 mt-2">
          <Button
            onClick={() => { handleClose(); navigate('/admin/birthdays'); }}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Ver Todos
          </Button>
          <Button onClick={handleClose} size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
