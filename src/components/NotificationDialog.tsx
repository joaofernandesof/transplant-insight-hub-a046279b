import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import RichTextEditor from './RichTextEditor';
import {
  Send,
  Image,
  Video,
  Users,
  Search,
  X,
  Filter,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  city?: string;
  state?: string;
  tier?: string;
  status?: string;
}

const NotificationDialog: React.FC<NotificationDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [contentText, setContentText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch users
  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...users];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        u => u.name?.toLowerCase().includes(search) || 
             u.email?.toLowerCase().includes(search) ||
             u.city?.toLowerCase().includes(search)
      );
    }

    if (filterState !== 'all') {
      filtered = filtered.filter(u => u.state === filterState);
    }

    if (filterTier !== 'all') {
      filtered = filtered.filter(u => u.tier === filterTier);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.status === filterStatus);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterState, filterTier, filterStatus]);

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.user_id));
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSend = async () => {
    if (!title.trim()) {
      toast({ title: 'Erro', description: 'Digite um título.', variant: 'destructive' });
      return;
    }
    if (!contentText.trim()) {
      toast({ title: 'Erro', description: 'Digite uma mensagem.', variant: 'destructive' });
      return;
    }
    if (selectedUsers.length === 0) {
      toast({ title: 'Erro', description: 'Selecione ao menos um usuário.', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create notification
      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert({
          title,
          content: contentText,
          content_html: contentHtml,
          image_url: imageUrl || null,
          video_url: videoUrl || null,
          created_by: user?.id
        })
        .select()
        .single();

      if (notifError) throw notifError;

      // Create recipients
      const recipients = selectedUsers.map(userId => ({
        notification_id: notification.id,
        user_id: userId
      }));

      const { error: recipError } = await supabase
        .from('notification_recipients')
        .insert(recipients);

      if (recipError) throw recipError;

      toast({
        title: 'Sucesso!',
        description: `Notificação enviada para ${selectedUsers.length} usuário(s).`
      });

      // Reset form
      setTitle('');
      setContentHtml('');
      setContentText('');
      setImageUrl('');
      setVideoUrl('');
      setSelectedUsers([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a notificação.',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const uniqueStates = [...new Set(users.map(u => u.state).filter(Boolean))];
  const uniqueTiers = [...new Set(users.map(u => u.tier).filter(Boolean))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Notificação
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título da Notificação</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título..."
            />
          </div>

          {/* Rich Text Editor */}
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <RichTextEditor
              value={contentHtml}
              onChange={(html, text) => {
                setContentHtml(html);
                setContentText(text);
              }}
              placeholder="Digite sua mensagem..."
            />
          </div>

          {/* Media URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                URL da Imagem (opcional)
              </Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoUrl" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                URL do Vídeo (opcional)
              </Label>
              <Input
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Preview */}
          {(imageUrl || videoUrl) && (
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-sm text-muted-foreground mb-2 block">Pré-visualização</Label>
              <div className="flex gap-4 flex-wrap">
                {imageUrl && (
                  <img src={imageUrl} alt="Preview" className="max-h-24 rounded" onError={(e) => e.currentTarget.style.display = 'none'} />
                )}
                {videoUrl && (
                  <video src={videoUrl} className="max-h-24 rounded" controls />
                )}
              </div>
            </div>
          )}

          {/* User Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Destinatários ({selectedUsers.length} selecionados)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedUsers.length === filteredUsers.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-8"
                />
              </div>

              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {uniqueStates.map(state => (
                    <SelectItem key={state} value={state!}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger>
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  {uniqueTiers.map(tier => (
                    <SelectItem key={tier} value={tier!}>{tier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User List */}
            <ScrollArea className="h-[200px] border rounded-lg">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nenhum usuário encontrado
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredUsers.map(user => (
                    <div
                      key={user.user_id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                        selectedUsers.includes(user.user_id) ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => handleSelectUser(user.user_id)}
                    >
                      <Checkbox
                        checked={selectedUsers.includes(user.user_id)}
                        onCheckedChange={() => handleSelectUser(user.user_id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {user.state && <Badge variant="outline" className="text-xs">{user.state}</Badge>}
                        {user.tier && <Badge variant="secondary" className="text-xs">{user.tier}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Notificação
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationDialog;
