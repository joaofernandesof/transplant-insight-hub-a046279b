/**
 * Etapa 5: Nome do Atendente Virtual
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bot, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepAttendantProps {
  attendantName: string;
  companyName: string;
  onChange: (name: string) => void;
}

const suggestions = ['Ana', 'Júlia', 'Maria', 'Iza', 'Sofia', 'Clara', 'Luna', 'Mel'];

export function StepAttendant({ attendantName, companyName, onChange }: StepAttendantProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Como seu assistente virtual deve se chamar?
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Escolha um nome amigável para seu atendente de IA
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Nome Input */}
        <div className="space-y-2">
          <Label htmlFor="attendantName" className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <Bot className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
            Nome do Atendente Virtual *
          </Label>
          <Input
            id="attendantName"
            value={attendantName}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ex: Iza"
            className="text-lg bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
          />
          <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
            Nome que a IA usará para se apresentar aos pacientes
          </p>
        </div>

        {/* Suggestions */}
        <div className="space-y-2">
          <Label className="text-[hsl(var(--avivar-muted-foreground))] text-sm">
            Sugestões rápidas:
          </Label>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((name) => (
              <Button
                key={name}
                variant="outline"
                size="sm"
                onClick={() => onChange(name)}
                className={cn(
                  "border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]",
                  attendantName === name && "bg-[hsl(var(--avivar-primary)/0.1)] border-[hsl(var(--avivar-primary))]"
                )}
              >
                {name}
              </Button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {attendantName && (
          <Card className="bg-[hsl(var(--avivar-primary)/0.05)] border-[hsl(var(--avivar-primary)/0.2)]">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                <MessageCircle className="h-4 w-4" />
                Preview da apresentação:
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-[hsl(var(--avivar-card))] rounded-2xl rounded-tl-none p-4 shadow-sm border border-[hsl(var(--avivar-border))]">
                  <p className="text-[hsl(var(--avivar-foreground))]">
                    Olá! Meu nome é <strong className="text-[hsl(var(--avivar-primary))]">{attendantName}</strong> e 
                    sou assistente virtual da <strong className="text-[hsl(var(--avivar-primary))]">{companyName || 'sua clínica'}</strong>. 
                    Como posso te ajudar? 😊
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
