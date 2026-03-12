import React, { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Link, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
}

/**
 * Hybrid image field: shows upload button for new images,
 * but keeps existing URL links working.
 */
export function ImageUploadField({ label, value, onChange, folder = 'courses', className }: ImageUploadFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<'upload' | 'url'>(value && !value.includes('supabase') ? 'url' : 'upload');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('neoacademy-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('neoacademy-images')
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast.success('Imagem enviada!');
    } catch (err: any) {
      toast.error('Erro ao enviar imagem: ' + (err.message || 'Tente novamente'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-xs text-zinc-400">{label}</Label>
        <button
          type="button"
          onClick={() => setMode(m => m === 'upload' ? 'url' : 'upload')}
          className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          {mode === 'upload' ? (
            <><Link className="h-3 w-3" /> Usar URL</>
          ) : (
            <><Upload className="h-3 w-3" /> Fazer Upload</>
          )}
        </button>
      </div>

      {mode === 'url' ? (
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://..."
          className="bg-[#0a0a0f] border-white/10 text-white"
        />
      ) : (
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="bg-[#0a0a0f] border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 gap-2 flex-1"
          >
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
            ) : (
              <><Upload className="h-4 w-4" /> Selecionar Imagem</>
            )}
          </Button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0f]">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <ImageIcon className="h-6 w-6 text-zinc-700" />
          </div>
        </div>
      )}
    </div>
  );
}
