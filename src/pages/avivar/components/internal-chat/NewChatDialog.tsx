/**
 * NewChatDialog - Criar nova conversa (1:1 ou grupo)
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Users, Search } from 'lucide-react';
import type { TeamMember } from '@/hooks/useInternalChat';

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers: TeamMember[];
  onCreateChat: (type: 'direct' | 'group', memberIds: string[], name?: string) => Promise<void>;
}

export function NewChatDialog({ open, onOpenChange, teamMembers, onCreateChat }: NewChatDialogProps) {
  const [tab, setTab] = useState<'direct' | 'group'>('direct');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filtered = teamMembers.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (tab === 'direct' && selectedMembers.length === 1) {
      setIsCreating(true);
      await onCreateChat('direct', selectedMembers);
      setIsCreating(false);
      reset();
    } else if (tab === 'group' && selectedMembers.length >= 1 && groupName.trim()) {
      setIsCreating(true);
      await onCreateChat('group', selectedMembers, groupName.trim());
      setIsCreating(false);
      reset();
    }
  };

  const reset = () => {
    setSelectedMembers([]);
    setGroupName('');
    setSearch('');
  };

  const canCreate = tab === 'direct'
    ? selectedMembers.length === 1
    : selectedMembers.length >= 1 && groupName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Nova conversa</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setSelectedMembers([]); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct" className="gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" />
              Direta
            </TabsTrigger>
            <TabsTrigger value="group" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Grupo
            </TabsTrigger>
          </TabsList>

          {tab === 'group' && (
            <div className="mt-3">
              <Label htmlFor="group-name" className="text-xs">Nome do grupo</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ex: Equipe Comercial"
                className="mt-1"
              />
            </div>
          )}

          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar membro..."
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="h-[240px] mt-2 border rounded-lg">
            <div className="divide-y">
              {filtered.map(member => {
                const isSelected = selectedMembers.includes(member.user_id);
                return (
                  <button
                    key={member.user_id}
                    onClick={() => {
                      if (tab === 'direct') {
                        setSelectedMembers([member.user_id]);
                      } else {
                        toggleMember(member.user_id);
                      }
                    }}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                  >
                    {tab === 'group' && (
                      <Checkbox checked={isSelected} className="shrink-0" />
                    )}
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {member.full_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{member.full_name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{member.role}</p>
                    </div>
                    {tab === 'direct' && isSelected && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center p-4">
                  Nenhum membro encontrado
                </p>
              )}
            </div>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={!canCreate || isCreating}>
            {isCreating ? 'Criando...' : tab === 'direct' ? 'Iniciar conversa' : 'Criar grupo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
