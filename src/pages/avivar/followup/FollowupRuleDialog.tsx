import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Brain, Clock, Zap, Calendar, Info, Upload, Mic, Music, X, Forward, Image } from 'lucide-react';
import { TEMPLATE_VARIABLES } from '@/hooks/useFollowupTemplates';
import type { FollowupRule, CreateFollowupRuleInput } from '@/hooks/useFollowupRules';
import { useKanbanBoards } from '@/hooks/useKanbanBoards';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
 
 interface FollowupRuleDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   rule?: FollowupRule | null;
   onSave: (data: CreateFollowupRuleInput | (Partial<FollowupRule> & { id: string })) => void;
   isLoading?: boolean;
   existingRulesCount: number;
 }
 
 export function FollowupRuleDialog({
   open,
   onOpenChange,
   rule,
   onSave,
   isLoading,
   existingRulesCount,
 }: FollowupRuleDialogProps) {
   const { boards, columns } = useKanbanBoards();
   const isEditing = !!rule;
 
  const [formData, setFormData] = useState({
    name: '',
    attempt_number: existingRulesCount + 1,
    delay_value: 30,
    delay_type: 'minutes' as 'minutes' | 'hours' | 'days',
    message_template: '',
    urgency_level: 'soft' as 'soft' | 'medium' | 'urgent',
    use_ai_generation: false,
    ai_context: '',
    respect_business_hours: true,
    business_hours_start: '08:00',
    business_hours_end: '18:00',
    excluded_days: [0, 6],
    target_kanban_id: '',
    move_to_column_id: '',
    create_task_on_failure: false,
    max_attempts: 3,
    // Audio fields
    audio_url: '' as string,
    audio_type: null as 'ptt' | 'audio' | null,
    audio_forward: false,
    // Image fields
    image_url: '' as string,
    image_caption: '' as string,
  });
  
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
 
  useEffect(() => {
    if (rule) {
      let delayValue = rule.delay_minutes;
      let delayType: 'minutes' | 'hours' | 'days' = 'minutes';
      
      if (rule.delay_minutes >= 1440) {
        delayValue = rule.delay_minutes / 1440;
        delayType = 'days';
      } else if (rule.delay_minutes >= 60) {
        delayValue = rule.delay_minutes / 60;
        delayType = 'hours';
      }

      setFormData({
        name: rule.name || '',
        attempt_number: rule.attempt_number,
        delay_value: delayValue,
        delay_type: delayType,
        message_template: rule.message_template,
        urgency_level: rule.urgency_level,
        use_ai_generation: rule.use_ai_generation,
        ai_context: rule.ai_context || '',
        respect_business_hours: rule.respect_business_hours,
        business_hours_start: rule.business_hours_start || '08:00',
        business_hours_end: rule.business_hours_end || '18:00',
        excluded_days: rule.excluded_days || [0, 6],
        target_kanban_id: rule.target_kanban_id || '',
        move_to_column_id: rule.move_to_column_id || '',
        create_task_on_failure: rule.create_task_on_failure,
        max_attempts: rule.max_attempts,
        // Audio fields
        audio_url: rule.audio_url || '',
        audio_type: rule.audio_type || null,
        audio_forward: rule.audio_forward || false,
        // Image fields
        image_url: rule.image_url || '',
        image_caption: rule.image_caption || '',
      });
    } else {
      setFormData(prev => ({
        ...prev,
        name: `Tentativa ${existingRulesCount + 1}`,
        attempt_number: existingRulesCount + 1,
        audio_url: '',
        audio_type: null,
        audio_forward: false,
        image_url: '',
        image_caption: '',
      }));
    }
  }, [rule, existingRulesCount, open]);

  // Handle audio file upload
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/m4a', 'audio/mp4'];
    if (!validTypes.some(type => file.type.includes(type.split('/')[1]))) {
      toast.error('Formato de áudio não suportado. Use MP3 ou OGG.');
      return;
    }

    // Validate file size (max 16MB)
    if (file.size > 16 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 16MB.');
      return;
    }

    setIsUploadingAudio(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `followup-audio/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avivar-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avivar-media')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        audio_url: publicUrl,
        audio_type: prev.audio_type || 'ptt', // Default to PTT
      }));
      
      toast.success('Áudio enviado com sucesso!');
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast.error('Erro ao enviar áudio');
    } finally {
      setIsUploadingAudio(false);
      if (audioInputRef.current) {
        audioInputRef.current.value = '';
      }
    }
  };

  const removeAudio = () => {
    setFormData(prev => ({
      ...prev,
      audio_url: '',
      audio_type: null,
      audio_forward: false,
    }));
  };

  // Handle image file upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato de imagem não suportado. Use JPG, PNG, GIF ou WebP.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB.');
      return;
    }

    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `followup-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avivar-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avivar-media')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        image_url: publicUrl,
      }));
      
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image_url: '',
      image_caption: '',
    }));
  };

  const handleSubmit = () => {
    let delayMinutes = formData.delay_value;
    if (formData.delay_type === 'hours') delayMinutes *= 60;
    if (formData.delay_type === 'days') delayMinutes *= 1440;

    const data = {
      name: formData.name,
      attempt_number: formData.attempt_number,
      delay_minutes: delayMinutes,
      delay_type: formData.delay_type,
      message_template: formData.message_template,
      urgency_level: formData.urgency_level,
      use_ai_generation: formData.use_ai_generation,
      ai_context: formData.ai_context || null,
      respect_business_hours: formData.respect_business_hours,
      business_hours_start: formData.business_hours_start,
      business_hours_end: formData.business_hours_end,
      excluded_days: formData.excluded_days,
      target_kanban_id: formData.target_kanban_id || null,
      move_to_column_id: formData.move_to_column_id || null,
      create_task_on_failure: formData.create_task_on_failure,
      max_attempts: formData.max_attempts,
      // Audio fields
      audio_url: formData.audio_url || null,
      audio_type: formData.audio_type,
      audio_forward: formData.audio_forward,
      // Image fields
      image_url: formData.image_url || null,
      image_caption: formData.image_caption || null,
    };

    if (isEditing && rule) {
      onSave({ id: rule.id, ...data });
    } else {
      onSave(data);
    }
  };
 
   const insertVariable = (variable: string) => {
     setFormData(prev => ({
       ...prev,
       message_template: prev.message_template + variable,
     }));
   };
 
   const selectedKanbanColumns = columns.filter(c => c.kanban_id === formData.target_kanban_id);
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
         <DialogHeader>
           <DialogTitle className="text-[hsl(var(--avivar-foreground))]">
             {isEditing ? 'Editar Regra de Follow-up' : 'Nova Regra de Follow-up'}
           </DialogTitle>
           <DialogDescription className="text-[hsl(var(--avivar-muted-foreground))]">
             Configure quando e como as mensagens de follow-up serão enviadas
           </DialogDescription>
         </DialogHeader>
 
         <Tabs defaultValue="message" className="space-y-4">
           <TabsList className="bg-[hsl(var(--avivar-secondary))]">
             <TabsTrigger value="message">Mensagem</TabsTrigger>
             <TabsTrigger value="timing">Horários</TabsTrigger>
             <TabsTrigger value="automation">Automação</TabsTrigger>
             <TabsTrigger value="ai">IA</TabsTrigger>
           </TabsList>
 
           <TabsContent value="message" className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="name" className="text-[hsl(var(--avivar-foreground))]">Nome da Regra</Label>
                 <Input
                   id="name"
                   value={formData.name}
                   onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                   placeholder="Ex: Primeira abordagem"
                   className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="attempt" className="text-[hsl(var(--avivar-foreground))]">Número da Tentativa</Label>
                 <Input
                   id="attempt"
                   type="number"
                   min={1}
                   max={10}
                   value={formData.attempt_number}
                   onChange={(e) => setFormData(prev => ({ ...prev, attempt_number: parseInt(e.target.value) || 1 }))}
                   className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]"
                 />
               </div>
             </div>
 
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="text-[hsl(var(--avivar-foreground))]">Aguardar</Label>
                 <div className="flex gap-2">
                   <Input
                     type="number"
                     min={1}
                     value={formData.delay_value}
                     onChange={(e) => setFormData(prev => ({ ...prev, delay_value: parseInt(e.target.value) || 1 }))}
                     className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))] flex-1"
                   />
                   <Select
                     value={formData.delay_type}
                     onValueChange={(value: 'minutes' | 'hours' | 'days') => setFormData(prev => ({ ...prev, delay_type: value }))}
                   >
                     <SelectTrigger className="w-32 bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="minutes">Minutos</SelectItem>
                       <SelectItem value="hours">Horas</SelectItem>
                       <SelectItem value="days">Dias</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
               <div className="space-y-2">
                 <Label className="text-[hsl(var(--avivar-foreground))]">Nível de Urgência</Label>
                 <Select
                   value={formData.urgency_level}
                   onValueChange={(value: 'soft' | 'medium' | 'urgent') => setFormData(prev => ({ ...prev, urgency_level: value }))}
                 >
                   <SelectTrigger className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="soft">🌱 Suave</SelectItem>
                     <SelectItem value="medium">⚡ Médio</SelectItem>
                     <SelectItem value="urgent">🔥 Urgente</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>
 
            <div className="space-y-2">
                <Label className="text-[hsl(var(--avivar-foreground))]">Mensagem de Texto</Label>
                <Textarea
                  value={formData.message_template}
                  onChange={(e) => setFormData(prev => ({ ...prev, message_template: e.target.value }))}
                  placeholder="Olá {{primeiro_nome}}! Vi que você demonstrou interesse..."
                  className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))] min-h-[100px]"
                />
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_VARIABLES.map((v) => (
                    <Badge
                      key={v.key}
                      variant="outline"
                      className="cursor-pointer hover:bg-[hsl(var(--avivar-primary)/0.1)] border-[hsl(var(--avivar-border))]"
                      onClick={() => insertVariable(v.key)}
                    >
                      {v.key}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Audio Section */}
              <div className="space-y-3 p-4 rounded-lg border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-secondary)/0.5)]">
                <div className="flex items-center justify-between">
                  <Label className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Áudio (opcional)
                  </Label>
                </div>

                {!formData.audio_url ? (
                  <div className="space-y-2">
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav,audio/m4a"
                      onChange={handleAudioUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => audioInputRef.current?.click()}
                      disabled={isUploadingAudio}
                      className="w-full border-dashed border-[hsl(var(--avivar-border))] hover:bg-[hsl(var(--avivar-secondary))]"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploadingAudio ? 'Enviando...' : 'Enviar arquivo de áudio (MP3, OGG)'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Audio Preview */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))]">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[hsl(var(--avivar-primary)/0.2)] flex items-center justify-center">
                        <Music className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <audio controls className="w-full h-8" src={formData.audio_url}>
                          Seu navegador não suporta áudio.
                        </audio>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeAudio}
                        className="flex-shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Audio Type Selection */}
                    <div className="space-y-3">
                      <Label className="text-[hsl(var(--avivar-foreground))] text-sm">
                        Como o áudio deve aparecer para o lead?
                      </Label>
                      <RadioGroup
                        value={formData.audio_type || 'ptt'}
                        onValueChange={(value: 'ptt' | 'audio') => setFormData(prev => ({ ...prev, audio_type: value }))}
                        className="space-y-2"
                      >
                        <div className="flex items-start space-x-3 p-3 rounded-lg border border-[hsl(var(--avivar-border))] hover:bg-[hsl(var(--avivar-secondary))] cursor-pointer">
                          <RadioGroupItem value="ptt" id="ptt" className="mt-0.5" />
                          <label htmlFor="ptt" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Mic className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                              <span className="font-medium text-[hsl(var(--avivar-foreground))]">Mensagem de voz</span>
                            </div>
                            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">
                              Aparece como se você tivesse gravado na hora (bolinha com avatar)
                            </p>
                          </label>
                        </div>
                        <div className="flex items-start space-x-3 p-3 rounded-lg border border-[hsl(var(--avivar-border))] hover:bg-[hsl(var(--avivar-secondary))] cursor-pointer">
                          <RadioGroupItem value="audio" id="audio" className="mt-0.5" />
                          <label htmlFor="audio" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Music className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                              <span className="font-medium text-[hsl(var(--avivar-foreground))]">Arquivo de áudio</span>
                            </div>
                            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">
                              Aparece como um arquivo de áudio enviado (ícone de microfone laranja)
                            </p>
                          </label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Forward Option (only for audio type) */}
                    {formData.audio_type === 'audio' && (
                      <div className="flex items-center justify-between p-3 rounded-lg border border-[hsl(var(--avivar-border))]">
                        <div className="flex items-center gap-3">
                          <Forward className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                          <div>
                            <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">Marcar como "Encaminhada"</p>
                            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                              Mostra "↪ Encaminhada" acima do áudio
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={formData.audio_forward}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, audio_forward: checked }))}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Image Section */}
              <div className="space-y-3 p-4 rounded-lg border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-secondary)/0.5)]">
                <div className="flex items-center justify-between">
                  <Label className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Imagem (opcional)
                  </Label>
                </div>

                {!formData.image_url ? (
                  <div className="space-y-2">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="w-full border-dashed border-[hsl(var(--avivar-border))] hover:bg-[hsl(var(--avivar-secondary))]"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploadingImage ? 'Enviando...' : 'Enviar imagem (JPG, PNG, GIF)'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Image Preview */}
                    <div className="relative">
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-full max-h-48 object-cover rounded-lg border border-[hsl(var(--avivar-border))]"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Image Caption */}
                    <div className="space-y-2">
                      <Label className="text-[hsl(var(--avivar-foreground))] text-sm">
                        Legenda da imagem (opcional)
                      </Label>
                      <Input
                        value={formData.image_caption}
                        onChange={(e) => setFormData(prev => ({ ...prev, image_caption: e.target.value }))}
                        placeholder="Ex: Confira nossos resultados!"
                        className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
 
           <TabsContent value="timing" className="space-y-4">
             <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-secondary))]">
               <div className="flex items-center gap-3">
                 <Calendar className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                 <div>
                   <p className="font-medium text-[hsl(var(--avivar-foreground))]">Respeitar Horário Comercial</p>
                   <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                     Enviar apenas dentro do horário definido
                   </p>
                 </div>
               </div>
               <Switch
                 checked={formData.respect_business_hours}
                 onCheckedChange={(checked) => setFormData(prev => ({ ...prev, respect_business_hours: checked }))}
               />
             </div>
 
             {formData.respect_business_hours && (
               <>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label className="text-[hsl(var(--avivar-foreground))]">Início</Label>
                     <Input
                       type="time"
                       value={formData.business_hours_start}
                       onChange={(e) => setFormData(prev => ({ ...prev, business_hours_start: e.target.value }))}
                       className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[hsl(var(--avivar-foreground))]">Fim</Label>
                     <Input
                       type="time"
                       value={formData.business_hours_end}
                       onChange={(e) => setFormData(prev => ({ ...prev, business_hours_end: e.target.value }))}
                       className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]"
                     />
                   </div>
                 </div>
 
                 <div className="space-y-2">
                   <Label className="text-[hsl(var(--avivar-foreground))]">Dias Excluídos</Label>
                   <div className="flex gap-2">
                     {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => (
                       <Button
                         key={day}
                         type="button"
                         variant={formData.excluded_days.includes(idx) ? 'default' : 'outline'}
                         size="sm"
                         onClick={() => {
                           const newDays = formData.excluded_days.includes(idx)
                             ? formData.excluded_days.filter(d => d !== idx)
                             : [...formData.excluded_days, idx];
                           setFormData(prev => ({ ...prev, excluded_days: newDays }));
                         }}
                         className={formData.excluded_days.includes(idx) 
                           ? 'bg-red-500/80 hover:bg-red-600' 
                           : 'border-[hsl(var(--avivar-border))]'
                         }
                       >
                         {day}
                       </Button>
                     ))}
                   </div>
                   <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                     Dias em vermelho não receberão follow-ups
                   </p>
                 </div>
               </>
             )}
           </TabsContent>
 
           <TabsContent value="automation" className="space-y-4">
             <div className="space-y-2">
               <Label className="text-[hsl(var(--avivar-foreground))]">Mover para Kanban/Etapa</Label>
               <Select
                 value={formData.target_kanban_id || 'none'}
                 onValueChange={(value) => setFormData(prev => ({ ...prev, target_kanban_id: value === 'none' ? '' : value, move_to_column_id: '' }))}
               >
                 <SelectTrigger className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]">
                   <SelectValue placeholder="Selecione um funil (opcional)" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="none">Nenhum</SelectItem>
                   {boards.map((board) => (
                     <SelectItem key={board.id} value={board.id}>{board.name}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
 
             {formData.target_kanban_id && (
               <div className="space-y-2">
                 <Label className="text-[hsl(var(--avivar-foreground))]">Coluna de Destino</Label>
                 <Select
                   value={formData.move_to_column_id}
                   onValueChange={(value) => setFormData(prev => ({ ...prev, move_to_column_id: value }))}
                 >
                   <SelectTrigger className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]">
                     <SelectValue placeholder="Selecione uma coluna" />
                   </SelectTrigger>
                   <SelectContent>
                     {selectedKanbanColumns.map((col) => (
                       <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             )}
 
             <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-secondary))]">
              <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium text-[hsl(var(--avivar-foreground))]">Criar Tarefa se Lead Ignorar</p>
                    <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                      Se o lead não responder após todas as tentativas automáticas, cria uma tarefa na sua lista para você ligar ou enviar mensagem manualmente
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.create_task_on_failure}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, create_task_on_failure: checked }))}
                />
              </div>
  
           </TabsContent>
 
           <TabsContent value="ai" className="space-y-4">
             <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
               <div className="flex items-center gap-3">
                 <Brain className="h-5 w-5 text-purple-500" />
                 <div>
                   <p className="font-medium text-[hsl(var(--avivar-foreground))]">Personalização com IA</p>
                   <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                     A IA personaliza a mensagem para cada lead
                   </p>
                 </div>
               </div>
               <Switch
                 checked={formData.use_ai_generation}
                 onCheckedChange={(checked) => setFormData(prev => ({ ...prev, use_ai_generation: checked }))}
               />
             </div>
 
             {formData.use_ai_generation && (
               <div className="space-y-2">
                 <Label className="text-[hsl(var(--avivar-foreground))]">Contexto para a IA</Label>
                 <Textarea
                   value={formData.ai_context}
                   onChange={(e) => setFormData(prev => ({ ...prev, ai_context: e.target.value }))}
                   placeholder="Ex: Somos uma clínica de estética focada em procedimentos faciais. Tom amigável e profissional."
                   className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))] min-h-[80px]"
                 />
                 <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] flex items-center gap-1">
                   <Info className="h-3 w-3" />
                   A IA usará esse contexto para personalizar a mensagem mantendo sua intenção
                 </p>
               </div>
             )}
           </TabsContent>
         </Tabs>
 
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[hsl(var(--avivar-border))]">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || (!formData.message_template && !formData.audio_url)}
              className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
            >
              {isLoading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Regra'}
            </Button>
          </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }