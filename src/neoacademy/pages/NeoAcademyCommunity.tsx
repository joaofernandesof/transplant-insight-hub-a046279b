import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { 
  Loader2, Users, Search, MapPin, MessageCircle, 
  Send, User, Building2, Instagram, Phone, Lock, X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Member {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  clinicName: string | null;
  instagramPersonal: string | null;
  whatsappPersonal: string | null;
  profilePublic: boolean;
  role: string;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function formatLocation(city: string | null, state: string | null) {
  if (city && state) return `${city}/${state}`;
  return city || state || null;
}

function MemberShowcaseCard({ 
  member, 
  onViewProfile, 
  onMessage 
}: { 
  member: Member; 
  onViewProfile: () => void;
  onMessage: () => void;
}) {
  const location = formatLocation(member.city, member.state);

  return (
    <div className="group relative rounded-xl bg-[#14141f] border border-white/5 hover:border-blue-500/30 transition-all duration-300 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 to-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="p-5 flex flex-col items-center text-center">
        <Avatar className="h-16 w-16 ring-2 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all">
          <AvatarImage src={member.avatarUrl || undefined} alt={member.fullName} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-sky-500/20 text-blue-300 text-lg font-bold">
            {getInitials(member.fullName)}
          </AvatarFallback>
        </Avatar>

        <h3 className="mt-3 font-semibold text-white text-sm truncate w-full" title={member.fullName}>
          {member.fullName}
        </h3>

        {location && (
          <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{location}</span>
          </div>
        )}

        {member.clinicName && (
          <div className="flex items-center gap-1 text-xs text-zinc-600 mt-1">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{member.clinicName}</span>
          </div>
        )}

        {member.role === 'owner' && (
          <Badge className="mt-2 bg-blue-500/15 text-blue-400 border-blue-500/20 text-[10px]">
            Produtor
          </Badge>
        )}

        <div className="flex gap-2 mt-4 w-full">
          <Button
            onClick={onViewProfile}
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 text-xs h-8 border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white"
          >
            <User className="h-3.5 w-3.5" />
            Perfil
          </Button>
          <Button
            onClick={onMessage}
            size="sm"
            className="flex-1 gap-1.5 text-xs h-8 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-0"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Mensagem
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProfileDialog({ 
  member, 
  onClose, 
  onMessage 
}: { 
  member: Member | null; 
  onClose: () => void;
  onMessage: () => void;
}) {
  if (!member) return null;
  const location = formatLocation(member.city, member.state);

  return (
    <Dialog open={!!member} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#14141f] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="sr-only">Perfil de {member.fullName}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center py-4">
          <Avatar className="h-24 w-24 ring-4 ring-blue-500/20">
            <AvatarImage src={member.avatarUrl || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-sky-500/20 text-blue-300 text-2xl font-bold">
              {getInitials(member.fullName)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold mt-4">{member.fullName}</h2>
          {location && (
            <div className="flex items-center gap-1.5 text-zinc-400 mt-1">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
          )}
          {member.role === 'owner' && (
            <Badge className="mt-2 bg-blue-500/15 text-blue-400 border-blue-500/20">Produtor</Badge>
          )}
        </div>

        {member.profilePublic ? (
          <div className="space-y-4 border-t border-white/5 pt-4">
            {member.bio && (
              <p className="text-sm text-zinc-400 text-center">{member.bio}</p>
            )}
            <div className="grid gap-3">
              {member.clinicName && (
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <Building2 className="h-4 w-4 text-zinc-500" />
                  <span>{member.clinicName}</span>
                </div>
              )}
              {member.instagramPersonal && (
                <div className="flex items-center gap-3 text-sm">
                  <Instagram className="h-4 w-4 text-zinc-500" />
                  <a
                    href={`https://instagram.com/${member.instagramPersonal.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {member.instagramPersonal}
                  </a>
                </div>
              )}
              {member.whatsappPersonal && (
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <Phone className="h-4 w-4 text-zinc-500" />
                  <span>{member.whatsappPersonal}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border-t border-white/5 pt-4">
            <div className="flex flex-col items-center text-center py-4 text-zinc-500">
              <Lock className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Perfil privado</p>
              <p className="text-xs mt-1">Apenas nome e localização são visíveis.</p>
            </div>
          </div>
        )}

        <div className="border-t border-white/5 pt-4">
          <Button
            onClick={() => { onMessage(); onClose(); }}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Enviar Mensagem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function NeoAcademyCommunity() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [messageMember, setMessageMember] = useState<Member | null>(null);
  const [message, setMessage] = useState('');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['neoacademy-members', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: myMembership } = await supabase
        .from('neoacademy_account_members')
        .select('account_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      if (!myMembership) return [];
      const { data: accountMembers, error } = await supabase
        .from('neoacademy_account_members')
        .select('user_id, role')
        .eq('account_id', myMembership.account_id)
        .eq('is_active', true);
      if (error || !accountMembers) return [];
      const userIds = accountMembers.map(m => m.user_id).filter(id => id !== user.id);
      if (userIds.length === 0) return [];
      const { data: users } = await supabase
        .from('neohub_users')
        .select('user_id, full_name, avatar_url, email, address_city, address_state, bio, clinic_name, instagram_personal, whatsapp_personal, profile_public')
        .in('user_id', userIds);
      const roleMap = new Map(accountMembers.map(m => [m.user_id, m.role]));
      return (users || []).map((u): Member => ({
        userId: u.user_id,
        fullName: u.full_name || 'Membro',
        avatarUrl: u.avatar_url,
        email: u.email,
        city: u.address_city,
        state: u.address_state,
        bio: u.bio,
        clinicName: u.clinic_name,
        instagramPersonal: u.instagram_personal,
        whatsappPersonal: u.whatsapp_personal,
        profilePublic: u.profile_public || false,
        role: roleMap.get(u.user_id) || 'student',
      }));
    },
    enabled: !!user?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ recipientId, content }: { recipientId: string; content: string }) => {
      const { error } = await supabase
        .from('community_messages')
        .insert({ sender_id: user!.id, recipient_id: recipientId, content });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Mensagem enviada!');
      setMessage('');
      setMessageMember(null);
    },
    onError: () => toast.error('Erro ao enviar mensagem'),
  });

  const uniqueStates = [...new Set(members.map(m => m.state).filter(Boolean))].sort() as string[];

  const filteredMembers = members.filter(m => {
    const matchesSearch = !searchTerm.trim() || 
      m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.clinicName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = stateFilter === 'all' || m.state === stateFilter;
    return matchesSearch && matchesState;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-blue-400" />
          <h1 className="text-lg font-bold text-white">Comunidade</h1>
          <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/20 text-xs ml-auto">
            {members.length} {members.length === 1 ? 'membro' : 'membros'}
          </Badge>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
            <Input
              placeholder="Buscar por nome, clínica ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#14141f] border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-blue-500/50"
            />
          </div>
          {uniqueStates.length > 0 && (
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-[#14141f] border-white/10 text-zinc-300">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-zinc-500" />
                  <SelectValue placeholder="Estado" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#14141f] border-white/10">
                <SelectItem value="all">Todos os Estados</SelectItem>
                {uniqueStates.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {searchTerm || stateFilter !== 'all' ? (
          <p className="text-xs text-zinc-600">
            {filteredMembers.length} {filteredMembers.length === 1 ? 'membro encontrado' : 'membros encontrados'}
          </p>
        ) : null}

        {filteredMembers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredMembers.map(member => (
              <MemberShowcaseCard
                key={member.userId}
                member={member}
                onViewProfile={() => setSelectedMember(member)}
                onMessage={() => setMessageMember(member)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="h-12 w-12 mx-auto text-zinc-700 mb-4" />
            <h3 className="text-lg font-medium text-zinc-400">Nenhum membro encontrado</h3>
            <p className="text-sm text-zinc-600 mt-1">
              {searchTerm ? 'Tente ajustar os filtros de busca' : 'Seja o primeiro a se juntar!'}
            </p>
          </div>
        )}
      </div>

      <ProfileDialog
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onMessage={() => {
          if (selectedMember) setMessageMember(selectedMember);
        }}
      />

      <Dialog open={!!messageMember} onOpenChange={() => setMessageMember(null)}>
        <DialogContent className="sm:max-w-md bg-[#14141f] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Enviar Mensagem</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Envie uma mensagem para {messageMember?.fullName}.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="bg-[#0a0a0f] border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-blue-500/50"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageMember(null)} className="border-white/10 text-zinc-300 hover:bg-white/5">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (message.trim() && messageMember) {
                  sendMessageMutation.mutate({ recipientId: messageMember.userId, content: message.trim() });
                }
              }}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
            >
              <Send className="h-4 w-4" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
