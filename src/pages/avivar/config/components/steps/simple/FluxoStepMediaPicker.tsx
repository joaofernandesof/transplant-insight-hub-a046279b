/**
 * FluxoStepMediaPicker - Galeria de variações de mídia por passo do fluxo
 * 
 * Suporta múltiplas mídias (até 5) para rotação anti-spam no WhatsApp.
 * Tipos: Áudio (PTT/arquivo), Imagem, Vídeo, Documento
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Paperclip, Mic, Music, Image, Video, FileText, 
  X, Forward, Upload, Trash2, Plus, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { FluxoStepMedia } from '../../../types';

interface FluxoStepMediaPickerProps {
  media?: FluxoStepMedia;
  mediaVariations?: FluxoStepMedia[];
  onChange: (media: FluxoStepMedia | undefined, mediaVariations?: FluxoStepMedia[]) => void;
}

type MediaTypeOption = 'audio' | 'image' | 'video' | 'document';

const MAX_VARIATIONS = 5;

const MEDIA_OPTIONS: { type: MediaTypeOption; label: string; icon: React.ReactNode; accept: string }[] = [
  { type: 'audio', label: 'Áudio', icon: <Mic className="h-3.5 w-3.5" />, accept: 'audio/*' },
  { type: 'image', label: 'Imagem', icon: <Image className="h-3.5 w-3.5" />, accept: 'image/*' },
  { type: 'video', label: 'Vídeo', icon: <Video className="h-3.5 w-3.5" />, accept: 'video/*' },
  { type: 'document', label: 'Documento', icon: <FileText className="h-3.5 w-3.5" />, accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip' },
];

// Merge legacy media + mediaVariations into a single array
function getEffectiveVariations(media?: FluxoStepMedia, mediaVariations?: FluxoStepMedia[]): FluxoStepMedia[] {
  if (mediaVariations && mediaVariations.length > 0) return mediaVariations;
  if (media) return [media];
  return [];
}

export function FluxoStepMediaPicker({ media, mediaVariations, onChange }: FluxoStepMediaPickerProps) {
  const variations = getEffectiveVariations(media, mediaVariations);
  
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedType, setSelectedType] = useState<MediaTypeOption | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio-specific state
  const [audioType, setAudioType] = useState<'ptt' | 'audio'>('ptt');
  const [audioForward, setAudioForward] = useState(false);

  // Determine locked type: once a media is added, all variations must be same type
  const lockedType = variations.length > 0 ? variations[0].type : null;

  const handleTypeSelect = (type: MediaTypeOption) => {
    setSelectedType(type);
    if (type !== 'audio') {
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

      const newVariations = [...variations, newMedia];
      // Keep legacy media as first item, use variations array
      onChange(newVariations[0], newVariations);
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
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const handleRemoveVariation = (index: number) => {
    const newVariations = variations.filter((_, i) => i !== index);
    if (newVariations.length === 0) {
      onChange(undefined, undefined);
    } else {
      onChange(newVariations[0], newVariations);
    }
  };

  const handleAddMore = () => {
    if (lockedType) {
      // Same type as existing, skip type selector
      setSelectedType(lockedType);
      if (lockedType !== 'audio') {
        setTimeout(() => fileInputRef.current?.click(), 100);
      }
    } else {
      setShowTypeSelector(true);
    }
  };

  const getAccept = () => {
    return MEDIA_OPTIONS.find(o => o.type === selectedType)?.accept || '*/*';
  };

  const getMediaIcon = (type: string, audioType?: string) => {
    switch (type) {
      case 'audio': return audioType === 'ptt' ? <Mic className="h-3.5 w-3.5" /> : <Music className="h-3.5 w-3.5" />;
      case 'image': return <Image className="h-3.5 w-3.5" />;
      case 'video': return <Video className="h-3.5 w-3.5" />;
      case 'document': return <FileText className="h-3.5 w-3.5" />;
      default: return <Paperclip className="h-3.5 w-3.5" />;
    }
  };

  const getMediaLabel = (m: FluxoStepMedia) => {
    if (m.type === 'audio') {
      const mode = m.audio_type === 'ptt' ? 'Voz' : 'Arquivo';
      return `Áudio (${mode})${m.audio_forward ? ' ↩' : ''}`;
    }
    return m.name || m.type;
  };

  const badgeColor = (type: string) => cn(
    "text-xs gap-1",
    type === 'audio' && "bg-orange-500/20 text-orange-500 border-orange-500/30",
    type === 'image' && "bg-blue-500/20 text-blue-500 border-blue-500/30",
    type === 'video' && "bg-pink-500/20 text-pink-500 border-pink-500/30",
    type === 'document' && "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
  );

  // If there are variations, show the gallery
  if (variations.length > 0) {
    return (
      <div className="mt-2 space-y-2">
        {/* Variation badges */}
        <div className="flex flex-wrap gap-1.5">
          {variations.map((v, i) => (
            <div key={i} className="flex items-center gap-0.5">
              <Badge className={badgeColor(v.type)}>
                {getMediaIcon(v.type, v.audio_type)}
                <span className="max-w-[120px] truncate">{getMediaLabel(v)}</span>
                <span className="text-[10px] opacity-60">{i + 1}/{variations.length}</span>
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-destructive hover:text-destructive"
                onClick={() => handleRemoveVariation(i)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add more button */}
        {variations.length < MAX_VARIATIONS && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs h-7"
            onClick={handleAddMore}
          >
            <Plus className="h-3 w-3" /> Adicionar variação
          </Button>
        )}

        {/* Anti-spam indicator */}
        {variations.length >= 2 && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            {variations.length} variações — rotação anti-spam ativa
          </div>
        )}

        {/* Hidden file input for adding more */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={getAccept()}
          onChange={handleFileUpload}
        />

        {/* Audio config when adding more audio */}
        {selectedType === 'audio' && (
          <AudioConfigPanel
            audioType={audioType}
            audioForward={audioForward}
            onAudioTypeChange={setAudioType}
            onAudioForwardChange={setAudioForward}
            onConfirm={handleAudioConfirm}
            onCancel={() => setSelectedType(null)}
            uploading={uploading}
          />
        )}

        {uploading && selectedType !== 'audio' && (
          <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Enviando...</p>
        )}
      </div>
    );
  }

  // Empty state: no media yet
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
        <AudioConfigPanel
          audioType={audioType}
          audioForward={audioForward}
          onAudioTypeChange={setAudioType}
          onAudioForwardChange={setAudioForward}
          onConfirm={handleAudioConfirm}
          onCancel={() => { setSelectedType(null); setShowTypeSelector(true); }}
          uploading={uploading}
        />
      )}

      {/* Uploading state for non-audio */}
      {uploading && selectedType !== 'audio' && (
        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">Enviando...</p>
      )}
    </div>
  );
}

