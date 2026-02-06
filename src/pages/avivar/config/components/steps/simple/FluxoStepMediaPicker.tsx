/**
 * FluxoStepMediaPicker - Componente para anexar mídia a um passo do fluxo
 * 
 * Suporta: Áudio (PTT/arquivo), Imagem, Vídeo, Documento
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Paperclip, Mic, Music, Image, Video, FileText, 
  X, Forward, Upload, Trash2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { FluxoStepMedia } from '../../../types';

interface FluxoStepMediaPickerProps {
  media?: FluxoStepMedia;
  onChange: (media: FluxoStepMedia | undefined) => void;
}

type MediaTypeOption = 'audio' | 'image' | 'video' | 'document';

const MEDIA_OPTIONS: { type: MediaTypeOption; label: string; icon: React.ReactNode; accept: string }[] = [
  { type: 'audio', label: 'Áudio', icon: <Mic className="h-3.5 w-3.5" />, accept: 'audio/*' },
  { type: 'image', label: 'Imagem', icon: <Image className="h-3.5 w-3.5" />, accept: 'image/*' },
  { type: 'video', label: 'Vídeo', icon: <Video className="h-3.5 w-3.5" />, accept: 'video/*' },
  { type: 'document', label: 'Documento', icon: <FileText className="h-3.5 w-3.5" />, accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip' },
];

export function FluxoStepMediaPicker({ media, onChange }: FluxoStepMediaPickerProps) {
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedType, setSelectedType] = useState<MediaTypeOption | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio-specific state
  const [audioType, setAudioType] = useState<'ptt' | 'audio'>(media?.audio_type || 'ptt');
  const [audioForward, setAudioForward] = useState(media?.audio_forward || false);

  const handleTypeSelect = (type: MediaTypeOption) => {
    setSelectedType(type);
    if (type !== 'audio') {
      // For non-audio, trigger file upload immediately
      setTimeout(() => fileInputRef.current?.click(), 100);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedType) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `fluxo-media/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from('avivar-media')
        .upload(path, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('avivar-media')
        .getPublicUrl(path);

      const newMedia: FluxoStepMedia = {
        type: selectedType,
        url: urlData.publicUrl,
        name: file.name,
        ...(selectedType === 'audio' && {
          audio_type: audioType,
          audio_forward: audioForward,
        }),
      };

      onChange(newMedia);
      setShowTypeSelector(false);
      setSelectedType(null);
      toast.success('Mídia anexada!');
    } catch (err: any) {
      toast.error('Erro ao enviar: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAudioConfirm = () => {
    // Trigger file upload after audio config
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const handleRemoveMedia = () => {
    onChange(undefined);
    setShowTypeSelector(false);
    setSelectedType(null);
  };

  const getAccept = () => {
    return MEDIA_OPTIONS.find(o => o.type === selectedType)?.accept || '*/*';
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'audio': return media?.audio_type === 'ptt' ? <Mic className="h-3.5 w-3.5" /> : <Music className="h-3.5 w-3.5" />;
      case 'image': return <Image className="h-3.5 w-3.5" />;
      case 'video': return <Video className="h-3.5 w-3.5" />;
      case 'document': return <FileText className="h-3.5 w-3.5" />;
      default: return <Paperclip className="h-3.5 w-3.5" />;
    }
  };

  const getMediaLabel = (m: FluxoStepMedia) => {
    if (m.type === 'audio') {
      const mode = m.audio_type === 'ptt' ? 'Voz' : 'Arquivo';
      return `Áudio (${mode})${m.audio_forward ? ' - Encaminhado' : ''}`;
    }
    return m.name || m.type;
  };

  // If media already attached, show preview
  if (media) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <Badge className={cn(
          "text-xs gap-1",
          media.type === 'audio' && "bg-orange-500/20 text-orange-500 border-orange-500/30",
          media.type === 'image' && "bg-blue-500/20 text-blue-500 border-blue-500/30",
          media.type === 'video' && "bg-pink-500/20 text-pink-500 border-pink-500/30",
          media.type === 'document' && "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
        )}>
          {getMediaIcon(media.type)}
          {getMediaLabel(media)}
          {media.audio_forward && <Forward className="h-3 w-3" />}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={handleRemoveMedia}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={getAccept()}
        onChange={handleFileUpload}
      />

      {!showTypeSelector && !selectedType && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs h-7"
          onClick={() => setShowTypeSelector(true)}
        >
          <Paperclip className="h-3 w-3" /> Anexar mídia
        </Button>
      )}

      {/* Type selector */}
      {showTypeSelector && !selectedType && (
        <div className="flex items-center gap-1 mt-1">
          {MEDIA_OPTIONS.map((opt) => (
            <Button
              key={opt.type}
              variant="outline"
              size="sm"
              className="gap-1 text-xs h-7 px-2"
              onClick={() => handleTypeSelect(opt.type)}
              disabled={uploading}
            >
              {opt.icon}
              {opt.label}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowTypeSelector(false)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Audio config */}
      {selectedType === 'audio' && (
        <div className="mt-2 p-3 rounded-lg border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-muted)/0.3)] space-y-3">
          <Label className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))]">
            Como a IA deve enviar este áudio?
          </Label>
          
          <div className="flex gap-2">
            <Button
              variant={audioType === 'ptt' ? 'default' : 'outline'}
              size="sm"
              className="gap-1 text-xs flex-1"
              onClick={() => setAudioType('ptt')}
            >
              <Mic className="h-3 w-3" /> Gravado na hora
            </Button>
            <Button
              variant={audioType === 'audio' ? 'default' : 'outline'}
              size="sm"
              className="gap-1 text-xs flex-1"
              onClick={() => setAudioType('audio')}
            >
              <Music className="h-3 w-3" /> Arquivo de áudio
            </Button>
          </div>

          {audioType === 'audio' && (
            <div className="flex items-center gap-2">
              <Switch
                id="audio-forward"
                checked={audioForward}
                onCheckedChange={setAudioForward}
              />
              <Label htmlFor="audio-forward" className="text-xs flex items-center gap-1">
                <Forward className="h-3 w-3" /> Encaminhada
              </Label>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              className="gap-1 text-xs"
              onClick={handleAudioConfirm}
              disabled={uploading}
            >
              <Upload className="h-3 w-3" /> {uploading ? 'Enviando...' : 'Selecionar arquivo'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => { setSelectedType(null); setShowTypeSelector(true); }}
            >
              Voltar
            </Button>
          </div>
        </div>
      )}

      {/* Uploading state for non-audio */}
      {uploading && selectedType !== 'audio' && (
        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">Enviando...</p>
      )}
    </div>
  );
}
