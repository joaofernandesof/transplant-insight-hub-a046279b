/**
 * AvivarInbox - Caixa de entrada de mensagens com suporte a tema claro/escuro
 */

import React from 'react';
import { CrmInbox } from '@/components/crm/CrmInbox';
import { Sparkles } from 'lucide-react';

export default function AvivarInbox() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
          Caixa de Entrada
          <Sparkles className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
        </h1>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">Conversas via WhatsApp e Instagram</p>
      </div>
      <div className="[&_.bg-background]:bg-[hsl(var(--avivar-card))] [&_.bg-card]:bg-[hsl(var(--avivar-card))] [&_.border]:border-[hsl(var(--avivar-border))] [&_.text-foreground]:text-[hsl(var(--avivar-foreground))] [&_.text-muted-foreground]:text-[hsl(var(--avivar-muted-foreground))] [&_.text-card-foreground]:text-[hsl(var(--avivar-card-foreground))]">
        <CrmInbox />
      </div>
    </div>
  );
}