// Extracted audio config panel
function AudioConfigPanel({
  audioType, audioForward, onAudioTypeChange, onAudioForwardChange,
  onConfirm, onCancel, uploading,
}: {
  audioType: 'ptt' | 'audio';
  audioForward: boolean;
  onAudioTypeChange: (t: 'ptt' | 'audio') => void;
  onAudioForwardChange: (v: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  uploading: boolean;
}) {
  return (
    <div className="mt-2 p-3 rounded-lg border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-muted)/0.3)] space-y-3">
      <Label className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))]">
        Como a IA deve enviar este áudio?
      </Label>
      
      <div className="flex gap-2">
        <Button
          variant={audioType === 'ptt' ? 'default' : 'outline'}
          size="sm"
          className="gap-1 text-xs flex-1"
          onClick={() => onAudioTypeChange('ptt')}
        >
          <Mic className="h-3 w-3" /> Gravado na hora
        </Button>
        <Button
          variant={audioType === 'audio' ? 'default' : 'outline'}
          size="sm"
          className="gap-1 text-xs flex-1"
          onClick={() => onAudioTypeChange('audio')}
        >
          <Music className="h-3 w-3" /> Arquivo de áudio
        </Button>
      </div>

      {audioType === 'audio' && (
        <div className="flex items-center gap-2">
          <Switch
            id="audio-forward"
            checked={audioForward}
            onCheckedChange={onAudioForwardChange}
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
          onClick={onConfirm}
          disabled={uploading}
        >
          <Upload className="h-3 w-3" /> {uploading ? 'Enviando...' : 'Selecionar arquivo'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={onCancel}
        >
          Voltar
        </Button>
      </div>
    </div>
  );
}
