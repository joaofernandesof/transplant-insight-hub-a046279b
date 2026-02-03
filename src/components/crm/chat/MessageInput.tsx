/**
 * MessageInput - Campo de entrada de mensagem
 * Suporte a texto, anexos, emojis e gravação de áudio
 */

import { useState, useRef } from 'react';
import { Send, Paperclip, Smile, Mic, Image, FileText, X, Square, Trash2, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { EmojiPicker } from './EmojiPicker';
import { useAudioRecorder, formatRecordingTime } from '@/hooks/useAudioRecorder';

interface MessageInputProps {
  onSend: (content: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'audio' | 'document') => void;
  onSendAudio?: (audioBlob: Blob) => void;
  onSendImage?: (imageBase64: string, caption?: string) => void;
  onSendVideo?: (videoBase64: string, caption?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSend, onSendAudio, onSendImage, onSendVideo, disabled, placeholder }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ base64: string; preview: string } | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ base64: string; preview: string } | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  const [videoCaption, setVideoCaption] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    cancelRecording,
    clearRecording,
  } = useAudioRecorder();

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage('');
    textareaRef.current?.focus();
  };

  const handleSendAudio = () => {
    if (audioBlob && onSendAudio) {
      onSendAudio(audioBlob);
      clearRecording();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage({
        base64,
        preview: base64,
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleSendImage = () => {
    if (selectedImage && onSendImage) {
      onSendImage(selectedImage.base64, imageCaption || undefined);
      setSelectedImage(null);
      setImageCaption('');
    }
  };

  const handleCancelImage = () => {
    setSelectedImage(null);
    setImageCaption('');
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return;
    }

    // Validate file size (max 16MB for videos)
    if (file.size > 16 * 1024 * 1024) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedVideo({
        base64,
        preview: URL.createObjectURL(file),
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleSendVideo = () => {
    if (selectedVideo && onSendVideo) {
      onSendVideo(selectedVideo.base64, videoCaption || undefined);
      setSelectedVideo(null);
      setVideoCaption('');
    }
  };

  const handleCancelVideo = () => {
    if (selectedVideo?.preview) {
      URL.revokeObjectURL(selectedVideo.preview);
    }
    setSelectedVideo(null);
    setVideoCaption('');
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

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Se tiver áudio gravado, mostrar interface de preview/envio
  if (audioUrl && audioBlob) {
    return (
      <div className="border-t border-[hsl(var(--avivar-border))] p-4 bg-[hsl(var(--avivar-card))]">
        <div className="flex items-center gap-3">
          {/* Botão cancelar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => clearRecording()}
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-10 w-10"
          >
            <Trash2 className="h-5 w-5" />
          </Button>

          {/* Player de áudio */}
          <div className="flex-1 bg-[hsl(var(--avivar-muted))] rounded-lg p-2">
            <audio 
              src={audioUrl} 
              controls 
              className="w-full h-8"
              style={{ 
                filter: 'invert(1) hue-rotate(180deg)',
              }}
            />
          </div>

          {/* Botão enviar */}
          <Button
            onClick={handleSendAudio}
            disabled={disabled}
            size="icon"
            className="shrink-0 rounded-full h-11 w-11 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)] text-white"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-[hsl(var(--avivar-muted-foreground))]">
          <span>Duração: {formatRecordingTime(recordingTime)}</span>
          <span>Áudio pronto para envio</span>
        </div>
      </div>
    );
  }

  // Interface de gravação
  if (isRecording) {
    return (
      <div className="border-t border-[hsl(var(--avivar-border))] p-4 bg-[hsl(var(--avivar-card))]">
        <div className="flex items-center gap-3">
          {/* Botão cancelar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={cancelRecording}
            className="text-[hsl(var(--avivar-muted-foreground))] hover:text-red-500 hover:bg-red-500/10 h-10 w-10"
          >
            <Trash2 className="h-5 w-5" />
          </Button>

          {/* Indicador de gravação */}
          <div className="flex-1 flex items-center gap-3 bg-[hsl(var(--avivar-muted))] rounded-lg px-4 py-3">
            {/* Indicador pulsante */}
            <div className="relative">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
            </div>
            
            <span className="text-[hsl(var(--avivar-foreground))] font-medium">
              Gravando...
            </span>
            
            <span className="text-[hsl(var(--avivar-muted-foreground))] font-mono">
              {formatRecordingTime(recordingTime)}
            </span>
          </div>

          {/* Botão parar e enviar */}
          <Button
            onClick={stopRecording}
            size="icon"
            className="shrink-0 rounded-full h-11 w-11 bg-red-500 hover:bg-red-600 text-white"
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        </div>

        <div className="flex items-center justify-center mt-2 text-xs text-[hsl(var(--avivar-muted-foreground))]">
          <span>Clique no quadrado para parar a gravação</span>
        </div>
      </div>
    );
  }

  // Interface de preview de imagem
  if (selectedImage) {
    return (
      <div className="border-t border-[hsl(var(--avivar-border))] p-4 bg-[hsl(var(--avivar-card))]">
        <div className="flex gap-3">
          {/* Imagem preview */}
          <div className="relative shrink-0">
            <img 
              src={selectedImage.preview} 
              alt="Preview" 
              className="h-24 w-24 object-cover rounded-lg"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancelImage}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] hover:text-red-500 hover:bg-red-500/10"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Caption input e botão enviar */}
          <div className="flex-1 flex flex-col gap-2">
            <Textarea
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              placeholder="Adicionar legenda (opcional)..."
              disabled={disabled}
              className={cn(
                "min-h-[60px] max-h-[80px] resize-none",
                "bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]",
                "text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]",
                "focus:ring-[hsl(var(--avivar-primary))]"
              )}
              rows={2}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSendImage}
                disabled={disabled}
                size="sm"
                className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)] text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Imagem
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interface de preview de vídeo
  if (selectedVideo) {
    return (
      <div className="border-t border-[hsl(var(--avivar-border))] p-4 bg-[hsl(var(--avivar-card))]">
        <div className="flex gap-3">
          {/* Vídeo preview */}
          <div className="relative shrink-0">
            <video 
              src={selectedVideo.preview} 
              className="h-24 w-32 object-cover rounded-lg"
              muted
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancelVideo}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] hover:text-red-500 hover:bg-red-500/10"
            >
              <X className="h-3 w-3" />
            </Button>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                <Video className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          {/* Caption input e botão enviar */}
          <div className="flex-1 flex flex-col gap-2">
            <Textarea
              value={videoCaption}
              onChange={(e) => setVideoCaption(e.target.value)}
              placeholder="Adicionar legenda (opcional)..."
              disabled={disabled}
              className={cn(
                "min-h-[60px] max-h-[80px] resize-none",
                "bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]",
                "text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]",
                "focus:ring-[hsl(var(--avivar-primary))]"
              )}
              rows={2}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSendVideo}
                disabled={disabled}
                size="sm"
                className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)] text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Vídeo
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interface normal de input
  return (
    <div className="border-t border-[hsl(var(--avivar-border))] p-4 bg-[hsl(var(--avivar-card))]">
      {/* Hidden image input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Hidden video input */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoSelect}
        className="hidden"
      />

      <div className="flex items-end gap-2">
        {/* Left side buttons: Attachment, Emoji, Mic */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Attachment dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))] h-10 w-10"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]"
            >
              <DropdownMenuItem 
                className="gap-2 text-[hsl(var(--avivar-foreground))] cursor-pointer"
                onClick={() => imageInputRef.current?.click()}
              >
                <Image className="h-4 w-4 text-green-500" />
                Imagem
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="gap-2 text-[hsl(var(--avivar-foreground))] cursor-pointer"
                onClick={() => videoInputRef.current?.click()}
              >
                <Video className="h-4 w-4 text-purple-500" />
                Vídeo
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-[hsl(var(--avivar-foreground))] opacity-50 cursor-not-allowed">
                <FileText className="h-4 w-4 text-blue-500" />
                Documento (em breve)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Emoji picker */}
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))] h-10 w-10"
              >
                <Smile className="h-5 w-5" strokeWidth={1.5} />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="top" 
              align="start" 
              className="w-auto p-0 border-0 bg-transparent shadow-none"
              sideOffset={8}
            >
              <EmojiPicker onSelect={handleEmojiSelect} />
            </PopoverContent>
          </Popover>

          {/* Voice recording button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))] h-10 w-10"
            onClick={handleMicClick}
            disabled={disabled}
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>

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
              "min-h-[44px] max-h-[150px] resize-none",
              "bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]",
              "text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]",
              "focus:ring-[hsl(var(--avivar-primary))]"
            )}
            rows={1}
          />
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          size="icon"
          className={cn(
            "shrink-0 rounded-full h-11 w-11 transition-all",
            message.trim() 
              ? "bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)] text-white" 
              : "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))] cursor-not-allowed"
          )}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {/* Character count / hints */}
      <div className="flex items-center justify-between mt-2 text-xs text-[hsl(var(--avivar-muted-foreground))]">
        <span>Shift + Enter para nova linha</span>
        <span>{message.length}/4096</span>
      </div>
    </div>
  );
}
