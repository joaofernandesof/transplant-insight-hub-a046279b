/**
 * ChatThread - Thread de mensagens de um chat
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Paperclip, Send, Smile, Loader2, Image as ImageIcon, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import type { InternalChat, InternalMessage, TeamMember } from '@/hooks/useInternalChat';

const EMOJI_LIST = ['😀', '😂', '❤️', '👍', '🔥', '✅', '⭐', '🎉', '💪', '🙏', '👏', '💡', '🚀', '💬', '📌', '⚠️'];

interface ChatThreadProps {
  chat: InternalChat;
  messages: InternalMessage[];
  isLoading: boolean;
  onBack: () => void;
  onSendMessage: (content: string, mentions?: InternalMessage['mentions'], replyTo?: string) => Promise<void>;
  onSendFile: (file: File) => Promise<void>;
  getChatDisplayName: (chat: InternalChat) => string;
  getChatAvatar: (chat: InternalChat) => string | null | undefined;
  teamMembers: TeamMember[];
}

export function ChatThread({
  chat, messages, isLoading, onBack, onSendMessage, onSendFile,
  getChatDisplayName, getChatAvatar, teamMembers,
}: ChatThreadProps) {
  const { session } = useUnifiedAuth();
  const authUserId = session?.user?.id;
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    // Extract mentions from text (@Name)
    const mentionRegex = /@(\w[\w\s]*?\w)/g;
    const mentions: InternalMessage['mentions'] = [];
    let match;
    while ((match = mentionRegex.exec(trimmed)) !== null) {
      const name = match[1];
      const member = teamMembers.find(m => m.full_name.toLowerCase().includes(name.toLowerCase()));
      if (member) {
        mentions.push({ type: 'user', id: member.user_id, name: member.full_name });
      }
    }

    setIsSending(true);
    setInput('');
    try {
      await onSendMessage(trimmed, mentions.length > 0 ? mentions : undefined);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Mention autocomplete
    if (e.key === '@' || (showMentions && e.key === 'Escape')) {
      if (e.key === 'Escape') setShowMentions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Check for @mention
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex >= 0 && (atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ')) {
      const query = textBeforeCursor.slice(atIndex + 1);
      if (!query.includes(' ') || query.length < 20) {
        setMentionQuery(query);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (member: TeamMember) => {
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = input.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    const newText = input.slice(0, atIndex) + `@${member.full_name} ` + input.slice(cursorPos);
    setInput(newText);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const insertEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const filteredMembers = teamMembers.filter(m =>
    m.full_name.toLowerCase().includes(mentionQuery.toLowerCase()) && m.user_id !== authUserId
  );

  const displayName = getChatDisplayName(chat);
  const avatar = getChatAvatar(chat);

  // Group messages by date
  const groupedMessages: { date: string; msgs: InternalMessage[] }[] = [];
  messages.forEach(msg => {
    const date = format(new Date(msg.sent_at), 'dd/MM/yyyy');
    const last = groupedMessages[groupedMessages.length - 1];
    if (last?.date === date) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({ date, msgs: [msg] });
    }
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b bg-background shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarImage src={avatar || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {chat.type === 'group' ? <Users className="h-4 w-4" /> : displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{displayName}</p>
          {chat.type === 'group' && (
            <p className="text-[10px] text-muted-foreground">
              {chat.members?.length || 0} membros
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-4">
          {groupedMessages.map(group => (
            <div key={group.date}>
              <div className="flex items-center justify-center my-3">
                <span className="text-[10px] bg-muted text-muted-foreground px-3 py-1 rounded-full">
                  {group.date}
                </span>
              </div>
              <div className="space-y-1.5">
                {group.msgs.map(msg => {
                  const isMine = msg.sender_id === authUserId;
                  const isSystem = msg.message_type === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center py-1">
                        <span className="text-[10px] text-muted-foreground italic">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-2 max-w-[85%] ${isMine ? 'flex-row-reverse' : ''}`}>
                        {!isMine && (
                          <Avatar className="h-7 w-7 shrink-0 mt-1">
                            <AvatarImage src={msg.sender_avatar || undefined} />
                            <AvatarFallback className="text-[10px] bg-muted">
                              {(msg.sender_name || '?').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          {!isMine && chat.type === 'group' && (
                            <p className="text-[10px] text-muted-foreground mb-0.5 px-1">
                              {msg.sender_name}
                            </p>
                          )}
                          <div className={`rounded-2xl px-3 py-2 text-sm ${
                            isMine
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-muted rounded-tl-sm'
                          }`}>
                            {msg.is_deleted ? (
                              <span className="italic opacity-60">Mensagem apagada</span>
                            ) : msg.message_type === 'image' ? (
                              <div>
                                <img
                                  src={msg.file_url!}
                                  alt={msg.file_name || 'Imagem'}
                                  className="max-w-[240px] rounded-lg mb-1"
                                />
                                {msg.content && msg.content !== msg.file_name && (
                                  <p>{renderContent(msg.content)}</p>
                                )}
                              </div>
                            ) : msg.message_type === 'file' ? (
                              <a
                                href={msg.file_url!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 underline"
                              >
                                <FileText className="h-4 w-4 shrink-0" />
                                <span className="truncate">{msg.file_name || 'Arquivo'}</span>
                              </a>
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{renderContent(msg.content || '')}</p>
                            )}
                          </div>
                          <p className={`text-[9px] text-muted-foreground mt-0.5 ${isMine ? 'text-right' : ''} px-1`}>
                            {format(new Date(msg.sent_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="border-t p-3 shrink-0 relative">
        {/* Mention autocomplete */}
        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-popover border rounded-lg shadow-lg max-h-[160px] overflow-y-auto z-50">
            {filteredMembers.slice(0, 5).map(member => (
              <button
                key={member.user_id}
                onClick={() => insertMention(member)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-sm transition-colors"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="text-[9px]">{member.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span>{member.full_name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* File upload */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSendFile(file);
              e.target.value = '';
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Emoji */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_LIST.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    className="h-8 w-8 flex items-center justify-center hover:bg-muted rounded text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Text input */}
          <Textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem... (@nome para mencionar)"
            className="min-h-[36px] max-h-[120px] resize-none text-sm"
            rows={1}
          />

          {/* Send */}
          <Button
            size="icon"
            className="shrink-0 h-9 w-9"
            onClick={handleSend}
            disabled={!input.trim() || isSending}
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Render content with @mentions highlighted
function renderContent(text: string) {
  const parts = text.split(/(@\w[\w\s]*?\w(?=\s|$))/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span key={i} className="font-semibold text-primary/80">
          {part}
        </span>
      );
    }
    return part;
  });
}
