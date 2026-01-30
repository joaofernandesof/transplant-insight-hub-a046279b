/**
 * MessageInput - Campo de entrada de mensagem
 * Suporte a texto, anexos, emojis
 */

import { useState, useRef } from 'react';
import { Send, Paperclip, Smile, Mic, Image, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MessageInputProps {
  onSend: (content: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'audio' | 'document') => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSend, disabled, placeholder }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  return (
    <div className="border-t border-[hsl(var(--avivar-border))] p-4 bg-[hsl(var(--avivar-card))]">
      <div className="flex items-end gap-2">
        {/* Attachment dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]"
          >
            <DropdownMenuItem className="gap-2 text-[hsl(var(--avivar-foreground))]">
              <Image className="h-4 w-4 text-green-500" />
              Imagem
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-[hsl(var(--avivar-foreground))]">
              <FileText className="h-4 w-4 text-blue-500" />
              Documento
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-[hsl(var(--avivar-foreground))]">
              <Mic className="h-4 w-4 text-orange-500" />
              Áudio
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Text input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Digite sua mensagem..."}
            disabled={disabled}
            className={cn(
              "min-h-[44px] max-h-[150px] resize-none pr-10",
              "bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]",
              "text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]",
              "focus:ring-[hsl(var(--avivar-primary))]"
            )}
            rows={1}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-1 bottom-1 h-8 w-8 text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
          >
            <Smile className="h-5 w-5" />
          </Button>
        </div>

        {/* Send / Record button */}
        {message.trim() ? (
          <Button
            onClick={handleSend}
            disabled={disabled}
            size="icon"
            className="shrink-0 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)] text-white rounded-full h-11 w-11"
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "shrink-0 rounded-full h-11 w-11",
              isRecording 
                ? "bg-red-500 text-white animate-pulse" 
                : "text-[hsl(var(--avivar-muted-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
            )}
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? <X className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        )}
      </div>

      {/* Character count / hints */}
      <div className="flex items-center justify-between mt-2 text-xs text-[hsl(var(--avivar-muted-foreground))]">
        <span>Shift + Enter para nova linha</span>
        <span>{message.length}/4096</span>
      </div>
    </div>
  );
}
