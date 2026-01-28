import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMeetingAgendaItems, useAgendaTemplates, AGENDA_CATEGORIES } from "@/hooks/useMeetingAgenda";

interface CreateAgendaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (agendaId: string) => void;
}

export function CreateAgendaDialog({ isOpen, onClose, onCreated }: CreateAgendaDialogProps) {
  const [step, setStep] = useState<'category' | 'details'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetingTime, setMeetingTime] = useState('09:00');

  const { createAgenda } = useMeetingAgendaItems(undefined);
  const { data: templates } = useAgendaTemplates(selectedCategory || undefined);

  const selectedCategoryInfo = AGENDA_CATEGORIES.find(c => c.id === selectedCategory);

  const handleCreate = async () => {
    if (!title.trim()) return;

    createAgenda.mutate(
      {
        title,
        description: description || undefined,
        meetingDate,
        meetingTime,
        category: selectedCategory || undefined,
      },
      {
        onSuccess: (agenda) => {
          onCreated(agenda.id);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setStep('category');
    setSelectedCategory(null);
    setTitle('');
    setDescription('');
    setMeetingDate(new Date().toISOString().split('T')[0]);
    setMeetingTime('09:00');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'category' ? '📋 Nova Pauta de Reunião' : `✨ ${selectedCategoryInfo?.label || 'Nova Pauta'}`}
          </DialogTitle>
          <DialogDescription>
            {step === 'category' 
              ? 'Escolha um modelo de pauta ou crie uma personalizada'
              : 'Configure os detalhes da sua reunião'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'category' && (
          <ScrollArea className="max-h-[400px] pr-4">
            <RadioGroup
              value={selectedCategory || ''}
              onValueChange={setSelectedCategory}
              className="space-y-3"
            >
              {AGENDA_CATEGORIES.map((category) => (
                <label
                  key={category.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                    selectedCategory === category.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:bg-muted/50"
                  )}
                >
                  <RadioGroupItem value={category.id} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{category.icon}</span>
                      <span className="font-medium">{category.label}</span>
                      {selectedCategory === category.id && (
                        <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {category.description}
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </ScrollArea>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            {/* Show template preview if not custom */}
            {selectedCategory && selectedCategory !== 'custom' && templates && templates.length > 0 && (
              <Card className="bg-muted/30">
                <CardContent className="p-3">
                  <p className="text-xs font-medium mb-2 text-muted-foreground">
                    📝 Itens incluídos ({templates.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {templates.slice(0, 5).map((t, idx) => (
                      <Badge key={t.id} variant="secondary" className="text-xs">
                        {idx + 1}. {t.title.replace(/^[^\s]+\s/, '')}
                      </Badge>
                    ))}
                    {templates.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{templates.length - 5} mais
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <Label>Título da Reunião *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Alinhamento semanal do time"
              />
            </div>

            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Objetivo e contexto da reunião..."
                className="min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'details' && (
            <Button variant="ghost" onClick={() => setStep('category')}>
              Voltar
            </Button>
          )}
          {step === 'category' && (
            <Button 
              onClick={() => setStep('details')} 
              disabled={!selectedCategory}
            >
              Continuar
            </Button>
          )}
          {step === 'details' && (
            <Button 
              onClick={handleCreate} 
              disabled={!title.trim() || createAgenda.isPending}
            >
              {createAgenda.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Pauta
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
