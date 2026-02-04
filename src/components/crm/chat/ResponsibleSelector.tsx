/**
 * ResponsibleSelector - Seletor de responsável pelo lead
 * Exibe popover com membros da equipe para atribuição
 */

import { useState } from 'react';
import { Check, ChevronDown, Loader2, UserX } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  member_user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

interface ResponsibleSelectorProps {
  conversationId: string;
  currentAssignedTo: string | null;
  onAssigned?: () => void;
}

export function ResponsibleSelector({ 
  conversationId, 
  currentAssignedTo,
  onAssigned 
}: ResponsibleSelectorProps) {
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();

  // Buscar membros da equipe
  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ['team-members-for-assignment', user?.id],
    queryFn: async (): Promise<TeamMember[]> => {
      if (!user?.id) return [];

      // Buscar membros da equipe do usuário atual (owner)
      const { data, error } = await supabase
        .from('avivar_team_members')
        .select('id, member_user_id, name, email, avatar_url, role')
        .eq('owner_user_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      // Adicionar o próprio usuário como opção
      const currentUserAsOwner: TeamMember = {
        id: 'owner',
        member_user_id: user.id,
        name: 'Eu (Proprietário)',
        email: user.email || '',
        avatar_url: null,
        role: 'admin'
      };

      const members = (data || []).map(m => ({
        id: m.id,
        member_user_id: m.member_user_id,
        name: m.name,
        email: m.email,
        avatar_url: m.avatar_url,
        role: m.role
      }));

      return [currentUserAsOwner, ...members];
    },
    enabled: !!user?.id,
  });

  const handleSelect = async (memberId: string | null) => {
    if (!conversationId) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('crm_conversations')
        .update({ assigned_to: memberId })
        .eq('id', conversationId);

      if (error) throw error;

      const memberName = memberId 
        ? teamMembers.find(m => m.member_user_id === memberId)?.name || 'Membro'
        : null;
      
      toast.success(
        memberId 
          ? `Lead atribuído a ${memberName}` 
          : 'Responsável removido'
      );
      
      onAssigned?.();
      setOpen(false);
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast.error('Erro ao atribuir responsável');
    } finally {
      setIsUpdating(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const selectedMember = teamMembers.find(m => m.member_user_id === currentAssignedTo);

  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Responsável</label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto py-1 px-2 gap-2 hover:bg-[hsl(var(--avivar-muted))]"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : selectedMember ? (
              <>
                <Avatar className="h-5 w-5">
                  {selectedMember.avatar_url ? (
                    <AvatarImage src={selectedMember.avatar_url} alt={selectedMember.name} />
                  ) : null}
                  <AvatarFallback className="text-[10px] bg-[hsl(var(--avivar-primary))] text-white">
                    {getInitials(selectedMember.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-[hsl(var(--avivar-foreground))] max-w-[100px] truncate">
                  {selectedMember.name}
                </span>
              </>
            ) : (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] bg-[hsl(var(--avivar-muted))]">
                    <UserX className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                  Não atribuído
                </span>
              </>
            )}
            <ChevronDown className="h-3 w-3 text-[hsl(var(--avivar-muted-foreground))]" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-56 p-1 bg-popover border-[hsl(var(--avivar-border))]" 
          align="end"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--avivar-muted-foreground))]" />
            </div>
          ) : (
            <div className="space-y-0.5">
              {/* Opção para remover responsável */}
              <button
                onClick={() => handleSelect(null)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors",
                  "hover:bg-[hsl(var(--avivar-muted))]",
                  !currentAssignedTo && "bg-[hsl(var(--avivar-muted))]"
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-[hsl(var(--avivar-muted))]">
                    <UserX className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-left text-[hsl(var(--avivar-muted-foreground))]">
                  Não atribuído
                </span>
                {!currentAssignedTo && (
                  <Check className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                )}
              </button>

              {teamMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleSelect(member.member_user_id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors",
                    "hover:bg-[hsl(var(--avivar-muted))]",
                    currentAssignedTo === member.member_user_id && "bg-[hsl(var(--avivar-muted))]"
                  )}
                >
                  <Avatar className="h-6 w-6">
                    {member.avatar_url ? (
                      <AvatarImage src={member.avatar_url} alt={member.name} />
                    ) : null}
                    <AvatarFallback className="text-[10px] bg-[hsl(var(--avivar-primary))] text-white">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[hsl(var(--avivar-foreground))] truncate">
                      {member.name}
                    </p>
                    <p className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] capitalize">
                      {member.role}
                    </p>
                  </div>
                  {currentAssignedTo === member.member_user_id && (
                    <Check className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                  )}
                </button>
              ))}

              {teamMembers.length === 1 && (
                <p className="text-xs text-center text-[hsl(var(--avivar-muted-foreground))] py-2">
                  Adicione membros na aba Equipe
                </p>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
